# CSRF Protection Implementation Guide

## Overview

This document provides comprehensive guidance on integrating Cross-Site Request Forgery (CSRF) protection into the Health-Mesh medical research platform.

## Security Compliance

This implementation addresses the following security requirements:
- **OWASP Top 10**: Prevents Cross-Site Request Forgery (A8:2021)
- **HIPAA §164.312(a)(1)**: Access controls to prevent unauthorized data access
- **SOC 2 CC6.1**: Logical and physical access controls
- **NIST SP 800-53 SC-8**: Transmission confidentiality and integrity

## Architecture

### CSRF Secret Management
- **Storage**: AWS Secrets Manager with KMS encryption at rest
- **Secret Name**: `healthmesh/csrf-secret`
- **Fallback**: Environment variable `CSRF_SECRET` (development only)
- **Rotation**: Supported through secret rotation service

### Token Validation
- **Library**: `csrf-csrf` (synchronised token pattern)
- **Token Length**: 128-bit random token
- **Cookie Name**: `_csrf`
- **Header Name**: `x-csrf-token`

## Endpoints

### CSRF Token Endpoint
```
GET /api/csrf-token
```

**Response:**
```json
{
  "csrfToken": "abc123def456..."
}
```

**Usage:** 
- Call this endpoint after successful authentication
- Store the token in your frontend application
- Include the token in all state-changing API requests

### Protected Endpoints

All `POST`, `PATCH`, `DELETE` requests require CSRF protection:
- `/api/auth/*` (except `/api/auth/register` and `/api/auth/login`)
- `/api/consent/*` (all state-changing operations)
- `/api/contracts/*` (all blockchain transactions)
- `/api/wallet/*` (all wallet operations)
- `/api/legal-forms/*` (all form operations)
- `/api/cda/*` (import/validate operations)
- `/api/hl7-outbound/*` (all HL7 operations)
- `/api/epic-oauth/*` (refresh/disconnect)
- `/api/epic/*` (patient operations)
- `/api/consent-definitions/*` (CRUD operations)
- `/api/events/*` (subscribe/unsubscribe)

### Exempt Endpoints
- `POST /api/auth/register` - Unauthenticated
- `POST /api/auth/login` - Unauthenticated
- `POST /api/wallet/web3auth/login` - Unauthenticated
- All `GET` endpoints - Read-only operations

## Frontend Integration

### 1. Initial CSRF Token Request

After user login, request the CSRF token:

```javascript
async function getCsrfToken() {
  const response = await fetch('/api/csrf-token', {
    credentials: 'include', // Include cookies
  });
  const { csrfToken } = await response.json();
  return csrfToken;
}

// Usage after login
const loginResponse = await login(username, password);
const csrfToken = await getCsrfToken();
```

### 2. Include Token in Protected Requests

For all POST, PATCH, DELETE requests:

```javascript
async function makeProtectedRequest(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': getStoredCsrfToken(), // Include token
    },
    credentials: 'include', // Include cookies
    body: JSON.stringify(data),
  });
  return response.json();
}
```

### 3. React Example

```javascript
import React, { useState, useEffect } from 'react';

function useCsrfToken() {
  const [csrfToken, setCsrfToken] = useState(null);

  useEffect(() => {
    async function fetchCsrfToken() {
      const response = await fetch('/api/csrf-token', {
        credentials: 'include',
      });
      const { csrfToken } = await response.json();
      setCsrfToken(csrfToken);
    }
    fetchCsrfToken();
  }, []);

  return csrfToken;
}

function ConsentForm() {
  const csrfToken = useCsrfToken();
  const [formData, setFormData] = useState({ consentType: '' });

  async function handleSubmit(e) {
    e.preventDefault();
    await fetch('/api/consent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify(formData),
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### 4. Axios Interceptor Example

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Request interceptor to add CSRF token
apiClient.interceptors.request.use((config) => {
  if (['post', 'patch', 'delete'].includes(config.method)) {
    const csrfToken = getStoredCsrfToken();
    if (csrfToken) {
      config.headers['x-csrf-token'] = csrfToken;
    }
  }
  return config;
});

// Function to fetch and store CSRF token
async function initializeCsrfToken() {
  const response = await apiClient.get('/csrf-token');
  storeCsrfToken(response.data.csrfToken);
}
```

## Error Handling

### Invalid CSRF Token
```
Status: 403 Forbidden
Response: { "error": "invalid csrf token" }
```

**Solution:** 
1. Request a new CSRF token from `/api/csrf-token`
2. Retry the failed request with the new token

### Missing CSRF Token
```
Status: 403 Forbidden
Response: { "error": "csrf token missing" }
```

**Solution:** Include the `x-csrf-token` header with the request

### Token Expiration
- CSRF tokens do not expire by default in synchronised token mode
- However, the token is tied to the user session
- If user session expires, both authentication and CSRF validation will fail
- Solution: Re-authenticate and fetch a new CSRF token

## Security Best Practices

1. **Always use HTTPS** in production to protect tokens in transit
2. **Store tokens securely** in frontend memory (not localStorage or sessionStorage)
3. **Validate tokens** on every state-changing request
4. **Rotate CSRF secrets** periodically via AWS Secrets Manager
5. **Monitor failed CSRF validations** as potential attack indicators
6. **Never expose CSRF tokens** in URL parameters or query strings

## Testing

### Test CSRF Protection

```bash
# 1. Login to get authentication token
TOKEN=$(curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.token')

# 2. Request CSRF token
CSRF=$(curl -X GET http://localhost:4000/api/csrf-token \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.csrfToken')

# 3. Make protected request with CSRF token
curl -X POST http://localhost:4000/api/consent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-csrf-token: $CSRF" \
  -d '{"consentType":"research"}'

# 4. Test without CSRF token (should fail with 403)
curl -X POST http://localhost:4000/api/consent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"consentType":"research"}'
```

## Configuration

### Environment Variables

```bash
# AWS Configuration (required for production)
AWS_REGION=us-east-1
CSRF_SECRET_NAME=healthmesh/csrf-secret
KMS_KEY_ID=arn:aws:kms:us-east-1:123456789012:key/abcd1234

# Fallback (development only)
CSRF_SECRET=development-csrf-secret-key
```

### AWS Secrets Manager

Create the secret:
```bash
aws secretsmanager create-secret \
  --name healthmesh/csrf-secret \
  --secret-string "random-128-bit-secret-here"
```

Encrypt with KMS:
```bash
aws kms encrypt \
  --key-id <KMS_KEY_ID> \
  --plaintext fileb://secret.txt \
  --output text \
  --query CiphertextBlob | base64 -d
```

## Troubleshooting

### Issue: "Failed to load CSRF secret from AWS"
**Solution:** Check AWS credentials and region configuration

### Issue: CSRF validation fails in development
**Solution:** Ensure `CSRF_SECRET` environment variable is set

### Issue: Token mismatch errors in multi-tab scenarios
**Solution:** Use synchronised token mode (current implementation) which allows multiple tabs

## References

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [csurf library documentation](https://github.com/express-session/csurf)
- [csrf-csrf documentation](https://github.com/Psifi-Solutions/csrf-csrf)
- [AWS Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)

## Changelog

- **2026-01-31**: Initial P0-04 CSRF protection implementation
  - Applied CSRF protection to all state-changing endpoints
  - Integrated with AWS Secrets Manager for secure secret storage
  - Added comprehensive frontend integration guide
  - Enhanced security headers for HIPAA/SOC 2 compliance
