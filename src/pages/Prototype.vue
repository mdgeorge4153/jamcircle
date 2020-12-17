<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title class="text-h3">JamCircle</q-toolbar-title>
        </q-toolbar> </q-header>
    <q-page-container>
      <q-page>
        <user-list v-bind:users="users" />
        </q-page> </q-page-container>
    <q-footer>
      <q-toolbar>
        <q-btn class="q-ma-md" color="secondary" size="xl" icon="play_arrow">Play</q-btn>
        <q-space/>
        <q-btn-toggle size="xl"
          v-model="model"
          toggle-color="secondary"
          push
          :options="[
            {label: 'want solo', value:'solo',  slot:'one'},
            {label: 'playing', value:'ready', slot:'two'},
            {label: 'muted', value:'muted', slot:'three'},
          ]"
        /> <!--
          <template v-slot:one>
            <q-icon name="star"/>
            Ready to solo
            </template>
          <template v-slot:two>
            <q-icon name="volume_on">Recording</q-icon>
            </template>
          <template v-slot:three>
            <q-icon name="volume_off">Muted</q-icon>
            </template>
          </q-btn-toggle> -->
        </q-toolbar> </q-footer> </q-layout>
</template>

<style>
#window {
  width: 100vw; height: 100vh;
}
</style>

<script>
import UserList from 'components/UserList.vue';

const me = window.me = {username: "Me", stream: null};

export default {
  name: 'Prototype',
  components: { UserList },
  data () {
    return {
      users: [
        {username: "Alice",        icon: "fas fa-guitar", solo: true,  src: "https://www.w3schools.com/html/mov_bbb.mp4"},
        {username: "Bob and Jane", icon: "fas fa-users",  muted: true, src: "https://www.w3schools.com/html/mov_bbb.mp4"},
        me,
        {username: "Chuck",        icon: "fas fa-piano", solo: true},
        {username: "Dave",         icon: "fas fa-drum"},
      ],
      model: 'ready',
    };
  },
  mounted() {
    console.log("mounted");
    const constraints = {
      audio: false,
      video: true,
      aspectRatio: 1.7777,
    }
    navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => me.stream = stream);
  }
}
    
</script>


