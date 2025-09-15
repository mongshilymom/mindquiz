# MindQuiz OPERATIONS.md (Final)

운영 대상: **mindquiz.app**  
스택: Node 20 · Express(CJS) · Vite(React) · EJS · PM2 · Nginx · Prometheus/Grafana · KakaoPay/NaverPay

---

## 0) 퀵 레퍼런스
- 헬스: `GET /api/health` → `{ ok: true }`
- 버전: `GET /api/version` → `{ version, commit, env, time }`
- 메트릭: `GET /metrics` (Authorization: `Bearer $METRICS_TOKEN`)
- 결제 킬스위치: `.env -> PAYMENTS_ENABLED=0` → `pm2 restart mindquiz` (페이지/공유/OG 정상, 결제 시작만 차단)
- 백업/로테이션: 자동 04:10, 수동 `npm run ops:daily` / 무결성 점검 `npm run restore:check`
- 관리자: `/admin/logs?pass=…`, `/admin/files?pass=…`, `/admin/status?pass=…`

---

## 1) 비상 대응 절차 (런북)
> 예시 시나리오: **“결제가 갑자기 안 될 때”** — 신규 결제가 대량 실패하거나 승인 콜백이 들어오지 않음

### 1.0 즉시 안전 조치 (필요 시)
- **심각한 장애(대량 결제 실패/이중결제 우려)** 예상 시:
  1) **결제 킬스위치 ON** → `.env: PAYMENTS_ENABLED=0` 저장 → `pm2 restart mindquiz`
  2) 상태 공유: Slack #ops 채널에 “결제 일시 중지, 원인 조사” 공지
  3) 사이트는 조회/공유 정상, **결제 시작만 503** 응답 (고객 피해 최소화)

### 1.1 현황 파악 (3분 이내)
- **헬스/버전** 확인:
  ```bash
  curl -sSf https://mindquiz.app/api/health
  curl -sSf https://mindquiz.app/api/version | jq .
  ```
- **메트릭 대시보드**(Grafana)에서 다음을 확인:
  - `payment_failure_total` 급증 여부, `payment_approval_total` 하락 여부
  - `http_5xx_total` 증가, Nginx 502/504 여부
  - 최근 1시간 **결제 실패율** (아래 2.2 지표 참고)
- **관리 로그**: `/admin/logs?pass=…` 에서 최근 orders/events 필터 (provider·에러코드별 분포)

### 1.2 원인 구분 (10분 이내)
- **PG/외부** 이슈 의심: 카카오/네이버 콘솔 장애 공지·콜백 지연 알림 여부 확인
- **콜백 차단/도메인** 문제: PG 콘솔의 리다이렉트·화이트리스트 URL이 최신 도메인(HTTPS)로 유지되는지 확인
- **코드/배포 회귀**: `/api/version`의 `version/commit`가 직전 릴리스와 비교해 변경점 있는지 확인
- **네트워크/캐시**: Nginx 에러 로그·Upstream 연결 상태, WAF/레이트리밋 과도 여부 확인

### 1.3 근본 대응 (Fix or Rollback)
- 설정/네트워크/콘솔 오표기 → 수정 후 **테스트 결제 1건** (쿠폰 없이)로 승인 확인
- 코드 회귀가 의심되면 **3) 안전한 롤백 절차** 수행

### 1.4 복구 & 재가동
- 결제가 정상화되면 **킬스위치 OFF**: `PAYMENTS_ENABLED=1` → `pm2 restart mindquiz`
- **검증**: 승인/취소 각 1건, 쿠폰 hold→redeem/ release 로그 확인
- **사후 정리**: 장애 구간 이벤트·주문 CSV 보관, Slack 포스트모템(원인/조치/재발방지)

---

## 2) 핵심 모니터링 지표 (Grafana 기준)

### 2.1 지표 명세 (Prometheus)
> 배포 버전에 따라 접미사가 다를 수 있습니다. 아래는 권장/표준 명칭입니다.

| Metric | Type | 설명 |
|---|---|---|
| `http_5xx_total` | counter | 5xx 응답 누계 (서버 에러)
| `payment_ready_calls_total{provider}` | counter | 결제 시작 Ready 호출 수 (kakao/naver)
| `payment_approval_total{provider}` | counter | 결제 승인 완료 수
| `payment_failure_total{provider}` | counter | 결제 실패 수 (게이트웨이/유저취소 분리 가능 시 라벨)
| `payment_cancel_total{provider}` | counter | 관리자/사용자 취소 수
| `revenue_krw_total{provider}` | counter | 누적 매출(원)
| `referral_reward_total` | counter | 리퍼럴 보상 발급 건수
| `order_sign_calls_total` | counter | 주문 서명 요청 수(HMAC)
| `mq_last_backup_timestamp` | gauge | 마지막 백업 시각(Unix sec)

### 2.2 핵심 패널 & 임계치(Threshold)
- **시간당 결제 실패율** (핵심)
  - PromQL: `rate(payment_failure_total[10m]) / clamp_min(rate(payment_ready_calls_total[10m]), 1)`
  - **주의**: > **10%** (5분 연속) → 경고, > **20%** (10분 연속) → 페이지
- **5xx 급증**
  - PromQL: `increase(http_5xx_total[5m])`
  - **주의**: > **5** (최근 5분) → 경고, > **20** (최근 5분) → 페이지
