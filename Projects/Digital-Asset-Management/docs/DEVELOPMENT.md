# Development Guide for Digital Asset Management Platform

This guide covers local development setup, debugging, and common workflows for the Digital Asset Management Platform.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Local Development Environment](#local-development-environment)
- [Development Workflows](#development-workflows)
- [Debugging](#debugging)
- [Testing Locally](#testing-locally)
- [Common Issues](#common-issues)

---

## Prerequisites

### Required Software

- **Node.js** v20 LTS or later
- **npm** v10+ or **yarn** v1.22+
- **Docker** and **Docker Compose** v2.0+
- **Git** v2.0+
- **VS Code** (recommended) with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript Vue/React Plugin

### Optional but Recommended

- **PostgreSQL client** (DBeaver, pgAdmin)
- **Redis client** (Redis Insight, Redis Commander)
- **Browser wallet** (MetaMask, WalletConnect)
- **IPFS desktop client** (IPFS Desktop)

---

## Quick Start

### 1. Clone and Setup

```bash
# Clone repository
git clone https://github.com/calebrosario/digital-asset-management.git
cd digital-asset-management

# Install dependencies
npm run install:all

# Or install per subproject
cd frontend && npm install
cd ../api && npm install
cd ../blockchain && npm install
```

### 2. Configure Environment

```bash
# Copy example environment files
cp api/.env.example api/.env
cp frontend/.env.example frontend/.env
cp blockchain/.env.example blockchain/.env

# Edit environment files
nano api/.env
nano frontend/.env
nano blockchain/.env
```

**Required Environment Variables:**

See [docs/GITHUB_SECRETS.md](docs/GITHUB_SECRETS.md) for complete list.

#### Frontend (.env)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
```

#### Backend (api/.env)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/digital_assets
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_SECRET=your_facebook_app_secret
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
POLYGON_RPC_URL=https://polygon-rpc.com
ASSET_TOKEN_ADDRESS=0x...
ESCROW_CONTRACT_ADDRESS=0x...
```

#### Blockchain (blockchain/.env)

```env
PRIVATE_KEY=your_deployer_private_key
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

### 3. Start Development

```bash
# Using Docker Compose (recommended)
docker-compose up -d

# This starts:
# - PostgreSQL: port 5432
# - Redis: port 6379
# - Backend API: port 3001
# - Frontend: port 3000
```

### 4. Verify Services

```bash
# Frontend
curl http://localhost:3000

# Backend health
curl http://localhost:3001/health

# Backend API docs
curl http://localhost:3001/api
```

---

## Local Development Environment

### Architecture Overview

The development environment consists of:

```
┌─────────────────────────────────────────────────────┐
│          Your Browser                           │
│  http://localhost:3000 (Frontend)            │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│         Docker Network                          │
│  ┌───────────────────────────────────────┐    │
│  │ Next.js Frontend                   │    │
│  │ Port 3000                         │    │
│  └───────────────────────────────────────┘    │
│  ┌───────────────────────────────────────┐    │
│  │ NestJS Backend                     │    │
│  │ Port 3001                         │    │
│  └───────────────────────────────────────┘    │
│  ┌───────────────────────────────────────┐    │
│  │ PostgreSQL                        │    │
│  │ Port 5432                         │    │
│  └───────────────────────────────────────┘    │
│  ┌───────────────────────────────────────┐    │
│  │ Redis                             │    │
│  │ Port 6379                         │    │
│  └───────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Service Startup Order

1. **Infrastructure**: Docker Compose starts containers
2. **Database**: PostgreSQL initializes schema
3. **Cache**: Redis starts (no persistence needed)
4. **Backend**: NestJS API connects to DB and Redis
5. **Frontend**: Next.js connects to Backend API

### Hot Reloading

All services support hot reloading:

- **Frontend**: Next.js dev server (auto-reload on file save)
- **Backend**: Nodemon (auto-restart on file save)
- **Smart Contracts**: Hardhat watch mode (if using)
- **Docker**: Volume mounts for hot reload

---

## Development Workflows

### Frontend Development

#### Running Frontend

```bash
cd frontend
npm run dev

# Opens: http://localhost:3000
```

#### Building for Testing

```bash
cd frontend
npm run build

# Preview production build
npm start
```

#### Frontend Code Structure

```
frontend/src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth-related routes
│   ├── (dashboard)/       # Dashboard layout
│   ├── assets/            # Asset pages
│   ├── escrows/           # Escrow pages
│   ├── profile/            # Profile page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # Reusable components
│   ├── Layout.tsx          # Page wrapper
│   ├── Sidebar.tsx          # Navigation
│   ├── Navbar.tsx           # Top navigation
│   ├── AssetCreationForm.tsx # Asset form
│   ├── DeedUpload.tsx       # File upload
│   └── AccessibleButton.tsx # A11y wrapper
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts           # Auth state management
│   ├── useWallet.ts         # Wallet connection
│   ├── useMint.ts          # Minting logic
│   └── useCustodialMint.ts  # Custodial variant
└── lib/                    # Utilities
    ├── api.ts               # API client
    ├── clients/
    │   └── wagmi.ts        # Wagmi config
    └── constants.ts         # Route constants
```

#### State Management

```typescript
// Using TanStack Query for server state
import { useQuery, useMutation } from '@tanstack/react-query';

function MyComponent() {
  const { data } = useQuery({
    queryKey: ['assets'],
    queryFn: () => fetchAssets()
  });

  const mutation = useMutation({
    mutationFn: createAsset,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries(['assets']);
    }
  });
}
```

#### Common Patterns

**API Calls**:

```typescript
// ✅ Good: Use TanStack Query
const { data } = useQuery(['asset', id], () => fetchAsset(id));

// ❌ Bad: Direct useEffect + fetch
const [asset, setAsset] = useState(null);
useEffect(() => {
  fetchAsset(id).then(setAsset);
}, [id]);
```

**Auth Checks**:

```typescript
// ✅ Good: Use useAuth hook
const { isAuthenticated, user } = useAuth();

if (!isAuthenticated) {
  return <Navigate to="/login" />;
}

// ❌ Bad: Check localStorage directly
if (typeof localStorage !== 'undefined' && localStorage.getItem('token')) {
  // Do auth logic
}
```

### Backend Development

#### Running Backend

```bash
cd api
npm run start:dev

# Opens: http://localhost:3001
```

#### Backend Code Structure

```
api/src/
├── auth/                  # Authentication & authorization
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/          # Passport strategies
│   │   ├── google.strategy.ts
│   │   ├── facebook.strategy.ts
│   │   └── jwt.strategy.ts
│   ├── guards/              # Route guards
│   └── decorators/          # Custom decorators
├── assets/                 # Asset management
│   ├── assets.controller.ts
│   ├── assets.service.ts
│   ├── entities/           # TypeORM entities
│   └── dto/                # Data transfer objects
├── escrows/                # Escrow logic
│   ├── escrows.controller.ts
│   ├── escrows.service.ts
│   └── entities/
├── users/                  # User management
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── entities/
├── common/                 # Shared utilities
│   ├── filters/             # Exception filters
│   ├── interceptors/        # HTTP interceptors
│   └── decorators/          # Custom decorators
└── main.ts                 # Application entry point
```

#### Common Patterns

**Dependency Injection**:

```typescript
// ✅ Good: Constructor injection
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    private ipfsService: IpfsService
  ) {}
}

// ❌ Bad: Import service directly
import { assetRepository } from './repository';
```

**DTOs for Validation**:

```typescript
// ✅ Good: Use DTOs with class-validator
export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  description: string;
}

// ❌ Bad: Validate in controller
if (!req.body.title) {
  throw new BadRequestException('Title required');
}
```

**Error Handling**:

```typescript
// ✅ Good: Use exception filters
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException) {
    return {
      statusCode: exception.getStatus(),
      message: exception.message,
    };
  }
}
```

### Blockchain Development

#### Running Hardhat Node

```bash
cd blockchain
npm run node

# Local blockchain for testing
# Port: 8545
```

#### Compiling Contracts

```bash
cd blockchain
npm run compile

# Outputs to: artifacts/contracts/
```

#### Running Tests

```bash
# Foundry tests (fast)
npm run test:forge

# Hardhat tests
npm run test

# With gas report
npm run test:forge
```

#### Deploying Locally

```bash
# Deploy to Hardhat network
npx hardhat run scripts/deploy-local.js --network hardhat

# Deploy to Amoy testnet (recommended - Mumbai is deprecated)
npx hardhat run scripts/deploy-amoy.js --network polygonAmoy

# Deploy to Mumbai testnet (deprecated - use Amoy instead)
# npx hardhat run scripts/deploy-mumbai.js --network polygonMumbai
```

---

## Debugging

### Frontend Debugging

#### Using VS Code

1. **Install React DevTools** browser extension
2. **Add launch configuration** to `.vscode/launch.json`:

   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "type": "node",
         "request": "launch",
         "name": "Debug Next.js",
         "runtimeExecutable": "npm",
         "runtimeArgs": ["run", "dev"],
         "console": "integratedTerminal"
       }
     ]
   }
   ```

3. **Set breakpoints** in `.tsx` files
4. **Press F5** to start debugging

#### Console Logging

```typescript
// ✅ Good: Structured logging
console.log('[useAuth]', { isAuthenticated, user });

// ❌ Bad: Unstructured logging
console.log('User is auth:', user);
```

#### Network Requests

```typescript
// Use browser DevTools Network tab
// Or use TanStack Query DevTools

// Configure for development
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnWindowFocus: true,
    },
  },
});
```

### Backend Debugging

#### Using VS Code

1. **Add launch configuration** to `api/.vscode/launch.json`:

   ```json
   {
     "type": "node",
     "request": "launch",
     "name": "Debug NestJS",
     "runtimeExecutable": "npm",
     "runtimeArgs": ["run", "start:dev"],
     "sourceMaps": true,
     "cwd": "${workspaceFolder}/api"
   }
   ```

2. **Set breakpoints** in `.ts` files
3. **Press F5** to start debugging

#### Logging

```typescript
// ✅ Good: Use NestJS Logger
private readonly logger = new Logger(AssetsService.name);

