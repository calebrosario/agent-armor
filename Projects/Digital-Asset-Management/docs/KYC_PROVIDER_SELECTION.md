# KYC Provider Selection Analysis for Real Estate Tokenization Platform

**Date**: January 28, 2026
**Phase**: Phase 4.1 - Research and select KYC provider

---

## Executive Summary

This document provides a comprehensive analysis of KYC (Know Your Customer) providers for a real estate tokenization platform operating on Polygon blockchain. After evaluating 7 providers across API capabilities, pricing, compliance, integration complexity, and real estate/crypto suitability, **Sumsub** is recommended as the primary provider with **Stripe Identity** as a cost-effective alternative for MVP phase.

---

## Platform Context

**Business Requirements:**
- Target markets: United States and European Union
- User volume: 1,000-5,000 users (MVP/seed stage)
- KYC use cases: Asset minting, escrow creation, share trading
- Regulatory requirements: US securities laws, EU AMLD5/AMLD6, MiCA compliance

**Technical Context:**
- Backend: NestJS (TypeScript)
- Frontend: Next.js
- Blockchain: Polygon
- Existing: Web3Auth for wallet authentication
- Token standards: ERC-1155 (deeds), ERC-20 (shares)

---

## Provider Comparison Matrix

### 1. Trulioo

| Category | Details |
|----------|----------|
| **Overall Rating** | 8.5/10 |
| **Pricing** | Median: $4,500/year ($3,870-$16,050 range) |
| **Country Coverage** | 195 countries, 5B individuals, 700M business entities |
| **Document Types** | 14,000+ document templates |
| **Compliance** | ISO 27001, SOC 2 Type 2, GDPR, FinCEN/FCA |
| **TypeScript Support** | ✅ @trulioo/docv SDK available |
| **Integration Complexity** | Medium-High (OAuth 2.0, webhook setup) |
| **Key Strengths** | Global coverage, KYB verification, enterprise-grade |
| **Key Weaknesses** | High pricing, complex integration, no real estate-specific workflows |

**Pros:**
- Unmatched global reach (195 countries)
- Comprehensive KYB/UBO verification for SPV entities
- Strong compliance posture across multiple jurisdictions
- Advanced ML-powered fraud detection
- Suitable for high-volume enterprise operations

**Cons:**
- Enterprise-level pricing may be prohibitive for MVP stage
- Medium-high integration complexity (6-8 weeks)
- No publicly visible real estate case studies
- Custom quotes required (uncertain cost structure)

**Best For:** Large-scale platforms with international investors and strict compliance needs

---

### 2. Onfido (Entrust)

| Category | Details |
|----------|----------|
| **Overall Rating** | 8.5/10 |
| **Pricing** | Custom (contact required for quotes) |
| **Country Coverage** | 195+ countries, 2,500+ document types |
| **Compliance** | SOC 2 Type II, ISO 27001/27701/9001/14001, GDPR, ETSI |
| **TypeScript Support** | ✅ @onfido/api SDK (v5.6.0) |
| **Integration Complexity** | Low-Medium (well-documented API, workflow builder) |
| **Key Strengths** | Strong compliance, enterprise backing (Entrust acquisition), documentation quality |
| **Key Weaknesses** | No public pricing, limited real estate case studies |

**Pros:**
- Comprehensive documentation and examples
- Multiple SDK options
- Workflow Studio for no-code customization
- Strong enterprise security certifications
- Robust webhook system

**Cons:**
- No public pricing (uncertain cost structure)
- Limited explicit real estate/tokenization case studies
- Requires sales contact for all inquiries
- Multiple components to integrate

**Best For:** Mid-to-large scale platforms prioritizing compliance and security

---

### 3. Stripe Identity

| Category | Details |
|----------|----------|
| **Overall Rating** | 7.5/10 |
| **Pricing** | $1.50 per verification, 50 free verifications, no monthly minimums |
| **Country Coverage** | 100+ countries |
| **Document Types** | Government IDs from 100+ countries, selfie verification, ID number validation (US only) |
| **Compliance** | SOC 2 Type 2, GDPR, PCI DSS Level 1 |
| **TypeScript Support** | ✅ First-class TypeScript support (Stripe SDK ecosystem) |
| **Integration Complexity** | Low (familiar Stripe API patterns) |
| **Key Strengths** | Low cost, easy integration, pay-as-you-go, excellent docs |
| **Key Weaknesses** | Limited KYB/entity verification, fewer features than dedicated KYC providers |

