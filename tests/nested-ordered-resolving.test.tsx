import { restoreAll, spy } from 'nanospy';
import React from 'react';
import { afterEach, beforeAll, expect, test } from 'vitest';

import { AwaitBoundary, useAwait } from '../src/useAwait';
import { mountApp, setup } from './setup';

beforeAll(setup);

afterEach(() => {
  restoreAll();
});

test('nested ordered resolving', async () => {
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

  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(loadData.callCount).toBe(3);
  expect(loadData.calls[0]).toEqual(['A']);
  expect(loadData.calls[1]).toEqual(['B']);
  expect(loadData.calls[2]).toEqual(['C']);
  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(mountedApp.textContent).toBe('#A#B#C');

  loadData.calls = [];
  loadData.callCount = 0;
});
