import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@fontsource/roboto';
import { BrowserRouter } from 'react-router-dom';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement);
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
); 