**Pros:**
- Transparent pricing with no monthly commitments
- First 50 verifications free ($75 value)
- Excellent TypeScript/Node.js SDK documentation
- Seamless integration if using Stripe for payments
- Low implementation complexity (2-3 weeks)
- Strong security infrastructure

**Cons:**
- Limited to 100+ countries (vs 195+ for competitors)
- No KYB/entity verification capabilities
- US SSN validation only (no international ID number validation)
- Not optimized for crypto/DeFi use cases
- Basic verification types only

**Best For:** MVP stage platforms with tight budgets, using Stripe for payments, or needing rapid implementation

---

### 4. Veriff

| Category | Details |
|----------|----------|
| **Overall Rating** | 8.0/10 |
| **Pricing** | Essential: $0.80/verif, Plus: $1.89/verif, Premium: $2.05/verif |
| **Minimum Monthly** | Essential: $49, Plus: $129, Premium: $249 |
| **Country Coverage** | 190+ countries |
| **Document Types** | Government IDs, liveness detection, video verification |
| **Compliance** | SOC 2 Type II, ISO 27001, GDPR |
| **TypeScript Support** | ✅ Official SDKs available |
| **Integration Complexity** | Low-Medium |
| **Key Strengths** | Transparent pricing, strong fraud detection, good UX |
| **Key Weaknesses** | No explicit real estate workflows, monthly minimums may be restrictive |

**Pros:**
- Clear, transparent pricing structure
- Strong liveness detection and anti-spoofing
- Good global coverage
- Strong fraud prevention capabilities
- Multiple plan tiers to match business needs

**Cons:**
- Monthly minimums may be wasteful for low-volume MVP
- No explicit KYB/entity verification
- Limited real estate tokenization case studies
- No specific crypto/DeFi features

**Best For:** Small-to-medium platforms needing cost-effective verification with strong UX

---

### 5. Sumsub

| Category | Details |
|----------|----------|
| **Overall Rating** | 9.0/10 |
| **Pricing** | Basic: $1.35/verif, Compliance: $1.85/verif |
| **Minimum Monthly** | Basic: $149, Compliance: $299 |
| **Country Coverage** | 220+ countries, 14,000+ document types |
| **Document Types** | KYC, KYB, AML, PEP screening, transaction monitoring |
| **Compliance** | SOC 2 Type II, ISO 27001, GDPR, AMLD5/6, MiCA |
| **TypeScript Support** | ✅ Full TypeScript SDK support |
| **Integration Complexity** | Medium |
| **Key Strengths** | Crypto/real estate focused, comprehensive compliance, competitive pricing |
| **Key Weaknesses** | Slightly higher minimum monthly commitments |

**Pros:**
- **Strong crypto/DeFi expertise** - specifically designed for crypto exchanges, wallets, and DeFi platforms
- **Real estate specialization** - KYB for property ownership verification, UBO checks
- **Comprehensive compliance** - AML, PEP screening, transaction monitoring in one platform
- **Transparent pricing** - Clear per-verification costs with monthly minimums
- **Travel Rule support** - Built-in compliance for crypto transfers
- **MiCA compliance** - Ready for EU crypto-asset regulations

**Cons:**
- Monthly minimums ($149-$299) may be high for MVP volume
- Medium integration complexity
- Higher per-verification cost than Veriff/Stripe

**Best For:** Crypto and real estate tokenization platforms requiring comprehensive compliance and regulation-specific features

---

### 6. Jumio

| Category | Details |
|----------|----------|
| **Overall Rating** | 7.5/10 |
| **Pricing** | Median: $55,850/year (higher end of market) |
| **Country Coverage** | 200+ countries |
| **Compliance** | SOC 2 Type II, ISO 27001, GDPR |
| **TypeScript Support** | ✅ SDKs available |
| **Integration Complexity** | Medium |
| **Key Strengths** | Advanced fraud detection, established provider |
| **Key Weaknesses** | High pricing, no crypto specialization |