this.logger.log(`Fetching asset ${id}`);

// ❌ Bad: console.log
console.log('Fetching asset', id);
```

#### Database Debugging

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d digital_assets

# View all tables
\dt

# Query assets
SELECT * FROM assets LIMIT 10;
```

### Blockchain Debugging

#### Hardhat Console

```bash
# Start Hardhat node with console
npx hardhat node --network hardhat

# Add console.log in contracts
contract.functions.getData().call();

# View in node console
```

#### Test Failures

```bash
# Foundry tests with verbose output
forge test -vvv

# Hardhat tests with verbose
npx hardhat test --verbose

# Run specific failing test
forge test --match-test testCreateAsset
```

---

## Testing Locally

### Frontend Tests

```bash
cd frontend
npm test

# Watch mode
npm test -- --watch

# Coverage
npm run test:coverage
```

### Backend Tests

```bash
cd api
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

### Blockchain Tests

```bash
cd blockchain

# Foundry tests (fast, gas report)
npm run test:forge

# Hardhat tests
npm test

# Coverage
npm run test:forge:coverage
```

### E2E Tests

```bash
# Playwright E2E tests
npm run test:e2e

# With UI
npx playwright test --ui
```

---

## Common Issues

### Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port in .env
PORT=3001 npm run dev
```

