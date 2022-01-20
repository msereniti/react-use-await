
# useAwait

React hook for resolving promises with Suspense support.

Fork of [vigzmv's react-promise-suspense](https://github.com/vigzmv/react-promise-suspense) that has lot of wired bugs and is not longer under active development.

Inspired by [fetch-suspense](https://github.com/CharlesStover/fetch-suspense), but this one is not limited to fetch, `useAwait` works with any Promise.

[![version](https://img.shields.io/npm/v/use-await.svg)](https://www.npmjs.com/package/use-await)
[![minified size](https://img.shields.io/bundlephobia/min/use-await.svg)](https://www.npmjs.com/package/use-await)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/use-await.svg)](https://www.npmjs.com/package/use-await)
[![downloads](https://img.shields.io/npm/dt/use-await.svg)](https://www.npmjs.com/package/use-await)

## Install

```yarn
yarn add use-await
# or using npm
npm install use-await --save
```

## Example

Awaiting a fetch promise:

```jsx
import useAwait from 'use-await';

const fetchJson = async (url, params) => {
  const response = await fetch(input);

  return await response.json();
};

const MyFetchingComponent = () => {
  const data = useAwait(fetchJson, [
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

In most cases you don't need to do anything to migrate from `react-promise-suspense` to `use-await` (expect, surely imported package name replacement).

The only thing that changed in api without backward capability is that first argument of `useAwait` must persist between renders.

If first argument of `useAwait` is different (by reference) each of them will be called in infinite loop.

Migrations examples:

```diff
const MyFetchingComponent = () => {
-  const fetchData = () => {...};
+  const fetchData = React.useCallback(() => {...}, []);
  const date = useAwait(fetchData, )
}
```

```diff
+  const fetchData = () => {...};
const MyFetchingComponent = () => {
-  const fetchData = () => {...};
  const date = useAwait(fetchData, )
}
```
