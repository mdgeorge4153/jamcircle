<template>
  <q-dialog seamless position="top" v-model="dialog">
    <q-card style="min-width: 600px;" >
      <q-card-section>
        <div class="text-h6">Feedback</div>
      </q-card-section>

      <q-separator />

      <q-form
        @submit="onSubmit"
        @reset="onReset">

        <q-card-section style="max-height: 50vh" class="scroll">
          <table class="q-mb-lg">
            <tbody>
              <tr v-for="entry in entries" :key="entry.id">
                <td>{{ entry.name }}</td>
                <td><q-select style="width: 150px" class="q-ma-sm"
                              v-model="entry.audio"
                              label="Audio quality"
                              :options="audioOptions"
                              :disable="entry.muted"
                              :rules="[val => !!val || '* Required']"/></td>
                <td><q-select style="width: 150px" class="q-ma-sm"
                              v-model="entry.video"
                              label="Video quality"
                              :options="videoOptions"
                              :disable="entry.novid"
                              :rules="[val => !!val || '* Required']"/></td>
                <td><q-input  style="width: 150px" class="q-ma-sm"
                              v-model="entry.other"
                              label="Additional note"/> </td> </tr>

              </tbody> </table>
          <p v-if="future"><b>Note:</b> the following users are in the future, so you should not be able to see or hear them: {{ this.future }}.</p>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn type="reset"  flat label="Otherwise Good!" color="primary" />
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
    };
  },
  watch: {
    users: {
      immediate: true,
      handler() {
        this.entries  = [];
        const future  = [];
        for (const user of this.$store.state.users) {
          const status   = this.$store.getters.status(user.id);
          const username = status == 'me' ? "You" : this.$store.getters.name(user.id);
          const muted    = user.playing == 'muted' || status == 'me';
          const novid    = false;
          const me       = status == 'me';

          if (status == 'future')
            future.push(username);
          else
            this.entries.push({
              audio: me    ? {label: 'N/A', value: 'mute'} : (muted ? {label: 'Muted', value: 'mute'} : null),
              video: novid ? {label: 'No Video', value: 'mute'} : null,
              other: null,
              name:  username,
              id:    user.id,

              muted: muted,
              novid: novid,
            });
        }
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
      this.$store.dispatch('submit_poll', this.entries);
    },
    onReset() {
      for (const entry of this.entries) {
        entry.audio = entry.audio || {label: 'Sounds good', value: 'good'};
        entry.video = entry.video || {label: 'Looks good', value: 'good'};
      }
    },
  }
}
</script>
