import React from 'react';
import { renderToString } from 'react-dom/server';
import { beforeAll, expect, test } from 'vitest';

import { AwaitBoundary, SyncResolver, useAwait } from '../src/useAwait';
import { mountApp, setup } from './setup';

beforeAll(setup);

test('ssr', async () => {
  const loadDataA = (...args: any[]) =>
    new Promise<string>((resolve) => {
      setTimeout(() => resolve('Hello data A from client side render'), 10);
    });
  const loadDataB = (...args: any[]) =>
    new Promise<string>((resolve) => {
      setTimeout(() => resolve('Hello data B from client side render'), 10);
    });

  const Component: React.FC<{ loadData: () => Promise<string> }> = ({ loadData }) => {
    const data = useAwait(loadData);

    return <div>{data}</div>;
  };
  const ssrDataResolver: SyncResolver<typeof loadDataA | typeof loadDataB> = (func) => {
    if (func === loadDataA) {
      return { resolved: true, result: 'Hello data A from server side render' };
    }
    if (func === loadDataB) {
      return { resolved: true, result: 'Hello data B from server side render' };
    }

    return { resolved: false };
  };
  const serverSideApp = (
    <div>
      <AwaitBoundary loading="loading" syncResolver={ssrDataResolver}>
        <Component loadData={loadDataA} />
        <Component loadData={loadDataB} />
      </AwaitBoundary>
    </div>
  );

  expect(renderToString(serverSideApp)).toBe('<div><!--$--><div>Hello data A from server side render</div><div>Hello data B from server side render</div><!--/$--></div>');

  const clientSideApp = (
    <div>
      <AwaitBoundary loading="loading" syncResolver={undefined}>
        <Component loadData={loadDataA} />
        <Component loadData={loadDataB} />
      </AwaitBoundary>
    </div>
  );

  const { mountedApp } = mountApp(clientSideApp);

  await new Promise((resolve) => setTimeout(resolve, 3));

  expect(mountedApp.textContent).toBe('loading');

  await new Promise((resolve) => setTimeout(resolve, 30));

  expect(mountedApp.textContent).toBe('Hello data A from client side render' + 'Hello data B from client side render');
});
