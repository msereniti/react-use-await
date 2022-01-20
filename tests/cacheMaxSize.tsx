import React, { useState } from 'react';
import { test } from 'uvu';
import assert from 'uvu/assert';

import useAwait from '../src';
import { mountApp, setup } from './setup';

test.before(setup);

const noop: (...args: any[]) => void = () => {
  /* do nothing */
};

test("shift cache if it's over the maxSize", async () => {
  let loadTriggeredCount = 0;
  let triggerNewRequest = noop;
  const loadData = (...args: any[]) =>
    new Promise((resolve) => {
      loadTriggeredCount++;
      resolve('data');
    });
  const Component: React.FC = () => {
    const [counter, setCounter] = useState(0);
    const data = useAwait(loadData, [counter], { maxSize: 3 });

    triggerNewRequest = () => setCounter((x) => x + 1);

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
  triggerNewRequest();
  assert.equal(loadTriggeredCount, 1);
  triggerNewRequest();
  assert.equal(loadTriggeredCount, 1);
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(loadTriggeredCount, 1);
  triggerNewRequest();
  assert.equal(loadTriggeredCount, 2);
});

test.run();
