<template>
  <video :src="src" autoplay loop />
</template>

<script>
export default {
  props: {
    src: String,
  },
}
</script>

<style>
video {
  background: black;
}
</style>
