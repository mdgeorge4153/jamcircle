<template>
  <q-input
      class="text-h5"
      style="max-width: 200px"
      v-model="username"
      debounce="1000"
      dark
      placeholder="your name">
    <template v-slot:prepend>
      <q-btn flat :icon="icon" color="white">
        <q-menu>
          <q-list>
            <q-item v-for="option in icons" v-bind:key="option.name"
                    clickable v-close-popup @click="icon=option.icon">
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
import { makeProperty } from '../util.js';

export default {
  name: 'UserInfo',

  computed: {
    username: makeProperty('username', 'CHANGE_NAME'),
    icon:     makeProperty('icon',     'CHANGE_ICON'),
    icons:    makeProperty('icons',    ''),
  },
}

</script>


