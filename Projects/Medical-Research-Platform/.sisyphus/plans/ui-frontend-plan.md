# UI Frontend Implementation Plan
## Health-Mesh Medical Research Platform

**Objective**: Build a modern, responsive frontend for patients, researchers, and providers to interact with the Health-Mesh platform using Next.js, shadcn/ui, and Web3Auth.

---

## Executive Summary

**Current State:**
- Backend API with JWT authentication and comprehensive REST endpoints
- Smart contracts for consent management and data access control
- PostgreSQL database with user, consent, and audit data
- **NO FRONTEND EXISTS** - backend-only system

**Proposed Solution:**
- **Next.js 15** (App Router) - Modern React framework with server components
- **shadcn/ui** - Beautiful, customizable component library based on Radix UI
- **Tailwind CSS** - Utility-first styling (comes with shadcn/ui)
- **Wagmi + Viem** - Type-safe web3 integration
- **TanStack Query v5** - Server state management with caching
- **Zustand** - Lightweight client state management
- **Web3Auth** - Non-custodial wallet with OAuth login

**Target Pages:**
1. **Patient Portal** - Dashboard, consent management, data control
2. **Researcher Marketplace** - Browse studies, purchase data access
3. **Provider Portal** - Request patient data, monitor access
4. **Landing Page** - Introduction to Health-Mesh

---

## Phase 1: Project Setup & Core Infrastructure (Weeks 1-2)

### 1.1 Initialize Next.js Project

