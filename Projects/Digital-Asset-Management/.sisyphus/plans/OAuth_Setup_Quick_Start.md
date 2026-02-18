# OAuth Applications Setup - Quick Start Guide

This guide helps you set up all OAuth applications for Phase 1 testing.

## 📁 Files Created

1. **`api/.env`** - Backend environment variables (with OAuth placeholders)
2. **`frontend/.env.local`** - Frontend environment variables (with OAuth placeholders)
3. **`api/scripts/validate-oauth-config.js`** - OAuth configuration validator
4. **`api/scripts/oauth-setup-guide.md`** - Detailed OAuth setup instructions
5. **`api/scripts/oauth-setup-checklist.md`** - Progress tracking checklist

---

## 🚀 Quick Start

### Step 1: Set Up OAuth Applications (Manual)

You need to create OAuth applications on external developer portals:

#### Google OAuth (Free)
- Portal: [Google Cloud Console](https://console.cloud.google.com)
- Create OAuth 2.0 Client ID (Web application)
- Add callback: `http://localhost:3000/auth/google/callback`
- Save: Client ID and Client Secret

#### Facebook Login (Free)
- Portal: [Facebook for Developers](https://developers.facebook.com)
- Create new app (Consumer type)
- Add Facebook Login product
- Add callback: `http://localhost:3000/auth/facebook/callback`
- Save: App ID and App Secret

#### Apple Sign In (Requires Paid Account: $99/year)
- Portal: [Apple Developer](https://developer.apple.com)
- Create App ID with Sign in with Apple capability
- Create Services ID
- Create Private Key (download `.p8` file)
- Add callback: `http://localhost:3000/auth/apple/callback`
- Save: Services ID, Team ID, Key ID, and private key path
- **Note**: Apple requires HTTPS - use ngrok for local development

#### Web3Auth (Free)
- Portal: [Web3Auth Dashboard](https://dashboard.web3auth.io)
- Create new project
- Configure for Testnet, Polygon blockchain
- Add `http://localhost:3001` to whitelist domains
- Save: Client ID

### Step 2: Update Environment Variables

Update **`api/.env`** with your credentials:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Facebook OAuth
FACEBOOK_CLIENT_ID=your-actual-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-actual-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3000/auth/facebook/callback

# Apple OAuth
APPLE_CLIENT_ID=com.yourcompany.signin
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_KEY_ID=YOUR_KEY_ID
APPLE_PRIVATE_KEY_PATH=/full/path/to/AuthKey.p8
APPLE_CALLBACK_URL=http://localhost:3000/auth/apple/callback

# Web3Auth
WEB3AUTH_CLIENT_ID=your-actual-web3auth-client-id
WEB3AUTH_NETWORK=testnet
```

Update **`frontend/.env.local`** with your Web3Auth Client ID:

```bash
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your-actual-web3auth-client-id
```

### Step 3: Validate Configuration

Run the validation script to check your setup:

```bash
cd api
npm run validate:oauth
```

Or run directly:

```bash
cd api
node scripts/validate-oauth-config.js
```

The validator will:
- Check all required variables are present
- Validate no placeholder values remain
- Verify callback URLs are correct
- Check Apple private key file exists

### Step 4: Test OAuth Flows

Once validation passes:

1. **Start the backend server:**
   ```bash
   cd api
   npm run start:dev
   ```

2. **Start the frontend server (new terminal):**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Visit the auth page:**
   ```
   http://localhost:3001/auth
   ```

4. **Test each provider:**
   - Email/password registration
   - Email/password login
   - Google OAuth login
   - Facebook OAuth login
   - Apple OAuth login (requires ngrok)

### Step 5: Verify Database

Check that users and wallets are being created:

```bash
# Connect to your database
psql postgresql://user:password@localhost:5432/digital_asset_management

# Check users table
SELECT * FROM "user" ORDER BY created_at DESC LIMIT 10;

# Check for wallet addresses
SELECT id, email, wallet_address FROM "user" WHERE wallet_address IS NOT NULL;
```

---

## 📚 Detailed Documentation

For detailed step-by-step instructions, refer to:
- **`api/scripts/oauth-setup-guide.md`** - Complete OAuth setup guide
- **`api/scripts/oauth-setup-checklist.md`** - Progress tracking checklist

---

## 🔧 Troubleshooting

### Google OAuth Errors

**Error**: `redirect_uri_mismatch`
- **Solution**: Ensure callback URL in Google Cloud Console exactly matches `http://localhost:3000/auth/google/callback`

### Facebook OAuth Errors

**Error**: `redirect_uri_mismatch`
- **Solution**: Add `http://localhost:3000/auth/facebook/callback` to Valid OAuth Redirect URIs

### Apple OAuth Errors

**Error**: `invalid_client`
- **Solution**: Check Client ID, Team ID, Key ID, and private key path in `.env`

**Error**: `HTTPS required`
- **Solution**: Apple requires HTTPS. Use ngrok:
  ```bash
  brew install ngrok
  ngrok http 3000
  # Update APPLE_CALLBACK_URL in .env to ngrok URL
  ```

### Web3Auth Errors

**Error**: `Initialization failed`
- **Solution**: Ensure Client ID is correct in both `.env` files and WEB3AUTH_NETWORK is `testnet`

---

## ⚠️ Important Notes

1. **Never commit** `.env` files to version control
2. **Keep secrets secure** - treat OAuth secrets like passwords
3. **Apple requires HTTPS** for Sign in with Apple callbacks
4. **Web3Auth needs same Client ID** in both backend and frontend
5. **Facebook may require** app verification for production
6. **Use ngrok** for Apple OAuth in development

---

## ✅ Success Criteria

You'll know OAuth setup is complete when:

- ✅ `npm run validate:oauth` passes with all green checks
- ✅ You can successfully sign up with email/password
- ✅ You can successfully log in with Google
- ✅ You can successfully log in with Facebook
- ✅ You can successfully log in with Apple (via ngrok)
- ✅ Users are being created in the database
- ✅ Wallets are being created automatically
- ✅ Audit logs are being recorded

---

## 🎯 Next Steps

Once OAuth setup is complete and tested:

1. **Proceed to Phase 2**: Enhanced UX + Custodial Operations
   - Smart onboarding with social data pre-fill
   - Wallet management UI
   - Transaction abstraction improvements
   - AI-powered asset intelligence

2. **Or proceed to Phase 3**: Deployment, Testing & Production Readiness
   - Deploy smart contracts to Polygon testnet
   - Set up production infrastructure
   - Implement CI/CD pipelines
   - Comprehensive testing

---

## 📞 Need Help?

- **Check logs**: Browser console and backend logs for errors
- **Run validation**: `npm run validate:oauth` to check configuration
- **Review guides**: See `api/scripts/oauth-setup-guide.md` for troubleshooting
- **Check callbacks**: Ensure all callback URLs match exactly what's configured in provider portals

