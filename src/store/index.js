import Vue from 'vue';
import Vuex from 'vuex';
import VueSocketIoExt from 'vue-socket.io-extended';
import io   from 'socket.io-client';

import rtc from './rtc';

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
  socket.onAny(function(msg,args) {
    console.log('socket.io recevice message: ', msg, args);
  });
  socket.on('update', function (msg) {
    console.log('socket.io receied update', msg);
  });

  const store = new Vuex.Store({
    modules: {
      rtc,
    },

    state: {
      users:  [],
      status: {},

      username:   '',
      icon:       'fas fa-microphone-alt',
      playing:    'solo',
      id:         null,
      socket:     socket,

      icons: [
        { name: 'Other',  icon: 'fas fa-microphone-alt' },
        { name: 'Guitar', icon: 'fas fa-guitar' },
        { name: 'Drums',  icon: 'fas fa-drum'   },
        { name: 'Group',  icon: 'fas fa-users'  },
      ],

    },

    getters: {
      status: (state) => (id) => state.status[id],
      index:  (state) => state.users.findIndex((user) => user.id == state.id),
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
        state.id = this._vm.$socket.client.id;
        this._vm.$socket.client.emit('update', { username: state.username, icon: state.icon, playing: state.playing });
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
        this._vm.$socket.client.emit('fast forward');
      },

      /* causes the head player to fastForward */
      cycle(context) {
        this._vm.$socket.client.emit('cycle');
      },

      /* receive metadata updates from server */
      socket_update(context, {users,sequence}) {
        console.log('socket_update', {users,sequence});
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



