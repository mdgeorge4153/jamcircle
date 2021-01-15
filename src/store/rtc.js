import Vue from 'vue';
import {waitFor} from '../util';
import {VideoSource,VideoSink} from '../rtc';

const AudioContext = window.AudioContext || window.webkitAudioContext;

function setupAudio(state) {
  if (state.localAudio == null || state.remoteStreams == null)
    return null;

  const ac = new AudioContext();
  const localSrc  = ac.createMediaStreamSource(state.localAudio);

  const compressor = ac.createDynamicsCompressor();
  compressor.threshold.value = -50;
  compressor.knee.value = 40;
  compressor.ratio.value = 12;
  compressor.attack.value = 0;
  compressor.release.value = 0.25;

  const filter = ac.createBiquadFilter();
  filter.Q.value = 8.30;
  filter.frequency.value = 355;
  filter.gain.value = 3.0;
  filter.type = 'bandpass';

  const combined = ac.createMediaStreamDestination();

  if (state.remoteAudio != null) {
    const remoteSrc = ac.createMediaStreamSource(state.remoteAudio);
    remoteSrc.connect(combined);
  }
  localSrc.connect(filter);
  filter.connect(compressor);
  compressor.connect(combined);
  console.log("combining streams");

  return combined.stream;
}

export default {

  state: {

    index:         -1,
    predID:        null, // id
    incoming:      null, // VideoSink

    succID:        null, // id
    outgoing:      null, // VideoSource

    localStream:   null, // MediaStream
    remoteStreams: {},   // {[id]: MediaStream}

    localAudio:    null, // MediaStream
    remoteAudio:   null, // MediaStream
    combinedAudio: null, // MediaStream; invariant: is combination of local and remote

    rtcConfig: {},
    vidConfig: {
      audio: true,
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
    remoteAudio: (state) => state.remoteAudio,
  },

  mutations: {
    SET_MYSTREAM(state, {video, audio}) {
      state.localStream = video;
      state.localAudio  = audio;
      state.combinedAudio = setupAudio(state);
    },

    SET_REMOTE_STREAMS(state, {audio, ...streams}) {
      state.remoteAudio   = audio;
      state.remoteStreams = streams;
      state.combinedAudio = setupAudio(state);
    },

    SET_INDEX(state, index) {
      state.index = index;
    },

    SET_PRED(state, {predID, incoming, remoteStreams}) {
      state.predID        = predID;
      state.incoming      = incoming;
      state.remoteStreams = remoteStreams;
      if (remoteStreams == null) {
        state.remoteAudio = null;
        state.combinedAudio = setupAudio(state);
      }
    },

    SET_SUCC(state, {succID, outgoing}) {
      state.succID   = succID;
      state.outgoing = outgoing;
    },

    SET_PLAYING(state, playing) {
      console.log("RTC Set_playing", playing != 'muted');
      for (const track of state.localAudio.getAudioTracks())
        track.enabled = (playing != 'muted');
    },
  },

  actions: {
    /* set up my video */
    async initialize(context) {
      let media = await navigator.mediaDevices.getUserMedia(context.state.vidConfig);

      const videoStream = new MediaStream();
      const audioStream = new MediaStream();

      for (let audio of media.getAudioTracks()) {
        audio.contentHint = "music";
        audioStream.addTrack(audio);
      }
      for (let video of media.getVideoTracks()) {
        video.contentHint = "motion";
        videoStream.addTrack(video);
      }

      context.commit('SET_MYSTREAM', {video:videoStream, audio:audioStream});
      context.commit('SET_PLAYING', 'muted');
    },

    async getVideos(context) {
      console.log("getVideos", this);
      const users = context.rootState.users.slice(0,context.getters.index);
      const localStream   = waitFor(this, (state) => state.rtc.localStream);
      const remoteStreams = waitFor(this, (state) => state.rtc.remoteStreams);

      let local = await localStream;
      context.rootState.socket.emit('log', {message: 'local stream ready'});
      let remote = await remoteStreams;
      context.rootState.socket.emit('log', {message: 'remote streams ready'});

      let streams = {
        [context.rootState.id]: local,
        audio: context.state.localAudio,
      };
      for (let u of users) {
        const stream  = remote[u.id];
        streams[u.id] = remote[u.id];
      }
      console.log("creating streams", streams);
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
      context.rootState.socket.emit('log', {message: 'unexpected direct message', payload: {senderID, ...msg}});
    },

  },
};