**Pros:**
- Advanced fraud detection capabilities
- Strong real estate industry presence
- Established provider with good reputation
- Comprehensive document verification

**Cons:**
- **Highest pricing** among evaluated providers
- No specific crypto/DeFi features
- Enterprise pricing may not suit MVP stage
- Limited transparency on pricing structure

**Best For:** Enterprise platforms with advanced fraud prevention needs and larger budgets

---

### 7. Persona

| Category | Details |
|----------|----------|
| **Overall Rating** | 8.0/10 |
| **Pricing** | Custom (contact required) |
| **Country Coverage** | 200+ countries |
| **Compliance** | SOC 2 Type II, ISO 27001, GDPR |
| **TypeScript Support** | ✅ Official SDKs available |
| **Integration Complexity** | Medium |
| **Key Strengths** | Highly customizable workflows, flexible orchestration |
| **Key Weaknesses** | No public pricing, steeper learning curve |

**Pros:**
- Highly customizable verification workflows
- Flexible orchestration layer
- Good for complex, multi-step verification processes
- Strong enterprise features

**Cons:**
- No public pricing (uncertain costs)
- More complex to implement
- Requires custom workflow design
- Not specifically crypto-focused

**Best For:** Platforms with complex, multi-step verification requirements

---

## Comparative Summary Table

| Provider | Price Range | Countries | Real Estate | Crypto | Compliance | Integration | Rating |
|-----------|-------------|------------|-------------|-------|-------------|---------|
| **Sumsub** | $1.35-$1.85/verif | 220+ | ✅ Excellent | ✅ Excellent | Medium | **9.0/10** |
| Trulioo | $4,500+/year | 195 | ✅ Good | ⚠️ Limited | High | 8.5/10 |
| Onfido | Custom | 195+ | ⚠️ Basic | ✅ Excellent | Low-Med | 8.5/10 |
| Veriff | $0.80-$2.05/verif | 190+ | ⚠️ Basic | ✅ Good | Low-Med | 8.0/10 |
| Persona | Custom | 200+ | ⚠️ Basic | ✅ Good | Medium | 8.0/10 |
| Stripe Identity | $1.50/verif | 100+ | ❌ Limited | ✅ Good | Low | 7.5/10 |
| Jumio | $55,850+/year | 200+ | ✅ Good | ✅ Good | Medium | 7.5/10 |

---

## Regulatory Requirements Analysis

### United States Requirements

1. **Bank Secrecy Act & USA PATRIOT Act**
   - KYC for all customers (identity verification of beneficial owners)
   - 5-year record retention
   - SAR filing for suspicious transactions

2. **FinCEN Guidelines**
   - Residential Real Estate Reporting Rule (effective March 2026)
   - Non-financed transfers to legal entities must be reported
   - Beneficial ownership verification mandatory

3. **SEC Regulations**
   - Real estate tokens likely classified as securities (Howey Test)
   - Platform must register with SEC or qualify for exemption
   - Accredited investor verification may be required

### European Union Requirements

1. **AMLD5/AMLD6**
   - CASPs (crypto-asset service providers) must obtain authorization
   - Enhanced due diligence for high-risk jurisdictions
   - UBO verification mandatory

2. **MiCA (Markets in Crypto-Assets)**
   - Full implementation in 2026
   - Consumer protection, market integrity rules
   - Stablecoin regulation
   - CASP authorization by July 1, 2026

3. **GDPR**
   - Data minimization and consent requirements
   - Data subject rights (access, deletion, portability)
   - 72-hour breach notification
   - Data protection officer required

---

## Recommendations

### Primary Recommendation: **Sumsub**

**Rationale:**
1. **Crypto/Real Estate Specialization** - Purpose-built for crypto exchanges and real estate platforms
2. **Comprehensive Compliance** - KYC, KYB, AML, PEP, transaction monitoring in one platform
3. **MiCA Ready** - Already compliant with upcoming EU crypto regulations
4. **Reasonable Pricing** - $1.35-$1.85 per verification vs $4,500+/year for Trulioo
5. **Global Coverage** - 220+ countries, 14,000+ document types
6. **TypeScript Support** - Full SDK support for NestJS integration

