<template>
  <div class="q-pa-md column justify-between" style="height: 100%;">
    <q-scroll-area
        class="col q-mb-md"
        ref="chatArea"
        >
      <q-chat-message
        v-for="entry in entries"
        :name="username(entry.id)"
        :text="entry.messages"
        :sent="entry.id == $store.state.id"
        /> </q-scroll-area>
    <q-form @submit.prevent="send">
      <q-input bottom-slots standout="bg-secondary text-white" v-model="text" ref="chat">
        <template v-slot:append>
          <q-btn type="submit" round dense flat icon="send" @click="send"/>
        </template>
      </q-input>
    </q-form>
  </div> 
</template>

<script>
export default {
  name: 'Chat',

  data() {
    return {
      text: '',
    };
  },

  computed: {
    entries() { return this.$store.state.chat.messages; },
    my_id()   { return this.$store.state.id; },
  },

  watch: {
    entries: {
      deep: true,
      handler() {
        console.log("watch");
        const scrollArea   = this.$refs.chatArea;
        const scrollTarget = scrollArea.getScrollTarget();
        scrollArea.setScrollPosition(scrollTarget.scrollHeight, 300);
      },
    },
  },

  methods: {
    send() {
      this.$store.dispatch('chat', this.text);
      this.text = "";
      this.$refs.chat.focus();
    },

    username(id) {
      const user = this.$store.getters.user(id);
      if (!user || !user.username)
        return "Nameless jammer";
      return user.username;
    }
  },
}
</script>

