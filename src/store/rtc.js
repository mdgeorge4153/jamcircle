import Vue from 'vue';
import {waitFor} from '../util';
import {VideoSource,VideoSink} from '../rtc';

export default {

  state: {
    predID:        null, // id
    incoming:      null, // VideoSink

    succID:        null, // id
    outgoing:      null, // VideoSource

    localStream:   null, // MediaStream
    remoteStreams: {},   // {[id]: MediaStream}

    rtcConfig: {},
    vidConfig: { audio: false, video: true, aspectRatio: 1.7777 },
  },

  getters: {
    stream: (state,g,rootState) => (id) => {
      if (id == rootState.id)          return state.localStream;
      if (state.remoteStreams != null) return state.remoteStreams[id];
      return null;
    },
  },

  mutations: {
    SET_MYSTREAM(state, stream) {
      state.localStream = stream;
    },

    SET_REMOTE_STREAMS(state, streams) {
      state.remoteStreams = streams;
    },

    SET_PRED(state, predID) {
      if (predID == state.predID)
        // no change
        return;

      // close old connection
      if (state.incoming)
        state.incoming.close();

      if (predID == null) {
        // no predecessors
        state.incoming      = null;
        state.remoteStreams = {};
        return;
      }

      // set up to receive remote data
      state.remoteStreams = null;
      state.incoming = new VideoSink(
        (msg) => state.socket.emit('direct message', {recipient: predID, signal: msg}),
        state.rtcConfig
      );
    },

    SET_SUCC(state, {succID, outgoing}) {
      if (state.outgoing)
        state.outgoing.close();

      state.succID   = succID;
    },
  },

  actions: {
    /* set up my video */
    async initialize(context) {
      const constraints = {
        audio: false,
        video: true,
        aspectRatio: 1.7777,
      };

      let stream = await navigator.mediaDevices.getUserMedia(constraints);

      context.commit('SET_MYSTREAM', stream);
    },

    async getVideos(context) {
      console.log("getVideos", this);
      let localStream   = waitFor(this, (state) => state.rtc.localStream);
      let remoteStreams = waitFor(this, (state) => state.rtc.remoteStreams);

      let local = await localStream;
      console.log("local streams ready");
      let remote = await remoteStreams;
      console.log("remote streams ready");

      return {[context.rootState.id]: local, ...remote};
    },

    async socket_update(context, users) {
      const n = users.findIndex((user) => user.id == context.rootState.id);
      const predID = n <= 0 ? null : users[n-1].id;

      console.log('update', context.rootState.id);
      context.commit('SET_PRED', predID);

      if (predID == null)
        return;

      context.rootState.socket.emit('direct message', {recipient: predID, request: true});
    },

    async handleOffer(context, offer) {
      let streams = await context.state.incoming.getStreams(offer);
      context.commit('SET_REMOTE_STREAMS', streams);
    },

    async handleRequest(context, senderID) {
      let streams  = await context.dispatch('getVideos');
      let outgoing = new VideoSource(
        streams,
        (msg) => context.rootState.socket.emit('direct message', {recipient: succID, signal: msg}),
        context.state.rtcConfig
      );

      let offer = await outgoing.createOffer();

      context.commit('SET_SUCC', {succID: senderID, outgoing});
      context.rootState.socket.emit('direct message', {recipient: senderID, offer});
    },

    socket_directMessage(context, {senderID, ...msg}) {
      if (senderID == context.state.predID && msg.signal)
        return context.state.incoming.recv_signal(msg.signal);

      if (senderID == context.state.predID && msg.offer)
        return context.dispatch('handleOffer', msg.offer);

      if (senderID == context.state.succID && msg.signal)
        return context.state.outgoing.recv_signal(msg.signal);

      if (msg.request)
        return context.dispatch('handleRequest', senderID);

      console.log('unexpected direct message', {senderID, ...msg});
    },

  },
};
