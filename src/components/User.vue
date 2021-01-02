<!-- User is responsible for positioning elements within card, but not
     sizing.  Sizing is handled by UserList -->
<template>
  <div class="user-card text-white" v-bind:class="{ me: status == 'me' }">
    <video ref="video" autoplay :src-object.prop.camel="stream" />

    <div class="absolute-center">
      <q-icon v-if="status == 'future'" size="lg" name="slow_motion_video"/>
      <q-circular-progress indeterminate v-if="status == 'past' && !stream" size="lg"/>
      </div>
    <!--
    <user-future v-else/>
    -->

    <div class="text-h6 absolute-top-left q-ma-sm">
      <q-icon v-if="icon" v-bind:name="icon"/>
      {{ username }} {{ id.substring(0,5) }}
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
.user-card video {
  transform: scaleX(-1);
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

  computed: {
    status() {
      return this.$store.getters.status(this.id);
    },

    stream() {
      return this.$store.getters.stream(this.id);
    },
  },
}
</script>

