import React from 'react';
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ResultPage from './pages/ResultPage';
import { initWebVitals } from './utils/webVitals';
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename="/app">
      <Routes>
        <Route path="/" element={<Navigate to="/result/demo1" replace/>} />
        <Route path="/result/:id" element={<ResultPage/>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// Initialize Web Vitals collection
initWebVitals();
