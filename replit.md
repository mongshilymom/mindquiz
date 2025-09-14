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