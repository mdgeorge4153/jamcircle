import Vue from 'vue';
import Vuex from 'vuex';
import VueSocketIoExt from 'vue-socket.io-extended';
import io   from 'socket.io-client';

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
  const store = new Vuex.Store({
    state: {
      users:  [],
      status: {},
      tracks: {},

      username: '',
      icon:     'fas fa-microphone-alt',
      playing:  'solo',

      icons: [
        { name: 'Other',  icon: 'fas fa-microphone-alt' },
        { name: 'Guitar', icon: 'fas fa-guitar' },
        { name: 'Drums',  icon: 'fas fa-drum'   },
        { name: 'Group',  icon: 'fas fa-users'  },
      ],

    },

    getters: {
      status: (state) => (id) => state.status[id],
      track:  (state) => (id) => state.tracks[id],
    },

    mutations: {
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

      SOCKET_CONNECT(state) {
        this._vm.$socket.client.emit('update', { username: state.username, icon: state.icon, playing: state.playing });
      },

      SOCKET_UPDATE(state, users) {
        state.users = users;
        let status  = 'past';
        let me      = this._vm.$socket.client.id;
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
        // TODO
      },

      /* causes the head player to fastForward */
      cycle(context) {
        this._vm.$socket.client.emit('cycle');
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



