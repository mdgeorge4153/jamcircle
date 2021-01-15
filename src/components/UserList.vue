<!-- UserList is responsible for the layout and animation behavior of the Users -->
<template>
  <div class="q-pa-md">
    <transition-group name="user-list" tag="div"
                      class="user-list row wrap justify-center content-center q-gutter-md item-start">
      <q-responsive v-for="user in users" v-bind:key="user.id" :ratio="4/3" class="col" style="min-width:250px; max-width: 250px">
        <user v-bind="user" />
        </q-responsive> </transition-group> </div>
</template>

<style>
.user-list-move {
  transition: transform 1s;
}

</style>

<script>
/* eslint-disable vue/no-unused-components */
import User from 'components/User.vue';

export default {
  name: 'UserList',
  components: { User },
  computed: {
    users() { return this.$store.state.users; },
  },
};
</script>


