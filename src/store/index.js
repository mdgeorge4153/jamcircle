import Vue from 'vue';
import Vuex from 'vuex';
import VueSocketIoExt from 'vue-socket.io-extended';
import io   from 'socket.io-client';

import rtc from './rtc';
import chat from './chat';

Vue.use(Vuex);

/* user fields:
 *   - id       : UID     (server)
 *   - username : String  (server)
 *   - icon     : String  (server)
 *   - playing  : 'muted' or 'solo' or 'ready'
 * status:
 *   - 'past' or 'future' or 'me'
 */

export default function() {

  const socket = io('');

  const store = new Vuex.Store({
    modules: {
      rtc,
      chat,
    },

    state: {
      users:  [],
      status: {},

      username:   '',
      icon:       'fab fa-itunes-note',
      playing:    'muted',
      id:         null,
      socket:     socket,

      icons: [
        { name: 'Other',  icon: 'fab fa-itunes-note' },
        { name: 'Voice',  icon: 'fas fa-microphone-alt' },
        { name: 'Guitar', icon: 'fas fa-guitar' },
        { name: 'Drums',  icon: 'fas fa-drum'   },
        { name: 'Group',  icon: 'fas fa-users'  },
      ],

    },

    getters: {
      status: (state) => (id) => state.status[id],
      index:  (state) => state.users.findIndex((user) => user.id == state.id),
      user:   (state) => (id) => state.users.find((user) => user.id == id),
    },

    mutations: {

      /** Update my metadata **************************************************/

      // TODO: (maybe) move the communication for these into actions
      // TODO: consolidate these into UPDATE_METADATA

      CHANGE_NAME(state, username) {
        state.username = username;
        this._vm.$socket.client.emit('update', { username });
      },

      CHANGE_ICON(state, icon) {
        state.icon = icon;
        this._vm.$socket.client.emit('update', { icon });
      },

      SET_PLAYING(state, playing) {
        state.playing = playing;
        this._vm.$socket.client.emit('update', { playing });
      },

      /** Connection establishment ********************************************/

      SOCKET_CONNECT(state) {
        state.id = socket.id;
        socket.emit('update', { username: state.username, icon: state.icon, playing: state.playing });
        socket.emit('log', { message: 'user agent: ' + navigator.userAgent});
      },

      SET_USERS(state, users) {
        state.users = users;

        // update past/present/future status
        let status  = 'past';
        let me      = state.id;
        for (let {id} of users) {
          if (id == me) {
            Vue.set(state.status, id, 'me');
            status = 'future';
          }
          else
            Vue.set(state.status, id, status);
        }
      },
    },

    actions: {
      /* moves this player to the tail */
      fastForward(context) {
        socket.emit('fast forward');
      },

      /* causes the head player to fastForward */
      cycle(context) {
        socket.emit('cycle');
      },

      /* receive metadata updates from server */
      socket_update(context, {users,sequence}) {
        context.commit('SET_USERS', users);
      },
    },
  });

  // SocketIO needs to be set up here instead of a boot file, because it needs
  // access to the store to register mutations and actions.  See here:
  // https://github.com/probil/vue-socket.io-extended/issues/384
  Vue.use(VueSocketIoExt, socket, { store });

  store.dispatch('initialize');

  return store;
};



