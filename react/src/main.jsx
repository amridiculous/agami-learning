import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

import App from './App.jsx';
import Home from './pages/Home/Home.jsx';
import ChapterDetail from './pages/ChapterDetail/ChapterDetail.jsx';
import './styles/main.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      // Chapter route — same shell as Home, with the matching chapter
      // pre-positioned at the focus line.
      { path: 'chapter/:slug', element: <ChapterDetail /> },
      // Catch-all: redirect unknown URLs to the home route.
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
