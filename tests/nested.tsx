import { restoreAll, spy } from 'nanospy';
import React from 'react';
import { test } from 'uvu';
import assert from 'uvu/assert';

import { AwaitBoundary, useAwait } from '../src/useAwait';
import { mountApp, setup } from './setup';

test.before(setup);

test.after.each(() => {
  restoreAll();
});

test('nested data resolving', async () => {
  const loadData = spy((id: string) => new Promise<string>((resolve) => setTimeout(() => resolve(id), 10)));

  const Component: React.FC<{ id: string }> = ({ id }) => {
    const data = useAwait(loadData, id);

    return <div>#{data}</div>;
  };

  const app = (
    <div>
      <AwaitBoundary loading="loading">
        <Component id={'A'} />
        <AwaitBoundary loading="loading">
          <Component id={'B'} />
          <AwaitBoundary loading="loading">
            <Component id={'C'} />
          </AwaitBoundary>
        </AwaitBoundary>
      </AwaitBoundary>
    </div>
  );

  const { mountedApp } = mountApp(app);

  await new Promise((resolve) => setTimeout(resolve, 50));

  assert.is(loadData.callCount, 3);
  assert.equal(loadData.calls[0], ['A']);
  assert.equal(loadData.calls[1], ['B']);
  assert.equal(loadData.calls[2], ['C']);

  assert.is(mountedApp.textContent, '#A#B#C');

  loadData.calls = [];
  loadData.callCount = 0;
});

test.run();
