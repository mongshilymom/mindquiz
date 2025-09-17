# 📌 MindQuiz Original – Life-Fit (Big Five) — 고정 가이드

## 🎯 목표
- Big Five 기반 **자체 검사**
- 무료: 5요인 대시보드 + **PhonoCode-16 페르소나**
- 유료: **PDF 15–20p** 리포트

## ✅ 필수 가드레일
- **MBTI 용어/문항 미사용** (법·브랜드 리스크 차단)
- **PhonoCode-16 유지**: OE(라/레/로/루) × CA(민/단/온/솔) + **N 배지**
- **국내 결제만**: KakaoPay / NaverPay (Stripe·Toss **금지**)
- 결과 페이지 상단 **Sticky ShareBar**:
  - 카카오톡·이메일·인스타·X·페북·Threads·라인·네이버 공유
  - **동적 OG** 1200×630 (satori + resvg, 한글 폰트)
- **면책 고지(필수)**: “자기이해/엔터테인먼트용, 의료·심리 진단 아님”

## 🧪 데브 계약 (제품 사양)
- **문항**: 40문항 (5요인 × 2 facet × 4), Likert5, **역채점 지원**
- **정규화**: 0–100, **High ≥ 60**, **Low < 60**
- **페르소나**: 
  - OE = (O≥60 ? (E≥60 ? 라 : 레) : (E≥60 ? 로 : 루))
  - CA = (C≥60 ? (A≥60 ? 민 : 단) : (A≥60 ? 온 : 솔))
  - PhonoCode = `${OE}${CA}` (예: 라온)
  - N 배지 = N<40 → 🧘 / N≥60 → 🌪️ / 그 외 → 🙂
- **DOD**:
  - 신뢰도 **α ≥ 0.70**
  - 결제 **E2E(승인/취소) 2건 통과**
  - **Share CTR ≥ X%** (목표치 정의)
  - **PDF 생성·이메일 발송 OK**

## 🛠 운영 기준
- **/r/:id** 인덱스 OK (공유용), **/app/* 비인덱스**
- **/metrics**: Bearer **토큰 + IP 화이트리스트** 이중 보호
- **백업/알람 On**: 일일 로테이션 + 무결성 체크(restore-check), Prometheus/Grafana/Alert

---

## (보너스) 최소 스키마 & 스코어링 계약

### 질문 스키마
{
  "id": "q001",
  "trait": "O",
  "facet": "Imagination",
  "text": "팀 프로젝트에서 새로운 방식을 제안하는 편이다.",
  "reverse": false,
  "scale": "Likert5"
}

### 타입 & 점수
type Answer = 1|2|3|4|5;
type Score = { O:number; C:number; E:number; A:number; N:number };
/* normalize(answers) -> 0..100 per trait
   reverse=true -> (6 - answer) */

### 페르소나 매핑
const OE = (O>=60 ? (E>=60 ? "라" : "레") : (E>=60 ? "로" : "루"));
const CA = (C>=60 ? (A>=60 ? "민" : "단") : (A>=60 ? "온" : "솔"));
const PhonoCode = `${OE}${CA}`; // ex) 라온
const NBadge = N<40 ? "🧘" : N>=60 ? "🌪️" : "🙂";





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

_____________________________________________________________

# MindQuiz Web Application

## Overview

MindQuiz is a Korean-language psychological quiz platform that offers various personality tests including MBTI, Teto Egen, KLoopi, and other psychological assessments. The application features a landing page showcasing different quiz types and includes premium report purchasing functionality with integrated Korean payment methods. Built as a full-stack web application with a focus on clean design and Korean user experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent UI components
- **Routing**: Wouter for client-side routing with simple route management
- **State Management**: TanStack Query (React Query) for server state management
- **Design System**: Custom Tailwind configuration with Korean typography support (Noto Sans KR, Pretendard fonts)
- **Component Structure**: Modular component architecture with reusable UI components and page-specific components

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM module system
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API structure with route-based organization
- **Development**: Hot module replacement with Vite integration for development workflow

### Data Storage Solutions
- **Primary Database**: PostgreSQL with connection pooling
- **Database Client**: Neon serverless PostgreSQL adapter for cloud deployment
- **Schema Management**: Drizzle ORM with migration support
- **Data Models**: 
  - Users table for user management
  - Quiz results for storing test outcomes
  - Payments table for transaction tracking
  - Premium reports for paid content access

### Authentication and Authorization
- **Session Management**: PostgreSQL session store using connect-pg-simple
- **User Model**: Simple email-based user identification with optional nickname
- **Access Control**: Quiz result ownership validation and premium report access control

### Payment Integration Architecture
- **Korean Payment Methods**: Direct integration preparation for KakaoPay and NaverPay
- **Payment Flow**: Two-phase payment process with prepare and approve endpoints
- **Transaction Tracking**: Comprehensive payment status management with external transaction ID linking
- **Payment Data**: Flexible JSON storage for payment provider specific data

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless database connectivity
- **drizzle-orm**: Type-safe SQL query builder and ORM
- **express**: Web application framework for API endpoints
- **pg**: PostgreSQL client library with connection pooling

### Frontend UI Dependencies
- **@radix-ui/***: Comprehensive set of accessible UI primitives for consistent component behavior
- **@tanstack/react-query**: Server state management and caching
- **tailwindcss**: Utility-first CSS framework for styling
- **class-variance-authority**: Type-safe CSS variant management
- **wouter**: Lightweight client-side routing

### Development and Build Tools
- **vite**: Fast build tool and development server
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **tsx**: TypeScript execution for server development
- **esbuild**: Fast JavaScript bundler for production builds

### Payment Service Integration (Planned)
- **KakaoPay API**: Direct integration for Korean users
- **NaverPay API**: Alternative Korean payment method
- **Payment webhook handling**: Server endpoints for payment confirmation callbacks

### Typography and Internationalization
- **Google Fonts**: Noto Sans KR and Pretendard fonts for Korean language support
- **Korean Language Optimization**: Proper line-height and letter-spacing configurations
