import { JSDOM } from 'jsdom';
import React from 'react';
import { render } from 'react-dom';

const { window } = new JSDOM('<main></main>');

export const setup = () => {
  global.window = window;
  global.document = window.document;
  global.navigator = window.navigator;
  global.getComputedStyle = window.getComputedStyle;
  global.requestAnimationFrame = null;
};

export const mountApp = (app: React.ReactNode): HTMLDivElement => {
  const parentContainer = document.querySelector('main');
  const container = document.createElement('div');

  parentContainer.appendChild(container);

  render(app, container);

  return container;
};
