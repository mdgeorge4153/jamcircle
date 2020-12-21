<template>
<q-layout view="hHh lpR fFf">
  <q-header elevated>
    <q-toolbar>
      <q-toolbar-title class="text-h5">JamCircle host page</q-toolbar-title>
      </q-toolbar> </q-header>
  <q-page-container>
    <q-page>
      <q-btn :disable="this.offer == null" @click="copyOfferToClipboard">
        Copy offer to clipboard
        </q-btn>
      </q-page> </q-page-container>
  </q-layout>
</template>

<script>

import { copyToClipboard } from 'quasar';

export default {
  name: 'Host',
  data() {
    return {
      offer: null,
      users: [],
    };
  },
  mounted() {
    this.createOffer();
  },
  methods: {
    async createOffer() {
      console.log('offer');
      let stunServer = window.stunServer = "stun:stun.stunprotocol.org";
      let config = {
        iceServers: [{urls: stunServer}]
      };

      let peerConnection = new RTCPeerConnection(config);
      let offer = await peerConnection.createOffer();
      this.offer = JSON.stringify(offer);
    },
    async copyOfferToClipboard() {
      copyToClipboard(this.offer);
    }
  },
}
</script>
