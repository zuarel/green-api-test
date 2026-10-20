import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App.tsx';
import './styles/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('Не найден корневой элемент приложения.');

const Router = import.meta.env.MODE === 'github-pages' ? HashRouter : BrowserRouter;

createRoot(root).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>,
);
