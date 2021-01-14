import Vue from 'vue';

export default {

  state: {
    messages: [], // entries: {id: id, messages: string array}
  },

  mutations: {
    CHAT_MESSAGE(state, {sender: id, msg}) {
      let tail = state.messages[state.messages.length - 1];
      if (tail && tail.id == id)
        tail.messages.push(msg);
      else
        state.messages.push({id, messages: [msg]});
    },
  },

  actions: {
    socket_chat(context, {senderID, message}) {
      // TODO: sanitization?
      context.commit('CHAT_MESSAGE', {sender: senderID, msg: message});
    },

    chat(context, message) {
      context.rootState.socket.emit('chat', message);
    },
  },
};


