<template>
  <q-input
      class="text-h5"
      style="max-width: 200px"
      v-model="user.username"
      debounce="1000"
      dark
      placeholder="your name">
    <template v-slot:prepend>
      <q-btn flat :icon="user.icon" color="white">
        <q-menu>
          <q-list>
            <q-item v-for="option in options" v-bind:key="option.name"
                    clickable v-close-popup @click="user.icon=option.icon">
              <q-item-section avatar>
                <q-avatar v-bind:icon="option.icon"/>
                </q-item-section>
              <q-item-section>
                <q-item-label>{{option.name}}</q-item-label>
                </q-item-section>
              </q-item> </q-list> </q-menu> </q-btn>
    </template> </q-input>
</template>

<script>
export default {
  name: 'UserInfo',
  data() {
    return {
      options: [
        { name: 'Other',  icon: 'fas fa-microphone-alt' },
        { name: 'Guitar', icon: 'fas fa-guitar' },
        { name: 'Piano',  icon: 'fas fa-piano'  },
        { name: 'Drums',  icon: 'fas fa-drum'   },
        { name: 'Group',  icon: 'fas fa-users'  },
      ],
    };
  },
  props: {
    user: Object,
  },
  methods: {
    updateIcon() {
    },
  },
}
</script>


