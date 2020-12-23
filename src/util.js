export function makeProperty(property, mutator) {
  return {
    get()      { return this.$store.state[property]; },
    set(value) { return this.$store.commit(mutator, value); },
  };
}

