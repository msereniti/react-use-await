# usePromise

React hook for resolving promises with Suspense support.

Fork of [vigzmv's react-promise-suspense](https://github.com/vigzmv/react-promise-suspense) that is not longer under development.

Inspired by [fetch-suspense](https://github.com/CharlesStover/fetch-suspense), but this one is not limited to fetch, `usePromise` works with any Promise.

[![version](https://img.shields.io/npm/v/react-promise-suspense.svg)](https://www.npmjs.com/package/react-promise-suspense)
[![minified size](https://img.shields.io/bundlephobia/min/react-promise-suspense.svg)](https://www.npmjs.com/package/react-promise-suspense)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/react-promise-suspense.svg)](https://www.npmjs.com/package/react-promise-suspense)
[![downloads](https://img.shields.io/npm/dt/react-promise-suspense.svg)](https://www.npmjs.com/package/react-promise-suspense)

## Install

* `npm install react-promise-suspense --save`

## Example

Awaiting a fetch promise:

```js
import usePromise from 'react-promise-suspense';

const fetchJson = async (url, params) => {
  const response = await fetch(input);

  return await response.json();
};

const MyFetchingComponent = () => {
  // usePromise(Promise, [inputs,],)
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
