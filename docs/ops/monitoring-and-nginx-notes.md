# MindQuiz Operations Guide

## Prometheus Monitoring Setup

### Configuration Files
- `prometheus.yml` - Main Prometheus configuration
- `rules.yml` - Alerting rules for operational issues

### Key Metrics
- `http_5xx_total` - Total 5xx errors
- `payment_ready_calls_total` - Payment initiation attempts
- `payment_approval_total` - Successful payments
- `payment_failure_total` - Failed payments
- `payment_cancel_total` - Cancelled payments
- `referral_reward_total` - Referral rewards issued
- `order_sign_calls_total` - Order signature requests
- `mq_last_backup_timestamp` - Last backup timestamp (Unix seconds)

### Alerting Rules
1. **MQ_High5xx** - >5 5xx errors in 5 minutes
2. **MQ_PaymentFailures** - >10 payment failures in 10 minutes
3. **MQ_NoBackups24h** - No backup for >24 hours
4. **MQ_HighErrorRate** - >10% error rate
5. **MQ_NoPaymentActivity** - No payments for >1 hour

## Nginx Configuration

### Rate Limiting
```nginx
# Rate limiting for payment endpoints
location /api/payment/ {
    limit_req zone=payment burst=5 nodelay;
    limit_req zone=payment_strict burst=2 nodelay;
    proxy_pass http://backend;
}

# Rate limiting zones (add to http block)
http {
    limit_req_zone $binary_remote_addr zone=payment:10m rate=10r/m;
    limit_req_zone $binary_remote_addr zone=payment_strict:10m rate=3r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
}
```

### Metrics Endpoint Protection
```nginx
location /metrics {
    # Restrict to monitoring networks only
    allow 10.0.0.0/8;
    allow 172.16.0.0/12;
    allow 192.168.0.0/16;
    deny all;

    proxy_pass http://backend;
    proxy_set_header Host $host;
}
```

### Security Headers
```nginx
add_header X-Frame-Options SAMEORIGIN;
add_header X-Content-Type-Options nosniff;
add_header Referrer-Policy strict-origin-when-cross-origin;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://developers.kakao.com https://www.googletagmanager.com; connect-src 'self' https://open-api.kakaopay.com https://*.naver.com; img-src 'self' data: https:";
```

## Environment Variables

### Production Configuration
```bash
# Core
NODE_ENV=production
PORT=3004
SITE_URL=https://mindquiz.app
VITE_SITE_URL=https://mindquiz.app

# Security
ORDER_SECRET=SECURE_256_BIT_RANDOM_STRING
ADMIN_PASS=STRONG_ADMIN_PASSWORD

# Payments
PAYMENTS_ENABLED=1
KAKAOPAY_CID=TC0ONETIME
KAKAOPAY_SECRET_KEY=PRODUCTION_SECRET_KEY
NAVERPAY_CLIENT_ID=PRODUCTION_CLIENT_ID
NAVERPAY_CLIENT_SECRET=PRODUCTION_SECRET

# Analytics
GA4_ID=G-PRODUCTION_ID
VITE_GA4_ID=G-PRODUCTION_ID
VITE_KAKAO_JS_KEY=PRODUCTION_JS_KEY

# Operations
ENABLE_DAILY_OPS=1
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK
```

## Deployment Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Nginx configuration deployed
- [ ] Prometheus/alerting configured
- [ ] Database backups tested
- [ ] Payment provider webhooks configured

### Post-deployment
- [ ] Health check: `curl https://mindquiz.app/api/health`
- [ ] Metrics endpoint: `curl https://mindquiz.app/metrics`
- [ ] Payment flow test (sandbox)
- [ ] OG image generation test
- [ ] Share links test
- [ ] Backup process test

## Next Steps & Enhancements

### 1. Enhanced Security
- **Server-side Price Validation**: Calculate final amount on server, ignore client amount
- **Payment Token Expiry**: Add timestamp to HMAC signature for replay protection
- **API Rate Limiting**: Implement per-user rate limiting with Redis

### 2. Operational Improvements
- **SQLite Migration**: Move from JSONL to SQLite for better concurrency
- **Referral Dashboard**: Admin interface for referral analytics
- **Webhook Notifications**: Multi-channel alerts (Discord, Zapier)
- **Health Checks**: Deep health checks with database connectivity

### 3. Performance Optimization
- **CDN Integration**: CloudFlare for static assets and OG images
- **Caching Strategy**: Redis for session management and rate limiting
- **Database Indexing**: Optimize query performance
- **Image Optimization**: WebP format for OG images

### 4. Analytics Enhancement
- **Revenue Metrics**: Daily/monthly revenue tracking
- **Conversion Funnels**: Payment flow analytics
- **User Segmentation**: Referral vs direct traffic analysis
- **A/B Testing**: Systematic testing framework

## Maintenance Scripts

### Manual Backup
```bash
npm run backup
```

### Data Pruning
```bash
npm run prune
```

### Backup Verification
```bash
npm run restore:check
```

### Log Rotation
```bash
npm run rotate
```

## Emergency Procedures

### Payment Outage
1. Check payment provider status
2. Verify environment variables
3. Test with sandbox credentials
4. Enable maintenance mode if needed

### Database Corruption
1. Stop application
2. Restore from latest backup
3. Verify data integrity
4. Resume operations

### High Traffic
1. Scale horizontally if possible
2. Enable additional rate limiting
3. Cache static responses
4. Monitor system resources

## Contact Information
- **Technical Issues**: [Your technical team contact]
- **Payment Issues**: [Your payment team contact]
- **Security Issues**: [Your security team contact]