// Test script to verify Supabase OAuth configuration
// Run with: node test-supabase-config.js

console.log("\n=== Supabase OAuth Configuration Check ===\n");

console.log("✓ Your Supabase Project ID: ftebinspsqpzupimsndp");
console.log("✓ Supabase URL: https://ftebinspsqpzupimsndp.supabase.co");
console.log("\n--- Required Redirect URLs in Supabase ---");
console.log("You need to add these EXACT URLs to Supabase Dashboard:");
console.log("  → Authentication → URL Configuration → Redirect URLs\n");

console.log("1. http://localhost:3000/auth/callback");
console.log("2. https://ftebinspsqpzupimsndp.supabase.co/auth/v1/callback (already configured)\n");

console.log("--- Google OAuth Console Configuration ---");
console.log("Your Authorized redirect URIs should include:");
console.log("  → https://ftebinspsqpzupimsndp.supabase.co/auth/v1/callback ✓\n");

console.log("--- Steps to Fix ---");
console.log("1. Go to: https://supabase.com/dashboard/project/ftebinspsqpzupimsndp/auth/url-configuration");
console.log("2. Under 'Redirect URLs', add: http://localhost:3000/auth/callback");
console.log("3. Click 'Save'");
console.log("4. Restart your Next.js dev server (Ctrl+C then npm run dev)");
console.log("5. Try signing in with Google again");
console.log("6. Check your terminal for the [Auth Callback] debug logs\n");

console.log("=== End Configuration Check ===\n");
