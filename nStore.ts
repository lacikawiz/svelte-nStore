//Based on source: https://github.com/jbreckmckye/trkl

type updateFnT<T> = (value: T) => void
export type nStoreT<T> = {
  subscribe: (subscription: updateFnT<T>) => (() => void),
  set: updateFnT<T>,
  update: (updateFn: (value: T) => T) => void,
  get: () => T,
  refresh: () => void,
}

// Tracking for dependencies & to detect circularity
let computedTracker: any[] = [];

/**
 * nStore: Svelte store contract compatible object with advanced features.
 * 
 * Usage: 
 * - nStore(initVal) - create a new store with an initial value
 * - nStore(()=>{..}) - create a computed value. Inside the function, use the `.get` method of the other nStore variables in order to signal dependency
 * 
 * Methods provided.
 * - subscribe(fn) : standard [Svelte Store subscribe](https://svelte.dev/docs#Store_contract)
 * - set(value) : updates the value, and calls subscribers if value is different from previous
 * - update(fn) : runs the given function with the current value as its parameter and sets the value to the result of the function
 * - get() : returns the current value of the store
 */
function nStore<T>(value:T):nStoreT<T> {
  let subscribers: ((val:any,oldVal?:any)=>void)[] = [];

  let subscribe = (subscriber: (val: any) => void, immediate=true) => {
    if (!subscribers.includes(subscriber)) subscribers.push(subscriber);
    if (immediate) subscriber(value);

    return ()=>{subscribers=subscribers.filter(xSub=>xSub!=subscriber)}
  }

  function set(newValue:any) {
    if (newValue === value && (value === null || typeof value !== 'object')) {
      return;
    }
    let oldValue = value;
    value = newValue;

    for (let sub of subscribers){ sub(value,oldValue) }
  }

  function get() {
    let runningComputation = computedTracker[computedTracker.length - 1];
    if (runningComputation) {
      subscribe(runningComputation[0],false);
    }
    return value;
  }

  //if the initial value is a function then we treat it as a `computed`
  if (typeof(value) == "function") return computed((value as unknown) as ()=>T);

  /**
   * does a push update, calls all subscribers with the current value
   * Useful for when the stored variable is an Object, Array, Set, etc and the operations on those don't trigger an update, but can be triggered with this
   */
  function refresh() {
    for (let sub of subscribers) { sub(value, value) }
  }

  return {
    subscribe,
    set,
    get,
    refresh,
    update: (updFn: updateFnT<T>) => {
      if (typeof (updFn) !== "function") return
      set(updFn(value))
    }
  }
}

function computed<T>(fn: ()=>T ) {
  let self = nStore(null);
  let computationToken: (()=>void)[] = [runComputed]

  runComputed();
  return self;

  function runComputed() {
    //detect circularity
    if (computedTracker.includes(computationToken)) throw Error('Circular computation');

    computedTracker.push(computationToken);
    let result;
    try {
      result = fn();
    } catch (e) {
      computedTracker.pop();
      throw e
    }
    computedTracker.pop();
    self.set(result);    
  }
}

export default nStore
