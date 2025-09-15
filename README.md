# MindQuiz

가볍게 시작해도 **실질적 성장**으로 이어지는 심리·성향 퀴즈 플랫폼.  
**Life-Fit(Big Five 기반) + PhonoCode-16 + 동적 OG + 공유 퍼널 + 국내결제(카카오/네이버)**

[▶ 운영 가이드(OPERATIONS)](docs/OPERATIONS.md)

---

## 특징
- **결제**: 카카오페이/네이버페이 직접 연동(중계 PG 미사용), 쿠폰/환불/취소, 결제 킬스위치
- **바이럴**: 동적 OG(1200×630), 상단 고정 공유바(카카오/X/라인/페북/이메일/링크)
- **하이브리드 렌더**: `/r/:id`(SSR 메타) → SPA로 즉시 리다이렉트(`/app/*`)
- **운영**: Admin 대시보드/CSV, 백업 로테이션+무결성 점검, Slack 알림, Prometheus/Grafana
- **보안**: HMAC(타임스탬프+논스)·서버 권한 가격(클라 금액 무시), /metrics 토큰+IP 화이트리스트

## 빠른 시작 (개발)
```bash
# 1) 클라이언트
cd client && npm i && npm run dev        # http://localhost:5173
# 2) 서버(루트에서)
cd .. && npm i && npm run server         # http://localhost:3004
# 프록시(dev): client → server 로 /api, /r, /payment 라우팅
