

## Fix: Roleplay Chat "Unauthorized" Error

### Root Cause

Two issues:
1. `supabase.auth.getClaims(token)` does not exist in supabase-js v2. Must use `supabase.auth.getUser(token)`.
2. `supabase/config.toml` is missing `verify_jwt = false` for the roleplay-chat function, which is required on Lovable Cloud.

### Changes

**1. `supabase/config.toml`** — Add function config:
```toml
[functions.roleplay-chat]
verify_jwt = false

[functions.extract-playbook]
verify_jwt = false
```

**2. `supabase/functions/roleplay-chat/index.ts`** — Replace `getClaims` with `getUser`:
```typescript
// Replace:
const { data, error: claimsError } = await supabase.auth.getClaims(token);
if (claimsError || !data?.claims) throw new Error("Unauthorized");
const userId = data.claims.sub as string;

// With:
const { data: { user }, error: userError } = await supabase.auth.getUser(token);
if (userError || !user) throw new Error("Unauthorized");
const userId = user.id;
```

This is a 2-line fix that resolves the authentication failure.

