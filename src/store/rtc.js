import Vue from 'vue';

export default {

  state: {
    prevID:        null,
    prevConn:      null,
    offerHandler:  null,

    nextID:        null,
    nextConn:      null,
    answerHandler: null,

    tracks:    {},

    rtcConfig: {},
    vidConfig: { audio: false, video: true, aspectRatio: 1.7777 },
  },

  getters: {
    track: (state) => (id) => state.tracks[id],
    index: (s,g,rootState) => rootState.users.findIndex((user) => user.id == rootState.id),
  },

  mutations: {
    CLEAR_TRACKS(state) {
      for (let i = 0; i < state.index; i++)
        Vue.set(state.tracks, users[i].id, null);
    },

    SET_TRACK(state, track) {
      Vue.set(state.tracks, track.contentHint, track);
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
      let id     = await context.rootState.id_promise;

      console.log(stream.getTracks());
      let track  = stream.getTracks()[0];
      track.contentHint = id;
      context.commit('SET_TRACK', track);
    },

    socket_update(context, users) {
      context.dispatch('updatePrev');
      context.dispatch('updateNext');
    },

    async updatePrev(context) {
      let n = context.getters.index;
      const prevID = n <= 0 ? null : context.rootState.users[n - 1].id;

      if (prevID == context.state.prevID)
        // no change
        return;

      // fast-forwarding: nullify all past tracks
      context.commit('CLEAR_TRACKS');

      // TODO: tear down old connection

      if (prevID == null)
        // we're the soloist; no incoming streams
        return;

      // set up new incoming RTC stream
      const peer  = new RTCPeerConnection(context.state.rtcConfig);
      // receive tracks from prev
      peer.addEventListener('track', function(event) {
        console.log('received track', track);
        context.commit('SET_TRACK', track);
      });

      const offer = await new Promise(function (offerHandler,reject) {
        context.commit('SET_PREV', {prevID, prevConn:peer, offerHandler});
      });

      console.log("offer received");

      peer.setRemoteDescription(offer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      this._vm.$socket.client.emit('direct message', {recipient: prevID, answer});

      // forward ICE candidates to prev
      const that = this;
      peer.addEventListener('icecandidate', function(event) {
        console.log("ice event: ", event);
        if (event.candidate)
          that._vm.$socket.client.emit('direct message', {recipient: prevID, candidate: event.candidate});
      });

      peer.addEventListener('connectionstatechange', function (event) {
        if (peer.connectionState == 'connected')
          console.log('connected!');
      });
    },

    async updateNext(context) {
      let n = context.getters.index;
      const nextID = n == context.rootState.users.length - 1 || n < 0
                   ? null : context.rootState.users[n + 1].id;

      if (nextID == context.state.nextID)
        // no change
        return;

      // TODO: tear down old connection

      // set up new RTC offer
      if (nextID == null)
        return;

      // set up new outgoing RTC stream
      const peer  = new RTCPeerConnection(context.state.rtcConfig);
      const offer = await peer.createOffer({offerToReceiveVideo: 1});

      await peer.setLocalDescription(offer);
      const that = this;
      const answer = await new Promise(function (answerHandler, reject) {
        context.commit('SET_NEXT', {nextID, nextConn: peer, answerHandler});
        that._vm.$socket.client.emit('direct message', {recipient: nextID, offer});
      });

      console.log("answer received");

      await peer.setRemoteDescription(answer);

      // forward ICE candidates to prev
      peer.addEventListener('icecandidate', function (event) {
        console.log("ice event: ", event);
        if (event.candidate)
          this._vm.$socket.client.emit('direct message', {recipient: nextID, candidate: event.candidate});
      });

      // wait for connection
      await new Promise(function (resolve, reject) {
        peer.addEventListener('connectionstatechange', function (event) {
          if (peer.connectionState == 'connected')
            resolve();
            console.log("connected!");
        });
      });
      
      // forward tracks to remote peer
      for (let i = 0; i <= context.getters.index; i++) {
        let id     = context.rootState.users[i].id;
        let stream = new MediaStream();
        let unsubscribe = this._vm.$watch(
          () => context.state.tracks[id], // watch expression
          function() {                    // callback
            let track = context.state.tracks[id];
            console.log("track watch callback", id, track);
            if (track) {
              console.log("adding track", track, stream);
              peer.addTrack(track, stream);
            }
          },
          { immediate: true }
        );
      }
    },

    socket_directMessage(context, {senderID, ...msg}) {
      console.log("received direct message");
      console.log("   prevID: ", context.state.prevID);
      console.log("   nextID: ", context.state.nextID);
      console.log("   msg:    ", msg);

      if(senderID == context.state.prevID       && msg.offer)
        context.state.offerHandler(msg.offer);

      else if (senderID == context.state.prevID && msg.candidate)
        context.state.prevConn.addIceCandidate(msg.candidate);

      else if (senderID == context.state.nextID && msg.answer)
        context.state.answerHandler(msg.answer);

      else if (senderID == context.state.nextID && msg.candidate)
        context.state.nextConn.addIceCandidate(msg.candidate);

      else
        console.log('warning: unexpected direct message');
    },

  },
};