### Database Connection Failed

**Error**: `Connection refused` or `FATAL: password authentication failed`

**Solution**:

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check environment variables
cat api/.env | grep DATABASE_URL

# Verify database exists
docker exec -it postgres psql -U postgres -c "\l"
```

### CORS Errors

**Error**: `Access to XMLHttpRequest at 'http://localhost:3001' has been blocked by CORS`

**Solution**:

Backend CORS configuration in `main.ts`:

```typescript
app.enableCors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
});
```

### Smart Contract Gas Issues

**Error**: `insufficient funds for gas`

**Solution**:

```bash
# Check wallet balance
npx hardhat run scripts/check-balance.js --network polygonMumbai

# Add MATIC to wallet
```

### IPFS Upload Failed

**Error**: `File too large` or `Upload timeout`

**Solution**:

```typescript
// Implement chunked upload
// Or use streaming upload
const formData = new FormData();
formData.append('file', file.slice(0, CHUNK_SIZE));
```

---

## Performance Tips

### Frontend

- Use `React.memo()` for expensive components
- Virtualize long lists with `react-window`
- Lazy load routes with Next.js dynamic imports
- Optimize images (WebP, responsive sizes)

### Backend

- Use database indexes on foreign keys
- Implement caching for frequently accessed data
- Use connection pooling
- Enable query logging to identify slow queries

### Blockchain

- Batch operations when possible
- Use `view` functions instead of state changes
- Optimize loops and storage

---

## Next Steps

After completing local development:

1. Run full test suite
2. Review code for linting issues
3. Commit changes with conventional commits
4. Create pull request targeting `develop` branch

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for contribution guidelines.
