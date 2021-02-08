<template>
  <q-dialog seamless position="top" v-model="dialog" stlye="background: rgba(90,60,60,0.6) !important">
    <q-card>
      <q-card-section>
        <div class="text-h6">Is it working?</div>
      </q-card-section>

      <q-separator />

      <q-form
        @submit="onSubmit">

        <q-card-section style="max-height: 50vh" class="scroll">
          <table class="q-mb-lg">
            <tbody>
              <tr v-for="entry in entries" :key="entry.id">
                <td>{{ entry.name }}</td>
                <td><q-select style="width: 150px"
                              v-model="entry.audio"
                              label="Audio quality"
                              :options="audioOptions"
                              lazy-rules
                              :rules="[val => !!val || '* Required']"/></td>
                <td><q-select style="width: 150px"
                              v-model="entry.video"
                              label="Video quality"
                              :options="videoOptions"
                              lazy-rules
                              :rules="[val => !!val || '* Required']"/></td>
                <td><q-input  style="width: 150px"
                              v-model="entry.other"
                              lazy-rules
                              :rules="[
                                val => val.length > 1 || '* Required',
                              ]"
                              label="Additional note"/> </td> </tr>

              <tr>
                <td>Your video: </td>
                <td><q-select style="width: 150px" v-model="userVideo" label="Video quality" :options="videoOptions"/></td>
                <td></td>
                <td><q-input  style="width: 150px" v-model="userNote" label="Additional note"/> </td> </tr>

              </tbody> </table>
          <p v-if="future"><b>Note:</b> the following users are in the future, so you should not be able to see or hear them: {{ this.future }}.</p>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn type="submit" flat label="Submit feedback" color="primary" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script>
export default {
  name: 'QualityPoll',
  data() {
    return {
      audioOptions: [
        { label: "Sounds good",       value: 'good' },
        { label: "Sound out of sync", value: 'sync' },
        { label: "No sound",          value: 'none' },
        { label: "Echo",              value: 'echo' },
        { label: "Low quality",       value: 'badq' },
        { label: "Too Quiet",         value: 'soft' },
        { label: "Too Loud",          value: 'loud' },
        { label: "Other",             value: 'othr' },
      ],
      videoOptions: [
        { label: "Looks good",        value: 'good' },
        { label: "Video out of sync", value: 'sync' },
        { label: "Black box",         value: 'blnk' },
        { label: "Other",             value: 'othr' },
      ],
      entries: [
      ],
      future: "",
      userVideo: null,
      userNote:  "",
    };
  },
  watch: {
    users: {
      immediate: true,
      deep: true,
      handler() {
        console.log("users handler");
        this.entries  = [];
        const future  = [];
        for (const user of this.$store.state.users) {
          console.log("adding user", user);
          const status   = this.$store.getters.status(user.id);
          const username = this.$store.getters.name(user.id);
          if (status == 'past')
            this.entries.push({
              audio: null,
              video: null,
              other: null,
              name: username,
              id:   user.id,
            });
          else if (status == 'future')
            future.push(username);
          else
            console.log("status: ", status);
        }
        console.log("future: ", future);
        if (future.length == 0)
          this.future = null;
        else
          this.future = future.join(", ");
      },
    },
  },
  computed: {
    users() { return this.$store.state.users; },
    dialog() { return this.$store.state.poll.needsPoll; },
  },

  methods: {
    onSubmit() {
      this.$store.dispatch('submit_poll', {});
    }
  }
}
</script>
