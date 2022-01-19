import React, { useState } from 'react';
import { test } from 'uvu';
import assert from 'uvu/assert';

import usePromise from '../src';
import { mountApp, setup } from './setup';

test.before(setup);

const noop: (...args: any[]) => void = () => {
  /* do nothing */
};

test('uses custom isEqual', async () => {
  let loadTriggeredCount = 0;
  let triggerComponentRerender = noop;
  const loadData = (...args: any[]) =>
    new Promise((resolve) => {
      loadTriggeredCount++;
      resolve('data');
    });
  const Component: React.FC = () => {
    const data = usePromise(loadData, [Math.random()], { isEqual: () => true });
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
  await new Promise((resolve) => setTimeout(resolve, 200));
  assert.equal(loadTriggeredCount, 1);
});

test.run();
