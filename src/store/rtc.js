import Vue from 'vue';

export default {

  state: {
    prevID:        null,
    prevConn:      null,
    offerHandler:  null,

    nextID:        null,
    nextConn:      null,
    answerHandler: null,

    localStream: null,
    remoteStreams: {},

    rtcConfig: {},
    vidConfig: { audio: false, video: true, aspectRatio: 1.7777 },
  },

  getters: {
    stream: (state,g,rootState) => (id) =>
      id == rootState.id ? state.localStream : state.remoteStreams[id],
    index: (s,g,rootState) => rootState.users.findIndex((user) => user.id == rootState.id),
  },

  mutations: {
    CLEAR_TRACKS(state) {
      for (let i = 0; i < state.index; i++)
        Vue.set(state.streams, users[i].id, null);
    },

    SET_MYSTREAM(state, stream) {
      state.localStream = stream;
    },

    SET_REMOTE_STREAMS(state, streams) {
      state.remoteStreams = streams;
    },

    SET_PREV(state, {prevID, prevConn, offerHandler}) {
      state.prevID       = prevID;
      state.prevConn     = prevConn;
      state.offerHandler = offerHandler;
    },

    SET_NEXT(state, {nextID, nextConn, answerHandler}) {
      state.nextID        = nextID;
      state.nextConn      = nextConn;
      state.answerHandler = answerHandler;
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

    socket_update(context, users) {
      context.dispatch('updatePrev');
      context.dispatch('updateNext');
    },

    async updatePrev(context) {
    },

    async updateNext(context) {
    },

    socket_directMessage(context, {senderID, ...msg}) {
    },

  },
};