- **결제 승인 처리량(Throughput)**
  - PromQL: `rate(payment_approval_total[5m])`
  - **주의**: 예상 활동 시간대(예: 08–24시) 동안 **연속 60분 0건** → 점검(트래픽 급락·PG 장애 가능)
- **매출(원/시간)**
  - PromQL: `rate(revenue_krw_total[1h])`
  - **주의**: 직전 7일 동일 요일/시간대 대비 **-50% 이하** → 마케팅/PG/성능 점검
- **백업 공백**
  - PromQL: `time() - mq_last_backup_timestamp`
  - **주의**: > **86,400s (24h)** → 경고

> Alert 이름 예시: `MQ_HighErrorRate`(10%), `MQ_High5xx`, `MQ_NoPaymentActivity`, `MQ_NoBackups24h`

---

## 3) 안전한 롤백 절차 (가장 빠르고 안전하게)

### 3.0 원칙
- 데이터는 **NDJSON 파일 저장소**로, 스키마 변경이 적어 **하위 호환**입니다.
- **.env/비밀키**는 변경하지 않습니다(버전 간 공통 사용).
- 롤백 전 반드시 **결제 킬스위치 ON**(신규 결제 차단) → 고객 피해 최소화.

### 3.1 PM2 & Git 태그 기반 롤백
1) **결제 중지(필요 시)**
   ```bash
   echo "PAYMENTS_ENABLED=0" >> .env && pm2 restart mindquiz
   ```
2) **이전 릴리스 체크아웃**
   ```bash
   git fetch --all
   git checkout <previous-tag-or-commit>
   npm ci
   cd client && npm ci && npm run build && cd ..
   ```
3) **기동**
   ```bash
   pm2 restart ecosystem.config.json --update-env
   pm2 status
   curl -sSf https://mindquiz.app/api/version | jq .  # 이전 버전/커밋 확인
   ```
4) **검증**: `/api/health` 200, 결과 페이지/OG, 관리자, 메트릭 확인
5) **결제 재가동**
   ```bash
   sed -i 's/PAYMENTS_ENABLED=0/PAYMENTS_ENABLED=1/' .env
   pm2 restart mindquiz
   ```

### 3.2 심플 릴리즈(시mlink) 전략일 경우
- `/srv/mindquiz/releases/<ts>`에 빌드 산출물을 유지, `/srv/mindquiz/current` 심볼릭 링크로 서비스
1) `ln -nfs /srv/mindquiz/releases/<prev_ts> /srv/mindquiz/current`
2) `pm2 reload mindquiz` (무중단)
3) `/api/version`으로 되돌림 확인 → 결제 재가동

### 3.3 롤백 이후
- 장애 원인 분석(로그·메트릭·PG 응답/코드), 재발 방지 작업 티켓 발행
- GA4·매출·실패율 정상화 추적(24h)

---

## 4) 정기 운영 루틴
- **매일**:
  - Grafana 핵심 패널 5분 점검(실패율/5xx/승인 처리량)
  - `/admin/files`에서 백업 생성 여부·용량 확인
- **매주**:
  - `npm run restore:check` → 백업 복원 리허설 결과 확인(실패 시 Slack 알림)
  - 리퍼럴/전환 리포트: `npm run report:ref` 상위 추천자/추세 확인
- **매월**:
  - 비밀키 로테이션(ORDER_SECRET/Kakao/Naver/Slack)
  - 레이트리밋/알람 임계치 재평가

---

## 5) 운영 치트시트
- **킬스위치**
  ```bash
  # OFF (차단)
  echo "PAYMENTS_ENABLED=0" >> .env && pm2 restart mindquiz
  # ON (재개)
  sed -i 's/PAYMENTS_ENABLED=0/PAYMENTS_ENABLED=1/' .env && pm2 restart mindquiz
  ```
- **메트릭 조회**
  ```bash
  curl -H "Authorization: Bearer $METRICS_TOKEN" -s https://mindquiz.app/metrics | head
  ```
- **로그 모니터링**
  ```bash
  pm2 logs mindquiz --lines 200
  ```
- **관리자 뷰**
  - 로그/CSV: `/admin/logs?pass=…`
  - 파일: `/admin/files?pass=…`
  - 상태: `/admin/status?pass=…`
- **테스트 결제**: 브라우저에서 `/app/result/demo1` → Kakao/Naver 각 1건 승인/취소

---

## 6) 보안 수칙
- `/metrics`는 **Bearer 토큰 + Nginx IP 화이트리스트** 이중 보호
- `.env` 권한 600, 관리자 패스워드 강력 설정, `/admin/*`는 사내 IP만 허용 권장
- CSP Report-Only → Enforce(24–48h 모니터링 후), 정적/스크립트 출처 최소화 유지

---

## 7) 부록: Grafana 패널용 PromQL 샘플
```promql
# 실패율(10분)
rate(payment_failure_total[10m]) / clamp_min(rate(payment_ready_calls_total[10m]), 1)

# 승인 처리량(5분)
rate(payment_approval_total[5m])

# 5xx 증가(5분)
increase(http_5xx_total[5m])

# 매출(원/시간)
rate(revenue_krw_total[1h])

# 마지막 백업 경과(분)
(time() - mq_last_backup_timestamp) / 60
```

---

### 변경 이력
- v1.0 — 초판 작성 (운영 런북/지표/롤백 절차 정리)

