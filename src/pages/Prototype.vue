<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn dense flat round icon="cached" @click="cycle" />
        <q-toolbar-title class="text-h5">
          JamCircle</q-toolbar-title>
        <q-space/>
        <user-info />
        <q-btn dense flat round icon="chat" @click="chat = !chat" />
        </q-toolbar> </q-header>
    <q-page-container>
      <q-page class="column justify-center">
        <user-list />
        <audio autoplay :src-object.prop.camel="audioStream" />
        <quality-poll />
        </q-page> </q-page-container>
    <q-footer>
      <q-toolbar>
        <q-btn
          class  = "q-ma-md" color="secondary" size="xl"
          icon   = "fast_forward"
          @click = "fastForward"
        >Jump to end</q-btn>
        <q-space/>
        <q-btn-toggle size="xl"
          v-model="playing"
          toggle-color="secondary"
          push
          :options="[
            {label: 'take solo', value:'solo', icon: 'star'},
            {label: 'skip solo', value:'playing'},
            {label: 'mute',      value:'muted', icon: 'volume_off'},
          ]"
        />
        </q-toolbar> </q-footer>
    <q-drawer v-model="chat" side="right" bordered>
      <chat/>
    </q-drawer>
  </q-layout>
</template>

<style>
#window {
  width: 100vw; height: 100vh;
}
</style>

<script>
import UserList from 'components/UserList.vue';
import UserInfo from 'components/UserInfo.vue';
import Chat     from 'components/Chat.vue';
import QualityPoll from 'components/QualityPoll.vue';

import { makeProperty } from '../util.js';

export default {
  name: 'Prototype',
  components: { UserList, UserInfo, Chat, QualityPoll },

  data() {
    return {
      chat: true,
    };
  },
    
  computed: {
    playing: makeProperty('playing', 'SET_PLAYING'),
    audioStream() {
      // let result = this.$store.state.rtc.localAudio;
      let result = this.$store.getters.remoteAudio;
      console.log("audio stream: ", result);
      return result;
    },
  },
    
  methods: {
    fastForward() {
      this.$store.dispatch('fastForward');
    },
    cycle() {
      this.$store.dispatch('cycle');
    },
  },
}
    
</script>


