import React from 'react';
import { test } from 'uvu';
import assert from 'uvu/assert';

import usePromise from '../lib';
import { mountApp, setup } from './setup';

test.before(setup);

test('same inputs compare', async () => {
  let loadTriggeredCount = 0;
  const loadData = (...args: any[]) =>
    new Promise((resolve) => {
      loadTriggeredCount++;
      resolve('data');
    });
  const ComponentA: React.FC = () => {
    const data = usePromise(loadData, [{ someDeepKey: 'x' }]);

    return <div>{data}</div>;
  };
  const ComponentB: React.FC = () => {
    const data = usePromise(loadData, [{ someDeepKey: 'x' }]);

    return <div>{data}</div>;
  };
  const app = (
    <div>
      <React.Suspense fallback="loading">
        <ComponentA />
        <ComponentB />
      </React.Suspense>
    </div>
  );

  mountApp(app);

  assert.equal(loadTriggeredCount, 1);
});

test('different inputs compare', async () => {
  let loadTriggeredCount = 0;
  const loadData = (...args: any[]) =>
    new Promise((resolve) => {
      loadTriggeredCount++;
      resolve('data');
    });
  const ComponentA: React.FC = () => {
    const data = usePromise(loadData, [{ someDeepKey: 'z' }]);

    return <div>{data}</div>;
  };
  const ComponentB: React.FC = () => {
    const data = usePromise(loadData, [{ someDeepKey: 'y' }]);

    return <div>{data}</div>;
  };
  const app = (
    <div>
      <React.Suspense fallback="loading">
        <ComponentA />
        <ComponentB />
      </React.Suspense>
    </div>
  );

  mountApp(app);

  assert.equal(loadTriggeredCount, 2);
});

test.run();
