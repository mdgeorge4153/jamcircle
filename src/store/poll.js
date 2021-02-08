export default {
  state: {
    needsPoll: false,
  },

  mutations: {
    START_POLL(state,payload) {
      console.log("stuff");
      state.needsPoll = true;
    },

    END_POLL(state, payload) {
      state.needsPoll = false;
    },
  },

  actions: {
    socket_poll(context) {
      context.commit('START_POLL');
      console.log("polling");
    },

    submit_poll(context, payload) {
      context.rootState.socket.emit('poll_result', payload);
      context.commit('END_POLL',payload);
    },
  },
};

