export function makeProperty(property, mutator) {
  return {
    get()      { return this.$store.state[property]; },
    set(value) { return this.$store.commit(mutator, value); },
  };
}

export function waitFor(context, name, filter = (value) => value) {
  return new Promise(function(resolve, reject) {
    const unwatch = context.watch(
      () => context[name],
      () => { if(filter(context[name])) {
              unwatch();
              resolve(context[name]);
            } },
      {immediate: true}
    );
  });
}


