# Deploy Google OAuth to Production

Now that Google OAuth is working on localhost, follow these steps to deploy to production.

## Step 1: Update Supabase Redirect URLs

1. Go to: https://supabase.com/dashboard/project/ftebinspsqpzupimsndp/auth/url-configuration
2. Under **"Redirect URLs"**, you should currently have:
   ```
   http://localhost:3000/auth/callback
   ```
3. Add your production URL (find it in Vercel dashboard):
   ```
   https://your-domain.vercel.app/auth/callback
   ```
   Or if you have a custom domain:
   ```
   https://caseready.com/auth/callback
   ```
4. Keep the localhost URL for local development
5. Click **Save**

## Step 2: Update Google OAuth Authorized Redirect URIs

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID: `6373617174-t28i0vpstlt7puh6uqago1k9mfoe04q4`
3. Click the pencil icon to edit
4. Under **"Authorized redirect URIs"**, you should already have:
   ```
   https://ftebinspsqpzupimsndp.supabase.co/auth/v1/callback
   ```
5. **DO NOT add your production domain here** - Google OAuth goes through Supabase
6. Click **Save**

## Step 3: Verify Environment Variables in Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Find your project (probably named "caseready" or similar)
3. Go to **Settings** → **Environment Variables**
4. Verify these variables are set:
   ```
   NEXT_PUBLIC_SITE_URL = https://your-production-domain.com
   NEXT_PUBLIC_SUPABASE_URL = https://ftebinspsqpzupimsndp.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = (your anon key from .env.local)
   STRIPE_SECRET_KEY = (your Stripe key from .env.local)
   ```
5. **IMPORTANT**: Update `NEXT_PUBLIC_SITE_URL` to your production URL (not localhost)

## Step 4: Commit and Deploy

Run these commands in your terminal:

```bash
# Check what files changed
git status

# Add all changes
git add .

# Commit with a message
git commit -m "Fix Google OAuth authentication"

# Push to GitHub
git push origin stripe-and-old-ui
```

Vercel will automatically deploy when you push to GitHub.

## Step 5: Test Production

1. Wait for Vercel deployment to complete (check Vercel dashboard)
2. Visit your production URL
3. Click "Continue with Google"
4. Sign in with Google
5. You should be redirected to the dashboard

## Troubleshooting Production Issues

If OAuth doesn't work in production:

1. **Check Vercel logs**: In Vercel dashboard → Deployments → Click on latest → View Function Logs
2. **Verify Supabase redirect URLs**: Make sure your production domain is added
3. **Check environment variables**: Make sure `NEXT_PUBLIC_SITE_URL` is your production URL
4. **Clear browser cache**: Use incognito mode to test

## What We Fixed

- ✅ Removed deprecated `@supabase/auth-helpers-nextjs` package
- ✅ Updated to modern `@supabase/ssr` package
- ✅ Fixed OAuth callback handling
- ✅ Added proper cookie management
- ✅ Fixed session persistence
- ✅ Added debug logging

All these fixes are in your code and will deploy automatically!
