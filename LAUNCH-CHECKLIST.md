# 🚀 MindQuiz Production Launch Checklist

## 📋 Pre-Launch Checklist (10 Essential Items)

### 1. ✅ Build Client Assets
```bash
cd client
npm ci
npm run build
```

### 2. ✅ Environment Variables (Production)
Copy `.env.production` to `.env` and update all values:

**Critical Variables to Update:**
- `ADMIN_PASS` → Strong password (20+ chars, mixed case, numbers, symbols)
- `SITE_URL` → https://mindquiz.app
- `GA4_ID` & `VITE_GA4_ID` → Real GA4 measurement ID
- `KAKAOPAY_SECRET_KEY` & `KAKAOPAY_CID` → Production values
- `NAVERPAY_CLIENT_ID` & `NAVERPAY_CLIENT_SECRET` → Production values
- `VITE_KAKAO_JS_KEY` → Production Kakao JavaScript key

### 3. ✅ Payment Provider Setup

**KakaoPay Console:**
- Success URL: `https://mindquiz.app/api/payment/kakao/approve`
- Fail URL: `https://mindquiz.app/checkout/failed`
- Cancel URL: `https://mindquiz.app/checkout/canceled`

**NaverPay Console:**
- Success URL: `https://mindquiz.app/api/payment/naver/approve`
- Fail URL: `https://mindquiz.app/checkout/failed`
- Cancel URL: `https://mindquiz.app/checkout/canceled`

### 4. ✅ Process Manager (PM2)
```bash
npm install -g pm2
pm2 start ecosystem.config.json
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

### 5. ✅ Reverse Proxy (Nginx)
```bash
# Copy nginx.conf to /etc/nginx/sites-available/mindquiz.app
sudo ln -s /etc/nginx/sites-available/mindquiz.app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. ✅ SSL Certificate (Let's Encrypt)
```bash
sudo certbot --nginx -d mindquiz.app -d www.mindquiz.app
```

### 7. ✅ Admin Security Hardening
- Set strong `ADMIN_PASS` in `.env`
- Configure IP whitelist in Nginx for `/admin/*` routes
- Test admin access: `https://mindquiz.app/admin/logs?pass=YOUR_PASS`

### 8. ✅ Rate Limiting Verification
Check Nginx rate limits are active:
- API endpoints: 10 req/sec
- Admin endpoints: 1 req/sec

### 9. ✅ Log & Backup Verification
```bash
# Check directories exist
ls -la server/data/
# Should show: archive/, backup/, coupons.ndjson, events.ndjson, orders.ndjson

# Verify scheduled operations
tail -f logs/pm2-combined.log
# Look for "[ops] rotate+backup done" messages at 4:10 AM KST
```

### 10. ✅ GA4 Real-time Testing
- Open GA4 Real-time dashboard
- Complete a test payment
- Verify `purchase_complete` event appears with correct parameters:
  - `value`: payment amount
  - `currency`: KRW
  - `order_id`: order ID
  - `persona`: personality type
  - `coupon`: coupon code (if used)

---

## 🧪 Production Smoke Tests

### Automated Tests
```bash
chmod +x smoke-test.sh
./smoke-test.sh https://mindquiz.app YOUR_ADMIN_PASS
```

### Manual Test Matrix (8 Critical Cases)

#### Payment Flow Tests
1. **KakaoPay Success**: Complete payment flow with valid card
2. **KakaoPay Failure**: Test with invalid card/insufficient funds
3. **KakaoPay Cancel**: User cancels during payment
4. **NaverPay Success**: Complete payment flow
5. **NaverPay Failure**: Test failure scenarios
6. **NaverPay Cancel**: User cancels during payment

#### Coupon Tests
7. **Coupon A (10% Discount)**: Apply discount coupon and complete payment
8. **Coupon B (Expansion Pack)**: Apply expansion coupon and complete payment

#### Admin Tests
```bash
# Test refund functionality
curl -X POST https://mindquiz.app/admin/payment/kakao/cancel \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ORDER_ID","reason":"user_request","reissue":"0","pass":"YOUR_ADMIN_PASS"}'
```

#### Share & Analytics Tests
- **KakaoTalk Share**: Verify OG image displays correctly
- **Link Copy Share**: Test direct URL sharing
- **GA4 Events**: Verify all events in real-time dashboard

---

## 📊 Operational Monitoring

### Daily Checks
```bash
# PM2 Status
pm2 status
pm2 logs mindquiz --lines 50

# Disk Usage
df -h
du -sh server/data/

# Nginx Status
sudo systemctl status nginx
sudo tail -f /var/log/nginx/access.log
```

### Weekly Checks
- Admin panel: `https://mindquiz.app/admin/logs?pass=YOUR_PASS`
- File management: `https://mindquiz.app/admin/files?pass=YOUR_PASS`
- GA4 analytics review
- Backup file verification

### Monthly Tasks
```bash
# Manual cleanup of old backups (if needed)
npm run prune 60  # Remove files older than 60 days

# PM2 log rotation
pm2 flush

# SSL certificate renewal (auto with certbot, but verify)
sudo certbot certificates
```

---

## 🔧 Troubleshooting Guide

### Common Issues

**Payment Failures:**
- Check provider console settings
- Verify callback URLs are whitelisted
- Review payment logs in admin panel

**GA4 Events Not Appearing:**
- Verify `GA4_ID` is correct in `.env`
- Check browser network tab for gtag requests
- Confirm events in GA4 DebugView

**Admin Panel Access Issues:**
- Verify `ADMIN_PASS` in `.env`
- Check IP whitelist in Nginx config
- Review Nginx error logs

**Performance Issues:**
- Monitor PM2 memory usage: `pm2 monit`
- Check disk space: `df -h`
- Review Nginx access logs for slow requests

### Emergency Contacts
- Payment Provider Support (KakaoPay/NaverPay)
- Server/Hosting Provider
- Domain/SSL Provider

---

## 🎯 Success Metrics

### Launch Day Targets
- [ ] All smoke tests passing
- [ ] Payment success rate > 95%
- [ ] Page load time < 2 seconds
- [ ] Zero critical errors in logs
- [ ] GA4 events tracking correctly

### Week 1 Targets
- [ ] Uptime > 99.9%
- [ ] Payment completion rate > 90%
- [ ] Share rate > 20%
- [ ] Zero data loss incidents

---

## 📞 Post-Launch Support

### Immediate Response (< 1 hour)
- Payment system failures
- Site completely down
- Security breaches

### Standard Response (< 24 hours)
- UI/UX issues
- Minor feature bugs
- Performance optimization requests

### Enhanced Features (Planned)
- Error alerting (Slack/Discord webhooks)
- Advanced coupon rules (expiry, minimum amount)
- A/B testing framework
- Analytics dashboard

---

**🏁 Launch Complete! Monitor closely for the first 48 hours.**