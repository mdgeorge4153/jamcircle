<!-- User is responsible for positioning elements within card, but not
     sizing.  Sizing is handled by UserList -->
<template>
  <div class="user-card text-white">
    <user-video  v-if="stream" :stream="stream" />
    <user-dummy  v-else-if="src" :src="src" />
    <user-future v-else/>

    <div class="text-h6 absolute-bottom q-ma-sm">
      <q-icon v-if="icon" v-bind:name="icon"/>
      {{ username }}
      </div>

    <div v-if="muted" class="absolute-top-right">
      <q-chip icon="volume_off">Muted</q-chip>
      </div>

    <div v-if="solo"  class="absolute-top-right">
      <q-chip icon="star">Solo</q-chip>
      </div>

  </div>
</template>

<style>
.user-card {
}

.user-card > :first-child {
  width: 100%; height: 100%;
}
</style>

<script>
import UserFuture from 'components/UserFuture.vue';
import UserVideo  from 'components/UserVideo.vue';
import UserDummy  from 'components/UserDummy.vue';

export default {
  name: 'User',
  components: { UserFuture, UserVideo, UserDummy },
  props: {
    username: String,
    icon:     String,
    image:    String,
    muted:    Boolean,
    stream:   MediaStream,
    src:      String,
    solo:     Boolean,
  },
  watch: {
    stream(newV, oldV) {
      console.log("changed stream from", oldV, " to ", newV);
    },
  }
}
</script>

