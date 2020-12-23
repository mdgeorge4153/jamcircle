import Vue from 'vue';
import Vuex from 'vuex';
import VueSocketIoExt from 'vue-socket.io-extended';
import io   from 'socket.io-client';

Vue.use(Vuex);

export default function() {
  const store = new Vuex.Store({
    state: {
        users: [],
        me: {
          username: 'Alice',
          offer: null,
          accept: null,
        },
    },

    mutations: {
      CONNECTED(state) {
        console.log("received connect mutation", state.users);
        state.me.username = "Bob";
        this._vm.$socket.client.emit('update', state.me);
      },

      UPDATED(state, users) {
        console.log("received update");
        console.log("changing state from ", state.users, " to ", users);
        state.users = users;
      },
    },

    actions: {
      socket_connect({commit}) {
        console.log("received connect action");
        commit('CONNECTED');
      },

      socket_update({commit}, users) {
        commit('UPDATED', users);
      },
    },
  });

  // SocketIO needs to be set up here instead of a boot file, because it needs
  // access to the store to register mutations and actions.  See here:
  // https://github.com/probil/vue-socket.io-extended/issues/384
  const socket = io('http://localhost:8080');
  Vue.use(VueSocketIoExt, socket, { store });

  return store;
};



