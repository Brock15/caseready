# OAuth Debug Guide

## Current Error Analysis

The error you're seeing:
```
Unable to exchange external code: 4/0ATX87lOTcbKOWYCaPAl8fKHPKcHLWGYLD-OdhHImZ_VoUW23oRHCB74Fz5xdZfAA2xafeQ
```

This means:
1. ✅ Google OAuth consent screen worked
2. ✅ Google redirected to Supabase callback
3. ❌ Supabase **FAILED** to exchange the code for a session
4. ❌ Supabase redirected to your app with an error

## Root Cause

The code exchange is failing on Supabase's servers. This is usually caused by:

### Issue 1: Client Secret Mismatch
The Google Client Secret in Supabase doesn't match what's in Google Cloud Console.

**Fix:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID: `6373617174-t28i0vpstlt7puh6uqago1k9mfoe04q4`
3. Click "RESET SECRET" to generate a new secret
4. Copy the NEW secret
5. Go to: https://supabase.com/dashboard/project/ftebinspsqpzupimsndp/auth/providers
6. Click Google provider
7. Paste the NEW Client Secret
8. Save

### Issue 2: Redirect URI Mismatch in Google Console
Google OAuth requires EXACT redirect URI match.

**Fix:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Edit your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", make sure you have EXACTLY:
   ```
   https://ftebinspsqpzupimsndp.supabase.co/auth/v1/callback
   ```
4. Remove any other localhost URLs from this list
5. Save

### Issue 3: OAuth Consent Screen Configuration
Make sure your OAuth consent screen is properly configured.

**Fix:**
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Make sure you have:
   - User type: External (or Internal if G Suite)
   - Scopes: email, profile, openid
   - Test users added (if app is in Testing mode)
3. If in Testing mode, make sure YOUR email is added as a test user

## Testing Steps

After making the fixes above:

1. **Clear your browser cookies** (or use Incognito mode)
2. Restart your Next.js dev server:
   ```bash
   # Press Ctrl+C to stop the server
   npm run dev
   ```
3. Go to: http://localhost:3000/signin
4. Click "Continue with Google"
5. Check your terminal for the `[Auth Callback]` debug logs
6. If you see an error, copy the FULL error message and check it

## Expected Flow

When working correctly, you should see:
```
[Auth Callback] Request URL: http://localhost:3000/auth/callback?code=...&state=...
[Auth Callback] Code: present
[Auth Callback] Error: null
[Auth Callback] Attempting to exchange code for session...
[Auth Callback] Session exchanged successfully: your@email.com
[Auth Callback] Redirecting to: http://localhost:3000/dashboard
```

## Still Not Working?

If it's still failing, the issue might be:
1. Your Google Cloud project isn't published (stuck in Testing mode with no test users)
2. The OAuth consent screen is missing required scopes
3. You're trying to sign in with an email that's not a test user

Check your Google Cloud Console OAuth consent screen settings!