**Implementation Strategy:**
- Start with Basic plan ($1.35/verif, $149 minimum)
- Implement KYC for individual investors (Phase 1)
- Add KYB/UBO verification for SPV entities (Phase 2)
- Enable AML/PEP screening (Phase 3)
- Configure transaction monitoring (Phase 4)

**Projected Costs (1,000 users):**
- Verification: $1,350
- Minimum monthly: $149
- **Total: ~$1,500 (vs $4,500+ for Trulioo)**

---

### Alternative Recommendation: **Stripe Identity** (for MVP Cost Optimization)

**Rationale:**
1. **Lowest Cost** - $1.50/verification with 50 free
2. **Rapid Integration** - Stripe ecosystem, 2-3 week timeline
3. **No Minimums** - Pay-as-you-go, ideal for testing
4. **Strong TypeScript Support** - Best-in-class documentation

**When to Use:**
- MVP phase with tight budget
- Proving KYC concept before committing to specialized provider
- Already using Stripe for payments
- Need rapid time-to-market

**Limitations:**
- No KYB/entity verification (critical for real estate SPVs)
- Limited to 100 countries
- Not crypto-optimized

**Best For:** MVP stage platforms with tight budgets, using Stripe for payments, or needing rapid implementation

---

### Phased Implementation Approach

**Phase 1: MVP (0-1,000 users)**
- Provider: **Stripe Identity** (cost optimization)
- Implement: Basic document + biometric verification
- Focus: Prove concept, validate user flow

**Phase 2: Growth (1,000-5,000 users)**
- Provider: **Migrate to Sumsub** (comprehensive compliance)
- Implement: KYC + KYB + AML + PEP screening
- Focus: Regulatory compliance for US/EU markets
- Add: Transaction monitoring and Travel Rule compliance

**Phase 3: Scale (5,000+ users)**
- Provider: **Sumsub** (or evaluate Trulioo/Onfido)
- Optimize: Custom workflows for specific use cases
- Focus: Enterprise-grade features and dedicated support

---

## Web3Auth Integration Note

The platform already has Web3Auth for wallet authentication. Web3Auth provides:
- `@web3auth/kyc-embed` package for liveness detection
- Basic KYC verification capabilities
- OAuth-based authentication

**Recommendation:**
- Keep Web3Auth for wallet authentication
- Use dedicated KYC provider (Sumsub) for comprehensive verification
- Combine: Web3Auth (auth) + Sumsub (verification)
- Benefit: Best of both - seamless onboarding with robust compliance

---

## Next Steps

### Immediate Actions:
1. **Contact Sumsub** for enterprise demo and custom quote
2. **Request sandbox access** for integration testing
3. **Develop integration plan** with API documentation review
4. **Define verification workflows** for asset minting vs escrow creation
5. **Implement data mapping** to existing UsersEntity

### Technical Implementation:
- Create `KycService` in NestJS
- Implement Sumsub SDK integration
- Add webhook handlers for verification callbacks
- Update user entity with verification status
- Add verification checks to asset minting endpoints
- Add verification checks to escrow creation endpoints

### Compliance Documentation:
- Document all verification procedures
- Maintain audit logs of KYC checks
- Implement data retention policies (5 years per regulations)
- Establish data deletion procedures (GDPR right to erasure)

---

## Decision Summary

**Selected Provider:** Sumsub
**Primary Reason:** Crypto/real estate specialization with comprehensive compliance at competitive pricing
**Backup Option:** Stripe Identity for MVP cost optimization
**Implementation Timeline:** 6-8 weeks for full integration
**Budget Estimate:** $1,500-$3,000 for 1,000 users (vs $4,500-$16,050 for alternatives)

**Risk Assessment:**
- **Low Risk** - Sumsub has proven track record with crypto/real estate clients
- **Medium Risk** - Integration complexity requires dedicated development effort
- **Low Risk** - Pricing transparent and competitive

**Go/No-Go Decision:** ✅ **GO** with Sumsub, with Stripe as fallback for MVP phase

---

*Prepared by: Sisyphus GLM-4.7*
*Session Continuation: Previous session completed Phase 1-3.7, picking up at Phase 4.1*
