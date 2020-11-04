//Based on source: https://github.com/jbreckmckye/trkl

type updateFnT = (value: any) => void
type nStoreT = {
  subscribe: (subscription: updateFnT) => (() => void),
  set: updateFnT,
  update: (updateFn: (value: any) => any) => void,
  get: () => any,
}

// Computations are a tuple of: [ subscriber ]
let computedTracker: any[] = [];

/**
 * nStore: Svelte store contract compatible object with advanced features.
 * 
 * Usage: 
 * - nStore(initVal) - create a new store
 * - nStore(()=>{..}) - create a computed value. Inside the function, use the `.get` method of the other nStore variables in order to signal dependency
 * 
 * @param value 
 */
function nStore(value:any):nStoreT {
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
  if (typeof(value) == "function") return computed(value);

  return {
    subscribe,
    set,
    get,
    update: (updFn: updateFnT) => {
      if (typeof (updFn) !== "function") return
      set(updFn(value))
    }
  }
}

function computed(fn: ()=>any ) {
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
