# Svelte-nStore
A Svelte Store replacement with easy computed values

I created this little module when refactoring a current project. But it's a very general purpose one, so I'm sharing it.

Stores in Svelte are great but are missing a couple of points:
- Getting the current value, when not subscribed to a store is not effective [see notes for `get(myStore)` in the Svelte API doc](https://svelte.dev/docs#get)
- Creating computer/dependent stores is a bit cumbersome (It uses an array to list the dependencies, which then passed to the calculation function which has to know the exact sequence of stores in the array. It's simple for a few dependencies but gets ugly when there are more than 5 dependencies)

So, I created a general purpose store which is a replacement for the `writable` store in `svelte/store`. Fullfils the [Svelte store contract](https://svelte.dev/docs#Store_contract) and has additional features for the above two points.

The code is based largely on [trkl.js](https://github.com/jbreckmckye/trkl). Which is a very brilliant, tiny observable library. I turned it into typescript and gutted some things which were not needed for this use case. So it's still tiny. Less than 600 bytes in the minified version. 

I provided 3 versions:
- The original Typescript 
- The compiled .js
- Minified .js

## USAGE

```HTML
<script type="ts">
  import nStore from "./nStore"  

  const a=nStore(2)
  const b=nStore(2)
  
  const ab=nStore(()=>a.get()+b.get())
  
</script>
A:<input type="number" bind:value={$a}><br>
B:<input type="number" bind:value={$b}><br>
A+B= {$ab}

```
Here is the working example in Svelte REPL: https://svelte.dev/repl/d7cd506da5024d05b9d44f702aaf8a78?version=3.29.4

## API
The `nStore` is fully compatible with the Svelte `writable` store (https://svelte.dev/docs#writable). The additions are:
- A `get()` method which returns the current value, plain and simple, without messing with subscription
- A `refresh()` method which calls all subscribers with the current value. It can be useful when the store contains an object, array, etc - and the changes are not done via the `.set()` method.
- When the store is created you can pass in a **function**, instead of an initial value. As you can see with the `ab` store in the example above. This will create a *Knockout.js-style computeds with proper "magical" dependency tracking*. Which means the library figures out what the dependencies are based on the `get` methods that are getting called during the execution of the function. Pretty simple and brilliant. (also see notes below for a word of caution)

That's it. I intentionally made it as simple as possible :)

Notes:
- I use `const` for the stores because they are object references and their values are changed with the `set` method. This prevents accidental mess-ups. You can use the `$` prefixed variable in `.svelte` modules to update the values but if you accidentally forget that then the compiler will catch this error. 
- A **word of caution** on the dependency tracking: this "magical" dependency tracking depends on which other nStores' `.get()` methods get called and the next run will be based on that. It can only be an issue when you have a conditional logic in the dependency and one branch accesses different nStores than the other one. In that case the dependent store might not get recalculated in every case you would like it to happen. Here's a contrived example:

```JS
const a=nStore(1)
const b=nStore(2)
const c=nStore(3)

const abc=nStore(()=>{
  if(a.get()==1) {
    return b.get()
  } else {
    return c.get()
  }
})
```

The first run will have only `a` and `b` as dependencies. (which is not really a problem because if `a` changes the dependency will get updated - so in most cases there's no problem with this approach). 

If you want to make sure that all dependencies are correctly taken into account then simply start the function with getting all the values that you would possibly need. It's an extra step, but still pretty simple:

```JS
const a=nStore(1)
const b=nStore(2)
const c=nStore(3)

const abc=nStore(()=>{
  const [xA,xB,xC]=[a.get(), b.get(), c.get()]
  if(xA==1) {
    return xB
  } else {
    return xC
  }
})
```

