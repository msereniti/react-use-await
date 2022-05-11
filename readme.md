
[![version](https://img.shields.io/npm/v/react-use-await.svg)](https://www.npmjs.com/package/react-use-await)
[![minified size](https://img.shields.io/bundlephobia/min/react-use-await.svg)](https://www.npmjs.com/package/react-use-await)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/react-use-await.svg)](https://www.npmjs.com/package/react-use-await)
[![downloads](https://img.shields.io/npm/dt/react-use-await.svg)](https://www.npmjs.com/package/react-use-await)

# useAwait

`2kb` handy and efficient React hook for rendering async ui. Uses `React.Suspense` under the hood and works with any kind of async functions, not only data fetching. 

## Installing

```sh
pnpm add react-use-await
# or using npm
npm install react-use-await --save
```

## Usage example

```javascript
import { useAwait, AwaitBoundary } from 'react-use-await';

const getCurrency = async (id) => await fetch(`http://sereniti.tech/static/${id}.json`).then(res => res.json());

const CurrencyView = ({ id }) => {
  const price = useAwait(getCurrency, id);

  return <div>{id}: {price}</div>
}

export const App = () => {

  return (
    <AwaitBoundary loading="loading" ErrorView={({ error }) => error.message}>
      <CurrencyView id="stonks" />
    </AwaitBoundary>
  )
}
```

[Cats example](https://github.com/phytonmk/react-use-await/tree/master/example/app.tsx)

## Server side rendering

If you want preload some data on the server side, provide `syncResolver` function to `<AwaitBoundary />`.

```javascript
import { useAwait, AwaitBoundary } from 'react-use-await';

const getCurrency = async (id) => await fetch(`http://sereniti.tech/static/${id}.json`).then(res => res.json());

const CurrencyView = ({ id }) => {
  const price = useAwait(getCurrency, id);

  return <div>{id}: {price}</div>
}

export const App = () => {
  const syncResolver = (func, [currencyId]) => {
    if (!process.env.SSR_CURRENCIES_PRELOAD) return { resolved: false };
    const currencies = JSON.parse(process.env.SSR_CURRENCIES_PRELOAD);

    if (func === getCurrency && currencies[currencyId]) {
      return { resolved: true, result: currencies[currencyId] }
    }

    return { resolved: false };
  };

  return (
    <AwaitBoundary loading="loading" ErrorView={({ error }) => error.message} syncResolver={syncResolver}>
      <CurrencyView id="stonks" />
    </AwaitBoundary>
  )
}
```


## Consistency note

Be sure that function and it's argument, provided to useAwait is consistent and doesn't changed on rerenders. Otherwise your app may fall in infinite loop of execution requests.

```diff
// Define function outside

+ const getCurrency = async (id) => { ... }

const CurrencyView = ({ id }) => {
- const getCurrency = async (id) => { ... }
  const price = useAwait(getCurrency, id);

  return <div>{id}: {price}</div>
}

// Provide plain data types to execution function

const CurrencyView = () => {
- const price = useAwait(getCurrency, [1, 2, 3]);
+ const price = useAwait(getCurrency, 1, 2, 3);

  return <div>{id}: {price}</div>
}

// If you have to provide complex object, memorize it outside AwaitBoundary

const CurrencyView = ({ someObject }) => {
- const price = useAwait(getCurrency, { ... });
+ const price = useAwait(getCurrency, someObject);

  return <div>{id}: {price}</div>
}

export const App = () => {
+ const someObject = React.useMemo(() => ({ ... }), [])

  return (
    <AwaitBoundary loading="loading" ErrorView={({ error }) => error.message}>
      <CurrencyView
+       someObject={someObject}
      />
    </AwaitBoundary>
  )
}
```



## Major update note

Versions `0.0.1 – 0.0.5` are being deprecated and not recommended for use in production.
Version `1.x.x` has same api, but backward-incompatible (requires `<AwaitBoundary />` wrapper, has no caching control, accepts arguments without array bounds) and has no footgun issues. `V0` was an attempt to adopt [vigzmv's react-promise-suspense](https://github.com/vigzmv/react-promise-suspense) with little fixes but it was a deadborn idea. The only thing `V1` got from [it's predecessor](https://github.com/phytonmk/react-use-await-v0) is the package name. 
