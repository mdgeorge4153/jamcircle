<!-- User is responsible for positioning elements within card, but not
     sizing.  Sizing is handled by UserList -->
<template>
  <div class="user-card text-white" v-bind:class="{ me: status == 'me' }">
    <video ref="video" autoplay />

    <div class="absolute-center">
      <q-icon v-if="status == 'future'" size="lg" name="slow_motion_video"/>
      <q-circular-progress indeterminate v-if="status == 'past' && !track" size="lg"/>
      </div>
    <!--
    <user-future v-else/>
    -->

    <div class="text-h6 absolute-top-left q-ma-sm">
      <q-icon v-if="icon" v-bind:name="icon"/>
      {{ username }}
      </div>

    <div v-if="playing == 'muted'" class="absolute-bottom-right">
      <q-chip icon="volume_off">Muted</q-chip>
      </div>

    <div v-if="playing == 'solo'"  class="absolute-bottom-right">
      <q-chip color="green" text-color="white" icon="star">Solo</q-chip>
      </div>

  </div>
</template>

<style>
.user-card {
}

.user-card > :first-child {
  width: 100%; height: 100%;
  background: black;
}

.me {
  border: 3px solid green;
}
</style>

<script>
import UserFuture from 'components/UserFuture.vue';

export default {
  name: 'User',
  components: { UserFuture },

  props: {
    username: String,
    icon:     String,
    id:       String,
    playing:  String, // one of 'solo', 'muted', or 'playing'
  },

  data() {
    return { stream: new MediaStream() };
  },
  mounted() {
    this.$refs.video.srcObject = this.stream;
    this.stream.addTrack(this.track);
  },

  computed: {
    status() {
      return this.$store.getters.status(this.id);
    },
    track() {
      return this.$store.getters.track(this.id);
    },
  },

  watch: {
    track() {
      console.log("track changed");
      this.stream.addTrack(this.track);
    },
  },

}
</script>

