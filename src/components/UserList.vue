<!-- UserList is responsible for the layout and animation behavior of the Users -->
<template>
  <div class="q-pa-md">
    <div class="row wrap justify-center q-gutter-md item-start">
      <q-responsive :ratio="4/3" class="col">
        <user-future />
        </q-responsive>

      <q-responsive :ratio="4/3" class="col">
        <user username="Alice"/>
        </q-responsive>
      </div> </div>
</template>

<style>
.user-list {
  width: 100%;
  height: 100%;
}

.user-list > * {
  flex-grow: 1;
  min-width: 200px;
}

</style>

<script>
/* eslint-disable vue/no-unused-components */
import User from 'components/User.vue';
import UserFuture from 'components/UserFuture.vue';

export default {
  name: 'UserList',
  components: { User, UserFuture },
  props: {
    users: Array,
  },
};
</script>


