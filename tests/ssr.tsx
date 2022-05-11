import React from 'react';
import { renderToString } from 'react-dom/server';
import { test } from 'uvu';
import assert from 'uvu/assert';

import { AwaitBoundary, SyncResolver, useAwait } from '../src/useAwait';
import { mountApp, setup } from './setup';

test.before(setup);

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

  assert.is(renderToString(serverSideApp), '<div><!--$--><div>Hello data A from server side render</div><div>Hello data B from server side render</div><!--/$--></div>');

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

  assert.is(mountedApp.textContent, 'loading');

  await new Promise((resolve) => setTimeout(resolve, 30));

  assert.is(mountedApp.textContent, 'Hello data A from client side render' + 'Hello data B from client side render');
});

test.run();
