// server/lib/metrics.cjs
// In-memory metrics counters for Prometheus format

'use strict';

const { readSharedMetrics } = require('./shared-metrics.cjs');

const counters = {
  http_5xx_total: 0,
  payment_ready_calls_total: 0,
  payment_approval_total: 0,
  payment_failure_total: 0,
  payment_cancel_total: 0,
  referral_reward_total: 0,
  order_sign_calls_total: 0,
  revenue_total_krw: 0,
  revenue_kakao_krw: 0,
  revenue_naver_krw: 0
};

const gauges = {
  mq_last_backup_timestamp: 0
};

function increment(metric) {
  if (counters.hasOwnProperty(metric)) {
    counters[metric]++;
  }
}

function addRevenue(amount, provider = 'total') {
  const krwAmount = Number(amount) || 0;
  if (krwAmount > 0) {
    counters.revenue_total_krw += krwAmount;
    if (provider === 'kakao') {
      counters.revenue_kakao_krw += krwAmount;
    } else if (provider === 'naver') {
      counters.revenue_naver_krw += krwAmount;
    }
  }
}

function setGauge(metric, value) {
  if (gauges.hasOwnProperty(metric)) {
    gauges[metric] = Number(value) || 0;
  }
}

function get(metric) {
  return counters[metric] || gauges[metric] || 0;
}

function getAll() {
  const shared = readSharedMetrics();
  return { ...counters, ...gauges, ...shared };
}

function toPrometheus() {
  const lines = [];
  const shared = readSharedMetrics();

  // Counters
  for (const [key, value] of Object.entries(counters)) {
    lines.push(`# HELP ${key} Total count of ${key.replace(/_/g, ' ')}`);
    lines.push(`# TYPE ${key} counter`);
    lines.push(`${key} ${value}`);
  }

  // Local gauges
  for (const [key, value] of Object.entries(gauges)) {
    lines.push(`# HELP ${key} ${key.replace(/_/g, ' ')}`);
    lines.push(`# TYPE ${key} gauge`);
    lines.push(`${key} ${value}`);
  }

  // Shared gauges
  for (const [key, value] of Object.entries(shared)) {
    lines.push(`# HELP ${key} ${key.replace(/_/g, ' ')}`);
    lines.push(`# TYPE ${key} gauge`);
    lines.push(`${key} ${value}`);
  }

  return lines.join('\n') + '\n';
}

function reset(metric) {
  if (metric && counters.hasOwnProperty(metric)) {
    counters[metric] = 0;
  } else if (metric && gauges.hasOwnProperty(metric)) {
    gauges[metric] = 0;
  } else if (!metric) {
    // Reset all counters and gauges
    for (const key in counters) {
      counters[key] = 0;
    }
    for (const key in gauges) {
      gauges[key] = 0;
    }
  }
}

module.exports = {
  increment,
  addRevenue,
  setGauge,
  get,
  getAll,
  toPrometheus,
  reset
};