export function makeProperty(property, mutator) {
  return {
    get()      { return this.$store.state[property]; },
    set(value) { return this.$store.commit(mutator, value); },
  };
}

export function waitFor(store, getter, filter = (value) => value) {
  return new Promise(function(resolve, reject) {

    const value = getter(store.state);
    if (filter(value))
      return resolve(value);

    const unwatch = store.watch(
      getter,
      () => { const value = getter(store.state);
              if(filter(value)) {
                unwatch();
                resolve(value);
            } }
    );
  });
}


