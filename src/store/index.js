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

  // this is for ensuring connection
  let resolve_connected;
  let my_id = new Promise((resolve, reject) => resolve_connected = resolve);

  const store = new Vuex.Store({
    state: {
      users:  [],
      status: {},
      tracks: {},

      username: '',
      icon:     'fas fa-microphone-alt',
      playing:  'solo',

      my_id: my_id,

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
        resolve_connected(this._vm.$socket.client.id);
        this._vm.$socket.client.emit('update', { username: state.username, icon: state.icon, playing: state.playing });
      },

      SET_TRACK(state, {id, track}) {
        Vue.set(state.tracks, id, track);
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

      /* set up my video */
      async initialize(context) {
        const constraints = {
          audio: false,
          video: true,
          aspectRatio: 1.7777,
        };

        let stream = await navigator.mediaDevices.getUserMedia(constraints);
        let id     = await context.state.my_id;

        context.commit('SET_TRACK', { id, track: stream.getTracks()[0]});
      },
    },
  });

  // SocketIO needs to be set up here instead of a boot file, because it needs
  // access to the store to register mutations and actions.  See here:
  // https://github.com/probil/vue-socket.io-extended/issues/384
  const socket = io('http://localhost:8080');
  Vue.use(VueSocketIoExt, socket, { store });

  store.dispatch('initialize');

  return store;
};



