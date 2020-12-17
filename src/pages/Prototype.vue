<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title class="text-h5">JamCircle</q-toolbar-title>
        </q-toolbar> </q-header>
    <q-page-container>
      <q-page>
        <user-list v-bind:users="users" />
        </q-page> </q-page-container>
    <q-footer>
      <q-toolbar>
        <q-btn class="q-ma-md" color="secondary" size="xl" icon="fast_forward">Jump to end</q-btn>
        <q-space/>
        <q-btn-toggle size="xl"
          v-model="me.state"
          toggle-color="secondary"
          push
          :options="[
            {label: 'take solo', value:'solo', icon: 'star'},
            {label: 'skip solo', value:'playing'},
            {label: 'mute',      value:'muted', icon: 'volume_off'},
          ]"
        />
        </q-toolbar> </q-footer> </q-layout>
</template>

<style>
#window {
  width: 100vw; height: 100vh;
}
</style>

<script>
import UserList from 'components/UserList.vue';

const me = window.me = {username: "Me", stream: null, state:'playing'};

export default {
  name: 'Prototype',
  components: { UserList },
  data () {
    return {
      me: me,
      users: [
        {username: "Alice",        icon: "fas fa-guitar", state:'solo',  src: "https://www.w3schools.com/html/mov_bbb.mp4"},
        {username: "Bob and Jane", icon: "fas fa-users",  state:'muted', src: "https://www.w3schools.com/html/mov_bbb.mp4"},
        me,
        {username: "Chuck",        icon: "fas fa-piano", state:'solo'},
        {username: "Dave",         icon: "fas fa-drum",  state:'playing'},
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


