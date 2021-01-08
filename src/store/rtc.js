import Vue from 'vue';
import {waitFor} from '../util';
import {VideoSource,VideoSink} from '../rtc';

export default {

  state: {

    index:         -1,
    predID:        null, // id
    incoming:      null, // VideoSink

    succID:        null, // id
    outgoing:      null, // VideoSource

    localStream:   null, // MediaStream
    remoteStreams: {},   // {[id]: MediaStream}

    rtcConfig: {},
    vidConfig: {
      audio: false,
      video: {
        width: 320,
        height: 240,
      },
    },
  },

  getters: {
    stream: (state,g,rootState) => (id) => {
      const status = rootState.status[id];
      switch(rootState.status[id]) {
        case 'me':     return state.localStream;
        case 'past':   return state.remoteStreams == null ? null : state.remoteStreams[id];
        case 'future': return null;
      }
    },
  },

  mutations: {
    SET_MYSTREAM(state, stream) {
      state.localStream = stream;
    },

    SET_REMOTE_STREAMS(state, streams) {
      state.remoteStreams = streams;
    },

    SET_INDEX(state, index) {
      state.index = index;
    },

    SET_PRED(state, {predID, incoming, remoteStreams}) {
      state.predID        = predID;
      state.incoming      = incoming;
      state.remoteStreams = remoteStreams;
    },

    SET_SUCC(state, {succID, outgoing}) {
      state.succID   = succID;
      state.outgoing = outgoing;
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
      for (let audio of stream.getAudioTracks())
        audio.contentHint = "music";
      for (let video of stream.getVideoTracks())
        video.contentHint = "motion";

      context.commit('SET_MYSTREAM', stream);
    },

    async getVideos(context) {
      console.log("getVideos", this);
      const users = context.rootState.users.slice(0,context.getters.index);
      const localStream   = waitFor(this, (state) => state.rtc.localStream);
      const remoteStreams = waitFor(this, (state) => state.rtc.remoteStreams);

      let local = await localStream;
      let remote = await remoteStreams;

      let streams = {[context.rootState.id]: local};
      for (let u of users) {
        const stream = remote[u.id];

        for (const audio of stream.getAudioTracks())
          audio.contentHint = "music";
        for (const video of stream.getVideoTracks())
          video.contentHint = "motion";

        streams[u.id] = remote[u.id];
      }
      return streams;
    },

    async socket_update(context, {users,sequence}) {
      const n = users.findIndex((user) => user.id == context.rootState.id);
      const predID = n <= 0 ? null : users[n-1].id;

      const oldIndex = context.state.index;
      context.commit('SET_INDEX', n);
      context.dispatch('setPred', {predID, oldIndex});
    },

    setPred(context, {predID, oldIndex}) {
      if (predID == context.state.predID && context.state.index <= oldIndex)
        // no change
        return;

      // close old connection
      if (context.state.incoming)
        context.state.incoming.close();

      if (predID == null) {
        // no predecessors
        context.commit('SET_PRED', {
          incoming: null,
          remoteStreams: {},
          predID
        });
        return;
      }

      // set up to receive remote data
      const incoming = new VideoSink(
        (msg) => context.rootState.socket.emit('direct message', {recipient: predID, signal: msg}),
        context.state.rtcConfig
      );
      context.commit('SET_PRED', {incoming, predID, remoteStreams: null});
      context.rootState.socket.emit('direct message', {recipient: predID, request: true});
    },

    async handleOffer(context, offer) {
      let streams = await context.state.incoming.getTracks(offer);
      context.commit('SET_REMOTE_STREAMS', streams);
    },

    async handleRequest(context, senderID) {
      let streams  = await context.dispatch('getVideos');
      if (context.state.outgoing)
        context.state.outgoing.close();

      let outgoing = new VideoSource(
        streams,
        (msg) => context.rootState.socket.emit('direct message', {recipient: senderID, signal: msg}),
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

      console.log("my id:", context.rootState.id);
      console.log("my pred:", context.state.predID);
      console.log("my succ:", context.state.succID);
      console.log('unexpected direct message', {senderID, ...msg});
    },

  },
};
