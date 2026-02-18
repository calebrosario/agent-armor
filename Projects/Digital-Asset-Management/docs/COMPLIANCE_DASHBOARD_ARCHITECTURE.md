# Compliance Dashboard Architecture

## Executive Summary

This document defines architecture for Phase 4.5: Compliance Reporting Dashboard

## Technical Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **State Management**: React Context API
- **Data Fetching**: Axios
- **Real-time**: Native WebSocket API
- **Charts**: Recharts
- **Graph Visualization**: React Flow

### Backend
- **Framework**: NestJS 10.x (existing)
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL with TypeORM
- **WebSocket**: @nestjs/websockets

## API Structure

### Dashboard Endpoints
- GET /compliance/dashboard - Full dashboard data
- GET /compliance/metrics - KPI metrics
- GET /compliance/alerts - Compliance alerts

### Existing Security Endpoints
- GET /security/audit-logs
- GET /security/audit-logs/:id/proof
- POST /security/audit-logs/verify-chain
- POST /security/audit-logs/:id/verify-signature
- POST /security/merkle-proof/verify
- GET /security/audit-logs/statistics
- GET /security/audit-logs/public-key
- GET /security/compliance-info

## Component Structure

### Pages
- /dashboard/overview - Compliance scorecards
- /dashboard/logs - Audit log viewer
- /dashboard/hash-chain/[id] - Hash chain visualizer
- /dashboard/merkle-proof/[batchId]/[logId] - Merkle tree
- /dashboard/blockchain - Blockchain verification
- /dashboard/alerts - Real-time alerts

### Shared Components
- DashboardShell, Sidebar, Header, Scorecard
- LogTable, LogFilters, LogDetail
- HashChainGraph, MerkleTree, ComplianceTrendChart
- AlertList, AlertCard, AlertNotification
- AnchoredBatchList, BatchCard, VerificationBadge

## WebSocket Events

### Server → Client
- log.created - New security log
- alert.created - New compliance alert
- compliance.status.changed - Compliance score update
- blockchain.anchored - Merkle root anchored

### Client → Server
- subscribe - Subscribe to channels
- unsubscribe - Unsubscribe from channels

---

**Version**: 1.0  
**Date**: 2026-01-28
