import React from 'react';
import { test } from 'uvu';
import assert from 'uvu/assert';

import { AwaitBoundary, useAwait } from '../src/useAwait';
import { mountApp, setup } from './setup';

test.before(setup);

test('request isolation', async () => {
  const loadData = (_id: string) => new Promise<number>((resolve) => resolve(Math.random()));

  const Component: React.FC<{ id: string }> = ({ id }) => {
    const data = useAwait(loadData, id);

    return <div>{data}</div>;
  };
  const app = (
    <div>
      <AwaitBoundary loading="loading">
        <Component id={'A'} />
        sep
        <Component id={'A'} />
      </AwaitBoundary>
    </div>
  );

  const { mountedApp } = mountApp(app);

  await new Promise((resolve) => setTimeout(resolve, 10));

  const [dataA, dataB] = mountedApp.textContent.split('sep');

  assert.is(dataA.startsWith('0.'), true);
  assert.is(dataB.startsWith('0.'), true);
  assert.not.equal(dataA, dataB);
});

test.run();
