<template>
  <video ref="video" autoplay />
</template>

<script>
export default {
  props: {
    stream: MediaStream,
  },
  watch: {
    stream: function(oldValue,newValue) {
      console.log("updating srcObject to ", newValue);
      this.$refs.video.srcObject=newValue;
    },
  },
  mounted() {
    this.$refs.video.srcObject=this.stream;
    console.log("mounted; stream value is ", this.stream);
  }
}
</script>

