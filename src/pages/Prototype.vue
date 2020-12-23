<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title class="text-h5">JamCircle</q-toolbar-title>
        <q-space/>
        <user-info v-bind:user="me"/>
        <q-btn icon="cached" @click="cycle" />
        </q-toolbar> </q-header>
    <q-page-container>
      <q-page>
        <user-list v-bind:users="users" />
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
import UserInfo from 'components/UserInfo.vue';

const alice = {username: "Alice",        icon: "fas fa-guitar", state:'solo',  src: "https://www.w3schools.com/html/mov_bbb.mp4"};
const bob   = {username: "Bob and Jane", icon: "fas fa-users",  state:'muted', src: "https://www.w3schools.com/html/mov_bbb.mp4"};
const chuck = {username: "Chuck",        icon: "fas fa-piano", state:'solo',   src: null};
const dave  = {username: "Dave",         icon: "fas fa-drum",  state:'playing', src: null};
const me = window.me = {username: "", icon:"fas fa-drum", stream: null, state:'playing'};

let users = [alice, bob, me, chuck, dave];

export default {
  name: 'Prototype',
  components: { UserList, UserInfo },
  data () {
    return { me, users, model: 'ready' };
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
  },
  methods: {
    fastForward() {
      let n   = this.users.indexOf(me);
      this.users = this.users.slice(0,n).concat(this.users.slice(n+1), me);
      this.fixVideos();
    },
    cycle() {
      let nextSolo = this.users.findIndex((user,i) => i > 0 && user.state == "solo");
      nextSolo = nextSolo == -1 ? 1 : nextSolo;
      this.users = this.users.slice(nextSolo).concat(this.users.slice(0,nextSolo));
      this.fixVideos();
    },
    fixVideos() {
      let n   = this.users.indexOf(me);
      let src = "https://www.w3schools.com/html/mov_bbb.mp4";
      this.users.forEach((u,i) => u.src = i < n ? src
                                        : (i > n ? null : u.src));
    },
  },
}
    
</script>