**Commands:**
\`\`\`bash
npm create next-app@latest frontend --typescript --tailwind --eslint
cd frontend
npm install @web3auth/modal @web3auth/base ethers wagmi viem
npm install @tanstack/react-query zustand
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react react-day-picker
\`\`\`

**Project Structure:**
\`\`\`
frontend/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/                # Auth pages (login, signup)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/           # Dashboard pages (authenticated)
│   │   ├── patient/            # Patient-specific pages
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── consents/page.tsx
│   │   │   └── data/page.tsx
│   │   ├── researcher/          # Researcher-specific pages
│   │   │   ├── marketplace/page.tsx
│   │   │   └── studies/page.tsx
│   │   └── provider/            # Provider-specific pages
│   │       └── requests/page.tsx
│   ├── layout.tsx               # Root layout
│   └── page.tsx                # Landing page
├── components/                  # Reusable components
│   ├── ui/                    # shadcn/ui components
│   ├── auth/                   # Authentication components
│   ├── dashboard/              # Dashboard widgets
│   └── web3/                   # Web3-specific components
├── lib/                        # Utilities
│   ├── web3auth.ts             # Web3Auth configuration
│   ├── wagmi.ts                # Wagmi configuration
│   └── api.ts                 # API client
├── hooks/                      # Custom React hooks
│   ├── use-auth.ts
│   └── use-web3.ts
├── stores/                     # Zustand stores
│   └── ui-store.ts
└── types/                      # TypeScript types
    └── index.ts
\`\`\`

### 1.2 Install and Configure shadcn/ui

**Commands:**
\`\`\`bash
npx shadcn@latest init
npx shadcn@latest add button card input label select
npx shadcn@latest add dialog dropdown-menu sheet table
npx shadcn@latest add alert badge separator tabs avatar
npx shadcn@latest add form toast navigation
\`\`\`

**Configuration:** \`components.json\`
- Component directory set to \`components/ui\`
- Tailwind CSS configured
- TypeScript paths set up

### 1.3 Configure Wagmi + Web3Auth

**File: \`lib/wagmi.ts\`**
\`\`\`typescript
import { http, createConfig } from 'wagmi'
import { web3authWallet } from '@web3auth/modal'
import { mainnet, sepolia } from 'wagmi/chains'

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [web3authWallet()],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})
\`\`\`

**File: \`lib/web3auth.ts\`**
\`\`\`typescript
import { Web3Auth } from '@web3auth/modal'
import { CHAIN_NAMESPACES } from '@web3auth/base'

export const web3auth = new Web3Auth({
  clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID!,
  web3AuthNetwork: process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK!,
  chainConfig: {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: process.env.NEXT_PUBLIC_CHAIN_ID!,
    rpcTarget: process.env.NEXT_PUBLIC_RPC_URL!,
    displayName: 'Ethereum Mainnet',
    blockExplorer: 'https://etherscan.io',
    ticker: 'ETH',
    tickerName: 'Ethereum',
  },
})
\`\`\`

### 1.4 Configure TanStack Query

**File: \`app/providers.tsx\`**
\`\`\`typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi/providers'
import { config } from '../lib/wagmi'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
\`\`\`

---

## Phase 2: Authentication Flow (Weeks 2-3)

### 2.1 Login Page

**File: \`app/(auth)/login/page.tsx\`**

User Experience:
1. Patient sees landing with "Sign in with Google/Apple" buttons
2. Clicks social login button
3. Web3Auth OAuth modal opens
4. Redirect to dashboard after successful login
5. JWT token stored in secure HTTP-only cookie

### 2.2 Signup Flow

**File: \`app/(auth)/signup/page.tsx\`**

User Experience:
1. Email signup or OAuth with Google/Apple
2. Web3Auth automatically creates non-custodial wallet
3. User profile creation form
4. Initial consent form for HIPAA compliance
5. Redirect to onboarding dashboard

### 2.3 Authentication Components

**File: \`components/auth/login-button.tsx\`**
Web3Auth login button with social provider icons.

**File: \`components/auth/signup-form.tsx\`**
Email/password signup with Zod validation.

**File: \`components/auth/consent-form.tsx\`**
HIPAA consent form with step-by-step wizard.

---

## Phase 3: Patient Dashboard (Weeks 3-5)

### 3.1 Main Dashboard

**File: \`app/(dashboard)/patient/dashboard/page.tsx\`**

Widgets:
1. **Wallet Balance** - ETH and USDC balances
2. **Active Consents** - Current consent status
3. **Recent Activity** - Data access requests and approvals
4. **Earnings** - Risk alerts, security notifications
5. **Quick Actions** - Update consent, view data, share profile

### 3.2 Consent Management

**File: \`app/(dashboard)/patient/consents/page.tsx\`**

Features:
1. Consent history table with status badges
2. Consent form viewer
3. Revoke consent button with confirmation
4. Consent version tracking
5. Data access audit log

### 3.3 Data Management

**File: \`app/(dashboard)/patient/data/page.tsx\`**

Features:
1. Patient data catalog
2. Upload medical records (PDFs)
3. Data access permissions
4. Monetization settings (fee structure)
5. Export data button

### 3.4 Profile & Settings

**File: \`app/(dashboard)/patient/profile/page.tsx\`**

Features:
1. Edit profile information
2. 2FA settings
3. Notification preferences
4. Recovery options setup
5. Privacy settings

---

## Phase 4: Researcher Marketplace (Weeks 5-6)

### 4.1 Marketplace Home

**File: \`app/(dashboard)/researcher/marketplace/page.tsx\`**

Features:
1. Browse available patient datasets
2. Filter by data type, region, price
3. Sort by relevance, date, price
4. Dataset preview cards
5. Purchase access button

### 4.2 Dataset Details

**File: \`app/(dashboard)/researcher/studies/page.tsx\`**

Features:
1. Detailed dataset information
2. Consent status verification
3. Data access request form
4. Fee payment with ETH/USDC
5. Transaction status tracking

---

## Phase 5: Provider Portal (Weeks 6-7)

### 5.1 Provider Dashboard

**File: \`app/(dashboard)/provider/requests/page.tsx\`**

Features:
1. Patient data request form
2. Request status tracking
3. Approved access viewer
4. Download medical records (PDFs)
5. Audit trail viewer

---

## Phase 6: Shared Components (Weeks 4-7)

### 6.1 UI Component Library

**Files:**
- \`components/ui/*\` - shadcn/ui components
- \`components/dashboard/*\` - Dashboard-specific widgets
- \`components/web3/*\` - Web3-specific components (TransactionButton, WalletBalance, etc.)

### 6.2 Web3 Components

**File: \`components/web3/transaction-button.tsx\`**
- Smart contract interaction button with loading states
- Transaction status display (processing, success, error)
- Etherscan link on completion

**File: \`components/web3/wallet-balance.tsx\`**
- Real-time balance display
- Multi-token support (ETH, USDC)
- Refresh button

**File: \`components/web3/transaction-status.tsx\`**
- Processing indicator with spinner
- Success confirmation with hash link
- Error display with retry option

### 6.3 Dashboard Widgets

**File: \`components/dashboard/patient-stats.tsx\`**
- Patient statistics (data shared, studies participated, earnings)

**File: \`components/dashboard/recent-activity.tsx\`**
- Timeline of recent activities
- Activity type icons
- Status indicators

**File: \`components/dashboard/active-consents.tsx\`**
- List of active consent agreements
- Revoke action buttons
- Expiry date warnings

---

## Phase 7: API Integration (Weeks 7-8)

### 7.1 API Client

**File: \`lib/api.ts\`**

\`\`\`typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(\`\${API_BASE_URL}\${endpoint}\`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(\`API error: \${response.statusText}\`)
  }

  return response.json()
}

export const api = {
  // Auth endpoints
  auth: {
    login: (credentials: LoginCredentials) =>
      apiRequest<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  },
  // Consent endpoints
  consents: {
    list: () => apiRequest<Consent[]>('/consents'),
    create: (data: ConsentData) =>
      apiRequest<Consent>('/consents', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    revoke: (id: number) =>
      apiRequest(\`/consents/\${id}/revoke\`, { method: 'POST' }),
  },
  // Blockchain endpoints
  blockchain: {
    subscribe: (address: string) =>
      apiRequest('/blockchain-events/subscribe', {
        method: 'POST',
        body: JSON.stringify({ walletAddress: address }),
      }),
    getBalance: (address: string) =>
      apiRequest<{ balance: string }>(\`/blockchain/balance?address=\${address}\`),
  },
}
\`\`\`

### 7.2 Custom Hooks

**File: \`hooks/use-auth.ts\`**

\`\`\`typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useState } from 'react'

export function useAuth() {
  const queryClient = useQueryClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check auth status
  const { data: user } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: () => api.auth.check(),
    retry: false,
  })

  const loginMutation = useMutation({
    mutationFn: api.auth.login,
    onSuccess: () => {
      setIsAuthenticated(true)
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })

  const logoutMutation = useMutation({
    mutationFn: api.auth.logout,
    onSuccess: () => {
      setIsAuthenticated(false)
      queryClient.clear()
    },
  })

  return {
    user,
    isAuthenticated: !!user,
    isLoading: !user && loginMutation.isPending,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
  }
}
\`\`\`

**File: \`hooks/use-web3.ts\`**

\`\`\`typescript
import { useAccount, useBalance, useWriteContract } from 'wagmi'

export function useWeb3() {
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({ address })

  const { writeContract, isPending } = useWriteContract()

  return {
    address,
    isConnected,
    balance,
    writeContract,
    isWriting: isPending,
  }
}
\`\`\`

---

## Phase 8: Styling & Responsive Design (Weeks 8-9)

### 8.1 Design System

**Color Palette:**
- Primary: Teal/Medical Green (Trust, Health)
- Secondary: Blue/Indigo (Technology, Security)
- Accent: Coral/Orange (Alerts, Actions)
- Background: White/Light Gray (Clean, Professional)

**Typography:**
- Font: Inter (Body), Plus Jakarta Sans (Headings)
- Scale: 12px - 32px (mobile), 14px - 40px (desktop)

**Spacing:**
- Scale: 4px, 8px, 16px, 24px, 32px, 48px, 64px
- Container: 1200px max-width (desktop)

### 8.2 Responsive Breakpoints

\`\`\`css
/* Mobile First */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
\`\`\`

**Layout Patterns:**
- Mobile: Stacked vertical layout, hamburger menu
- Tablet: 2-column grid, bottom navigation
- Desktop: 3-column dashboard, sidebar navigation

---

## Phase 9: Testing (Week 10)

### 9.1 Component Testing

\`\`\`bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest-environment-jsdom
\`\`\`

**Test Files:**
- \`components/__tests__/auth/login-button.test.tsx\`
- \`components/__tests__/dashboard/patient-stats.test.tsx\`
- \`components/__tests__/web3/transaction-button.test.tsx\`

### 9.2 E2E Testing

\`\`\`bash
npm install --save-dev @playwright/test
\`\`\`

**Test Files:**
- \`e2e/auth-flow.spec.ts\`
- \`e2e/patient-dashboard.spec.ts\`
- \`e2e/researcher-marketplace.spec.ts\`

### 9.3 Accessibility Testing

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader compatibility
- Color contrast verification

---

## Phase 10: Deployment (Weeks 11-12)

### 10.1 Production Build

\`\`\`bash
npm run build
\`\`\`

### 10.2 Environment Variables

\`\`\`env
NEXT_PUBLIC_API_URL=https://api.healthmesh.com/api
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_client_id
NEXT_PUBLIC_WEB3AUTH_NETWORK=mainnet
NEXT_PUBLIC_CHAIN_ID=0x1
NEXT_PUBLIC_RPC_URL=https://eth.llamarpc.com
\`\`\`

### 10.3 Deployment

**Options:**
- Vercel (Recommended for Next.js)
- Netlify
- AWS Amplify
- DigitalOcean App Platform

**CI/CD:**
- GitHub Actions for automated deployments
- Environment-specific configurations
- Build verification steps

---

## Tech Stack Summary

| Layer | Technology | Reason |
|--------|-------------|---------|
| Framework | Next.js 15 | Modern React with App Router, server components |
| UI Library | shadcn/ui + Radix UI | Beautiful, accessible, customizable |
| Styling | Tailwind CSS | Utility-first, fast development |
| Web3 | Wagmi + Viem + Web3Auth | Type-safe, OAuth login, non-custodial |
| State Management | TanStack Query + Zustand | Server state + client state |
| Forms | React Hook Form + Zod | Type-safe validation |
| Testing | Jest + Playwright | Unit + E2E testing |
| Deployment | Vercel | Optimized for Next.js |

---

## Page Inventory

| Route | Description | Target User |
|--------|-------------|--------------|
| / | Landing page | All visitors |
| /login | Sign in | Patients, Researchers, Providers |
| /signup | Sign up | Patients, Researchers, Providers |
| /patient/dashboard | Main dashboard | Patients |
| /patient/consents | Consent management | Patients |
| /patient/data | Data catalog | Patients |
| /patient/profile | Settings | Patients |
| /researcher/marketplace | Browse datasets | Researchers |
| /researcher/studies | Study details | Researchers |
| /provider/requests | Data requests | Providers |

---

## Success Criteria

- [ ] Next.js project initialized with shadcn/ui
- [ ] Web3Auth OAuth login working (Google/Apple)
- [ ] Wagmi configured with Web3Auth connector
- [ ] TanStack Query fetching API data
- [ ] Patient dashboard with all widgets functional
- [ ] Researcher marketplace with dataset browsing
- [ ] Provider portal with data request forms
- [ ] Smart contract interactions (consent, access requests)
- [ ] Transaction status tracking working
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] WCAG 2.1 AA accessibility compliance
- [ ] All component tests passing
- [ ] E2E tests for critical flows
- [ ] Production build successful
- [ ] Deployed to production

---

## Cost Estimates

| Component | Year 1 Cost |
|------------|--------------|
| Web3Auth (10k MAU) | $5,000-6,000 |
| Vercel Pro Plan | $480 |
| Development (2 frontend devs, 12 weeks) | $40,000-60,000 |
| Testing & QA | $10,000-15,000 |
| **Total** | **$55,480-81,480** |

---

## Timeline Summary

| Phase | Duration | Milestones |
|-------|-----------|------------|
| Phase 1: Project Setup | Weeks 1-2 | Next.js init, shadcn/ui, Wagmi config |
| Phase 2: Authentication | Weeks 2-3 | Login/Signup, Web3Auth integration |
| Phase 3: Patient Dashboard | Weeks 3-5 | Dashboard, consents, data management |
| Phase 4: Researcher Marketplace | Weeks 5-6 | Marketplace, dataset details, purchasing |
| Phase 5: Provider Portal | Weeks 6-7 | Request forms, status tracking |
| Phase 6: Shared Components | Weeks 4-7 | UI library, Web3 components, widgets |
| Phase 7: API Integration | Weeks 7-8 | API client, custom hooks |
| Phase 8: Styling & Responsive | Weeks 8-9 | Design system, breakpoints |
| Phase 9: Testing | Week 10 | Unit tests, E2E, accessibility |
| Phase 10: Deployment | Weeks 11-12 | Production build, deployment live |

---

