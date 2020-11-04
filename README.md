# Svelte-nStore
A Svelte Store replacement with easy computed values

I created this little module when refactoring a current project. But it's a very general purpose one, so I'm sharing it.

Stores in Svelte are great but are missing a couple of points:
- Getting the current value, when not subscribed to a store is a pain in the rear (and there are legitimate cases when it's needed)
- Creating computer/dependent stores is a bit cumbersome

So, I created a general purpose store which is a replacement for the `writable` store in `svelte/store`. Fullfils the [Svelte store contract](https://svelte.dev/docs#Store_contract) and has additional features for the above two point.

The code is based largely on [trkl.js](https://github.com/jbreckmckye/trkl). Which is a very brilliant, tiny observable library. I turned it into typescript and gutted some things which were not needed for this use case. 

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
- There are a `get()` method which returns the current value, plain and simple, without messing with subscription
- When the store is created you can pass in a **function**, instead of an initial value. As you can see with the `ab` store in the example above. This will create a *Knockout.js-style computeds with proper "magical" dependency tracking*. Which means the library figures out what the dependencies are based on the `get` methods that are getting called during the execution of the function. Pretty simple and brilliant.

That's it. I intentionally made it as simple as possible :)

Notes:
- I use `const` for the stores because they are object references and their values are changed with the `set` method. This prevents accidental mess-ups. You can use the `$` prefixed variable in `.svelte` modules to update the values but if you accidentally forget that then the compiler will catch this error. 
