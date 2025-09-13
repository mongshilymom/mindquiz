# Design Guidelines for MindQuiz.app Landing Page

## Design Approach
**Reference-Based Approach**: Drawing inspiration from modern quiz and assessment platforms like 16Personalities and Typeform, focusing on clean, approachable design that reduces cognitive load and encourages exploration.

## Core Design Elements

### A. Color Palette
- **Background**: Soft gray `#f4f4f9` for a calming, neutral foundation
- **Card Background**: Pure white `#ffffff` for clean contrast and focus
- **Text**: Dark charcoal for primary text, medium gray for secondary content
- **Accent Colors**: Subtle blues and purples to convey trust and introspection

### B. Typography
- **Primary Font**: Noto Sans KR via Google Fonts CDN
- **Hierarchy**: Large, friendly h1 for main title, medium subtitle, and clean card typography
- **Korean Language Optimization**: Ensure proper line-height and letter-spacing for Korean text readability

### C. Layout System
- **Spacing**: Use consistent units of 1rem, 1.5rem, 2rem, and 3rem for margins and padding
- **Centering**: All content centrally aligned with max-width container
- **Grid**: Responsive card grid that adapts from multi-column to single-column on mobile

### D. Component Library

#### Quiz Cards
- **Base State**: White background with `border-radius: 12px` and subtle `box-shadow: 0 4px 6px rgba(0,0,0,0.1)`
- **Hover Effects**: 
  - Scale transform: `transform: translateY(-4px) scale(1.02)`
  - Enhanced shadow: `box-shadow: 0 8px 25px rgba(0,0,0,0.15)`
  - Smooth transitions: `transition: all 0.3s ease`
- **Typography**: Quiz names should be prominent but not overwhelming
- **Spacing**: Generous internal padding (1.5rem) for comfortable touch targets

#### Navigation Structure
- **Header**: Minimal with main title and subtitle
- **Card Grid**: 2-3 columns on desktop, single column on mobile
- **Responsive Breakpoints**: 
  - Desktop: 3 cards per row
  - Tablet: 2 cards per row  
  - Mobile: 1 card per row with full-width layout

### E. Responsive Design Strategy
- **Mobile-First**: Design for smallest screens first, enhance upward
- **Touch-Friendly**: Minimum 44px touch targets for all interactive elements
- **Viewport Optimization**: Cards maintain readability and visual hierarchy across all screen sizes
- **Media Queries**: Smooth transitions between breakpoints without jarring layout shifts

## Interaction Design
- **Subtle Animations**: Focus on hover states and transitions that feel responsive but not distracting
- **Loading States**: Cards should have smooth hover feedback to indicate interactivity
- **Accessibility**: Maintain focus states and keyboard navigation support

## Content Strategy
- **Minimal Sections**: Single-page design with header, subtitle, and card grid only
- **Clear Hierarchy**: Title → Subtitle → Quiz Selection Cards
- **Concise Copy**: Korean text optimized for quick scanning and decision-making

## Images
No hero image required. The design relies on clean typography and card-based layout for visual impact. Each quiz card could potentially include small decorative icons or subtle background patterns, but the primary focus should remain on clear, accessible text and intuitive navigation.