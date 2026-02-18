# AGENTS.md - Guidelines for AI Coding Agents

Essential guidelines for working on Health-Mesh Medical Research Platform.

---

## 🚀 BUILD / LINT / TEST COMMANDS

### Smart Contracts (Hardhat 3)
```bash
npx hardhat test                # Run all tests
npx hardhat test solidity        # Foundry-style tests only
npx hardhat test mocha           # TypeScript tests only
npx hardhat test test/Counter.ts # Single test file
npx hardhat test --grep "pattern" # Tests by pattern
npx hardhat compile              # Compile contracts
npx hardhat node                 # Start local node
npx hardhat ignition deploy ignition/modules/Module.ts # Deploy
```

### API Layer
```bash
cd api/ && npm install          # Install dependencies
npm test                         # Run API tests (to be added)
```

### Docker
```bash
docker-compose up -d              # Start PostgreSQL and Redis
docker-compose down                # Stop services
```

---

## 📐 CODE STYLE GUIDELINES

### Smart Contracts (Solidity ^0.8.27)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;
import "@openzeppelin/contracts-upgradeable/...";

/// @title ContractName
contract ContractName is Initializable, ParentContractUpgradeable {
    event EventName(uint256 indexed param1, uint256 param2);
    mapping(uint256 => uint256) public stateVariable;
    
    function initialize(...) external initializer { __Parent_init(); }
    function externalFunction(uint256 param) external { /* impl */ }
}
```

**Naming:** Contracts `PascalCase`, Functions `camelCase`, Internal `_underscore`, Events `PascalCase`, Constants `UPPER_SNAKE_CASE`

**Security:** Use `nonReentrant` on state-changing functions, `SafeERC20Upgradeable` for tokens, `require()` validation, emit events for state changes, UUPS proxy pattern, define roles: `bytes32 public constant ROLE = keccak256("ROLE_NAME")`

---

### TypeScript / Node.js API

**Imports:**
```typescript
import express from 'express';
import { Router, Request, Response } from 'express';
import { Entity, Column } from 'typeorm';
import type { HardhatUserConfig } from 'hardhat/config';
```

**File Naming:** Entities: `kebab-case.entity.ts`, DTOs: `kebab-case.dto.ts`, Services: `kebab-case.service.ts`, Routes: `kebab-case.routes.ts`, Middleware: `kebab-case.middleware.ts`, Utils: `kebab-case.ts`

**Naming:** Classes `PascalCase`, Functions/Variables `camelCase`, Constants `UPPER_SNAKE_CASE`

**Type Annotations & Errors:**
```typescript
async function create(userId: number, data: any): Promise<Consent> {
  return await manager.create(Consents, { ... });
}

router.post('/', async (req, res) => {
  try {
    const result = await service.create(...);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error:', err);
    res.status(400).json({ error: err.message });
  }
});
```

**Database (TypeORM):**
```typescript
@Entity('table_name')
export class EntityName {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'timestamp with time zone' }) created_at: Date;
  @ManyToOne(() => RelatedEntity) @JoinColumn({ name: 'relation_id' }) relation: RelatedEntity;
}

return await getConnection().transaction(async manager => {
  const entity = manager.create(Entity, data);
  await manager.save(entity);
});
```

**Validation:**
```typescript
export class CreateConsentDto {
  @IsInt() form_def_id: number;
  @IsOptional() @IsString() name?: string;
}
```

**Logging:**
```typescript
import logger from './logger';
logger.info('User action', { userId, action });
logger.error('Error', { error: err.message });
```

---

## 📂 PROJECT STRUCTURE

```
medical-research-platform/
├── contracts/              # Solidity contracts (.sol) and *.t.sol tests
├── test/                   # Hardhat Mocha tests (.ts)
├── api/                    # Node.js backend
│   ├── entities/           # TypeORM entities (*.entity.ts)
│   ├── dto/               # DTOs (*.dto.ts)
│   ├── services/           # Business logic (*.service.ts)
│   ├── routes/            # Express routes (*.routes.ts)
│   ├── middleware/        # Express middleware (*.middleware.ts)
│   └── *.js              # Worker files (CommonJS)
├── database/              # SQL schemas
└── docs/                  # Documentation
```

---

## 📝 KEY POINTS

- **Environment:** Use `dotenv` to load from `.env`
- **Database:** PostgreSQL with TypeORM, use transactions for multi-table operations
- **Queues:** BullMQ with Redis for async tasks
- **Storage:** AWS S3 for file storage (PDFs, medical records)
- **Compliance:** All data access must be logged for HIPAA/GDPR/CCPA
- **TypeScript:** ES modules (`"type": "module"`), strict mode enabled
- **Testing:** Test all functions, edge cases, reentrancy; run Slither before deployments

**Follow existing patterns in the codebase!**
