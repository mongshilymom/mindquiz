// client/src/utils/webVitals.ts
// Web Vitals collection and reporting

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

interface VitalMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

// Send metric to server endpoint
async function sendMetric(metric: VitalMetric) {
  try {
    // Only send in production to avoid noise from dev environment
    if (import.meta.env.MODE !== 'production') return;

    await fetch('/api/vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        rating: metric.rating,
        url: window.location.pathname,
        timestamp: Date.now(),
        userAgent: navigator.userAgent.slice(0, 200), // Truncate to avoid long strings
      }),
    });
  } catch (error) {
    // Silently fail - don't disrupt user experience
    console.debug('Web Vitals reporting failed:', error);
  }
}

// Initialize Web Vitals collection
export function initWebVitals() {
  // Core Web Vitals
  getCLS(sendMetric);  // Cumulative Layout Shift
  getFID(sendMetric);  // First Input Delay
  getLCP(sendMetric);  // Largest Contentful Paint

  // Additional useful metrics
  getFCP(sendMetric);  // First Contentful Paint
  getTTFB(sendMetric); // Time to First Byte
}

// Manual metric reporting (for custom events)
export async function reportCustomMetric(name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor' = 'good') {
  const metric: VitalMetric = {
    name,
    value,
    delta: value,
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    rating,
  };

  await sendMetric(metric);
}