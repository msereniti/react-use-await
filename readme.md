## Fork note

This is is fork of [react-promise-suspense package](https://www.npmjs.com/package/react-promise-suspense) with bug fixes, tests and minor but valuable features. It's going to replace original package as soon as possible.

# usePromise

React hook for resolving promises with Suspense support.

Fork of [vigzmv's react-promise-suspense](https://github.com/vigzmv/react-promise-suspense) that is not longer under development.

Inspired by [fetch-suspense](https://github.com/CharlesStover/fetch-suspense), but this one is not limited to fetch, `usePromise` works with any Promise.

[![version](https://img.shields.io/npm/v/react-promise-suspense.svg)](https://www.npmjs.com/package/react-promise-suspense)
[![minified size](https://img.shields.io/bundlephobia/min/react-promise-suspense.svg)](https://www.npmjs.com/package/react-promise-suspense)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/react-promise-suspense.svg)](https://www.npmjs.com/package/react-promise-suspense)
[![downloads](https://img.shields.io/npm/dt/react-promise-suspense.svg)](https://www.npmjs.com/package/react-promise-suspense)

## Install

```yarn
yarn add @phytonmk/react-promise-suspense
# or using npm
npm install @phytonmk/react-promise-suspense --save
```

## Example

Awaiting a fetch promise:

```jsx
import usePromise from 'react-promise-suspense';

const fetchJson = async (url, params) => {
  const response = await fetch(input);

  return await response.json();
};

const MyFetchingComponent = () => {
  const data = usePromise(fetchJson, [
    'https://pokeapi.co/api/v2/pokemon/ditto/',
    { method: 'GET' },
  ]);

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
};

const App = () => {
  return (
    <React.Suspense fallback="Loading...">
      <MyFetchingComponent />
    </React.Suspense>
  );
};
```


## Migration from `react-promise-suspense`

In most cases you don't need to do anything to migrate from `react-promise-suspense` to `@phytonmk/react-promise-suspense` (expect, surely imported package name replacement).

The only thing that changed in api without backward capability is that first argument of `usePromise` must persist between renders.

If first argument of `usePromise` is different (by reference) each of them will be called in infinite loop.

Migrations examples:

```diff
const MyFetchingComponent = () => {
-  const fetchData = () => {...};
+  const fetchData = React.useCallback(() => {...}, []);
  const date = usePromise(fetchData, )
}
```

```diff
+  const fetchData = () => {...};
const MyFetchingComponent = () => {
-  const fetchData = () => {...};
  const date = usePromise(fetchData, )
}
```
