//Based on source: https://github.com/jbreckmckye/trkl
// Tracking for dependencies & to detect circularity
let computedTracker = [];
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
function nStore(value) {
    let subscribers = [];
    let subscribe = function (subscriber, immediate) {
        if (immediate === void 0) { immediate = true; }
        if (!subscribers.includes(subscriber))
            subscribers.push(subscriber);
        if (immediate)
            subscriber(value);
        return function () { subscribers = subscribers.filter(function (xSub) { return xSub != subscriber; }); };
    };
    function set(newValue) {
        if (newValue === value && (value === null || typeof value !== 'object')) {
            return;
        }
        let oldValue = value;
        value = newValue;
        for (let _i = 0, subscribers_1 = subscribers; _i < subscribers_1.length; _i++) {
            let sub = subscribers_1[_i];
            sub(value, oldValue);
        }
    }
    function get() {
        let runningComputation = computedTracker[computedTracker.length - 1];
        if (runningComputation) {
            subscribe(runningComputation[0], false);
        }
        return value;
    }
    //if the initial value is a function then we treat it as a `computed`
    if (typeof (value) == "function")
        return computed(value);
    /**
     * does a push update, calls all subscribers with the current value
     * Useful for when the stored variable is an Object, Array, Set, etc and the operations on those don't trigger an update, but can be triggered with this
     */
    function refresh() {
        for (let _i = 0, subscribers_2 = subscribers; _i < subscribers_2.length; _i++) {
            let sub = subscribers_2[_i];
            sub(value, value);
        }
    }
    return {
        subscribe: subscribe,
        set: set,
        get: get,
        refresh: refresh,
        update: function (updFn) {
            if (typeof (updFn) !== "function")
                return;
            set(updFn(value));
        }
    };
}
function computed(fn) {
    let self = nStore(null);
    let computationToken = [runComputed];
    runComputed();
    return self;
    function runComputed() {
        //detect circularity
        if (computedTracker.includes(computationToken))
            throw Error('Circular computation');
        computedTracker.push(computationToken);
        let result;
        try {
            result = fn();
        }
        catch (e) {
            computedTracker.pop();
            throw e;
        }
        computedTracker.pop();
        self.set(result);
    }
}

export default nStore;
