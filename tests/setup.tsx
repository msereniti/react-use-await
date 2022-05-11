import { JSDOM } from 'jsdom';
import React from 'react';
import { render } from 'react-dom';
import { createRoot } from 'react-dom/client';

const { window } = new JSDOM('<main></main>');

export const setup = () => {
  global.window = window as any;
  global.requestAnimationFrame = (callback: FrameRequestCallback) => {
    setTimeout(() => callback(0));

    return 0;
  };
  global.document = window.document;
  global.navigator = window.navigator;
  global.getComputedStyle = window.getComputedStyle;
};

export const mountApp = (app: React.ReactNode) => {
  const parentContainer = document.querySelector('main');
  const container = document.createElement('div');
  const root = createRoot(container);

  parentContainer.appendChild(container);
  root.render(app);

  return { mountedApp: container, unmount: () => root.unmount() };
};
