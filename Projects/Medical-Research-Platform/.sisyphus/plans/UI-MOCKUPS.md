# UI Mockups - Health-Mesh Platform

This directory contains example UI mockups created with Playwright.

---

## Available Screenshots

### 1. Login Page
**File:** `login-page.png`

Features:
- Social login buttons (Google, Apple, Facebook)
- Email/password form option
- "No Wallet Knowledge Required" notice prominently displayed
- Clean, modern design with gradient background
- Security notice at bottom

User Flow:
1. User clicks "Continue with Google/Apple"
2. Web3Auth OAuth modal opens (not shown in mockup)
3. Non-custodial wallet automatically created
4. User redirected to dashboard (no wallet configuration needed)

### 2. Patient Dashboard
**File:** `patient-dashboard.png`

Features:
- Wallet balance display (ETH + USDC)
- Active consents with status badges
- Recent activity timeline
- Quick action buttons (Update Consent, Manage Data, Share Profile, Settings)
- Consent management table with revoke functionality
- Clean navigation with user profile

Widgets:
- **Stats Card**: 3 active consents, $1,250 total earnings
- **Quick Actions**: Four main action buttons with icons
- **Wallet Balance**: ETH (0.045) and USDC ($125.00) with refresh button
- **Recent Activity**: Timeline showing consent signed, data purchased, payment received
- **Active Consents**: Table with study type, consent type, status, expiry, actions

### 3. Researcher Marketplace
**File:** `researcher-marketplace.png`

Features:
- Search bar for datasets, conditions, studies
- Filters for data type, region, sort order
- Dataset cards with compliance badges (HIPAA, GDPR, CCPA)
- Access fee display for each dataset
- Request access button
- Pagination controls
- Shopping cart indicator

Dataset Cards Include:
- Compliance type badge (HIPAA/GDPR/CCPA)
- Study title and date
- Participant count, study duration, data types
- Region indicator
- 30-day access fee in ETH
- Request access button

---

## Design System Used

### Color Palette
- **Primary (Teal/Green)**: #0d9488, #06b6d4, #059669 - Trust, Health, Success
- **Secondary (Blue/Indigo)**: #1e40af, #3b82f6 - Technology, Security, Actions
- **Accent (Yellow/Orange)**: Warning, alerts, special attention

### Typography
- **Font Family**: Inter (Google Fonts)
- **Headings**: Bold weight, larger sizes (lg, xl, 2xl)
- **Body**: Regular weight, base size (sm, normal)

### Components
- **Rounded Corners**: Large border radius (xl, 2xl) for modern feel
- **Shadows**: Subtle shadows (sm, lg) for depth
- **Spacing**: Consistent 4px, 8px, 16px, 24px scale
- **Icons**: Font Awesome for familiarity and clarity

---

## Key UI Patterns Demonstrated

### 1. No Wallet Knowledge Required
The login page prominently displays that users don't need to know how to use crypto wallets:
- Clear notice with icon and explanation
- OAuth-style social login buttons (Google, Apple, Facebook)
- Traditional email/password as fallback
- Security assurance ("Your data is protected...")

### 2. Patient-Centric Dashboard
The patient dashboard focuses on data ownership and control:
- Clear visibility of all active consents
- Easy revoke consent capability
- Earnings display motivates data sharing
- Activity timeline provides transparency
- Wallet balance without technical jargon

### 3. Researcher-Focused Marketplace
The researcher marketplace enables easy data discovery:
- Search and filters for specific research needs
- Dataset cards show participant count, data types, study duration
- Compliance badges help researchers find suitable datasets
- Clear pricing (access fee) displayed upfront
- Simple request access flow

---

## Responsive Design

All mockups demonstrate mobile-first responsive design:
- **Mobile (320px-640px)**: Stacked vertical layout, hamburger menu
- **Tablet (768px-1024px)**: 2-column grid, bottom navigation
- **Desktop (1024px+)**: 3-4 column dashboard, sidebar navigation

---

## Next Steps

These UI mockups serve as reference for the actual Next.js + shadcn/ui implementation:
1. **Login Page**: Implement Web3Auth OAuth integration with the same layout
2. **Patient Dashboard**: Recreate widgets and components using shadcn/ui
3. **Researcher Marketplace**: Build dataset grid with filters and search
4. **Styling**: Use Tailwind CSS with the same color palette
5. **Icons**: Replace Font Awesome with Lucide React (comes with shadcn/ui)
6. **Responsive**: Implement the same breakpoints and layout patterns

---

**Note**: These mockups are static HTML demonstrations. The actual implementation will use:
- Next.js 15 App Router
- shadcn/ui component library
- Wagmi + Web3Auth for authentication
- TanStack Query for data fetching
- Live smart contract interactions
- Real wallet balances

---

**Generated with**: Playwright MCP
**Date**: January 16, 2026
**Framework**: Tailwind CSS + Font Awesome + Custom CSS
