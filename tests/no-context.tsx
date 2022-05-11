import React from 'react';
import { test } from 'uvu';
import assert from 'uvu/assert';

import { AwaitBoundary, useAwait } from '../src/useAwait';
import { mountApp, setup } from './setup';

test.before(setup);

test('throw without context', async () => {
  const loadData = (...args: any[]) => new Promise<string>((resolve) => {});
  let loadDataAttempts = 0;

  const Component: React.FC = () => {
    try {
      loadDataAttempts++;
      useAwait(loadData);
    } catch (err) {
      assert.instance(err, Error);
    }

    return <div>data</div>;
  };
  const app = (
    <div>
      <Component />
    </div>
  );

  mountApp(app);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.is(loadDataAttempts, 1);
});

test.run();
