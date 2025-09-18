import React from 'react';
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ResultPage from './pages/ResultPage';
import { initWebVitals } from './utils/webVitals';
import "./index.css";

// Type declarations for global objects
declare global {
  interface Window {
    Kakao?: {
      isInitialized(): boolean;
      init(key: string): void;
    };
  }
}

// Initialize GA4 if available
(() => {
  const id = import.meta.env.VITE_GA4_ID;
  if (id) {
    const s1 = document.createElement('script');
    s1.async = true;
    s1.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(s1);
    const s2 = document.createElement('script');
    s2.innerHTML = `
      window.dataLayer=window.dataLayer||[];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date()); gtag('config','${id}');
    `;
    document.head.appendChild(s2);
  }
})();

// Initialize Kakao SDK if available
(() => {
  const key = import.meta.env.VITE_KAKAO_JS_KEY;
  if (key) {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://developers.kakao.com/sdk/js/kakao.min.js';
    s.onload = function() {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(key);
      }
    };
    document.head.appendChild(s);
  }
})();

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
