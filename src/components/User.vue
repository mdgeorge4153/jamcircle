<!-- User is responsible for positioning elements within card, but not
     sizing.  Sizing is handled by UserList -->
<template>
  <div class="user-card text-white">
    <video ref="video" autoplay />
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
    track:    MediaStreamTrack,
    status:   String,
  },
  watch: {
    stream(newV, oldV) {
      console.log("changed stream from", oldV, " to ", newV);
    },
    src(newV, oldV) {
      console.log("changed stream from", oldV, " to ", newV);
    }
  }
}
</script>

