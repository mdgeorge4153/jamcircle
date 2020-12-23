
<template>
<q-layout view="hHh lpR fFf">
  <q-header elevated>
    <q-toolbar>
      <q-toolbar-title class="text-h5">JamCircle client page</q-toolbar-title>
      </q-toolbar> </q-header>
  <q-page-container>
    <q-page>
      <q-input v-model="me.username" />
      Users: <ul>
        <li v-for="user in users" :key="user.socketID">{{JSON.stringify(user)}}</li> </ul>
      </q-page> </q-page-container>
  </q-layout>
</template>

<script>
export default {
  name: 'Client',

  computed: {
    me()    { return this.$store.state.me; },
    users() { return this.$store.state.users; },
  },
    

  methods: {

    async connect () {
      console.log('connect: ', this.offer);
      let offer = JSON.valueOf(this.offer);

    },
  },
}
</script>
