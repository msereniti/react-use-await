import React, { useState } from 'react';
import { test } from 'uvu';
import assert from 'uvu/assert';

import useAwait from '../src';
import { mountApp, setup } from './setup';

test.before(setup);

const noop: (...args: any[]) => void = () => {
  /* do nothing */
};

test('clear cache after lifespan', async () => {
  let loadTriggeredCount = 0;
  let triggerComponentRerender = noop;
  const loadData = (...args: any[]) =>
    new Promise((resolve) => {
      loadTriggeredCount++;
      resolve('data');
    });
  const Component: React.FC = () => {
    const data = useAwait(loadData, ['cacheLifespan'], 100);
    const [, setCounter] = useState(0);

    triggerComponentRerender = () => setCounter((x) => x + 1);

    return <div>{data}</div>;
  };
  const app = (
    <div>
      <React.Suspense fallback="loading">
        <Component />
      </React.Suspense>
    </div>
  );

  mountApp(app);

  assert.equal(loadTriggeredCount, 1);
  triggerComponentRerender();
  assert.equal(loadTriggeredCount, 1);
  await new Promise((resolve) => setTimeout(resolve, 200));
  triggerComponentRerender();
  assert.equal(loadTriggeredCount, 2);
});

test.run();
