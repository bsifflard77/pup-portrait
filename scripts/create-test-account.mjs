#!/usr/bin/env node
/**
 * Create a Realism-tier test account on the live Pup Portrait Supabase project.
 *
 * - Provisions a confirmed-email user via the Auth Admin API.
 * - Promotes the matching profile row to `realism` tier so the user can:
 *     * skip the weekly free cap (uses daily cap instead)
 *     * upload photos for the 12-portrait pack flow
 *     * toggle the Flux Kontext Pro Realism engine (fal.ai)
 * - Prints the credentials at the end.
 *
 * Re-running with the same email is safe — it updates the password and re-
 * applies the realism tier.
 */

const SUPABASE_URL = 'https://rmalsvaoomhrgflioiqx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtYWxzdmFvb21ocmdmbGlvaXF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDk3MTIxNywiZXhwIjoyMDgwNTQ3MjE3fQ.5yVk9TVwglblw12Yc3c53gjE77FJvWK0mbwFGUGv29c';

const EMAIL = 'bill+test@monomoystrategies.com';
const PASSWORD = 'Tester' + Math.random().toString(36).slice(2, 8) + '!9';

const headers = {
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  'Content-Type': 'application/json',
};

async function getOrCreateUser() {
  const listRes = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?per_page=200`,
    { headers }
  );
  if (!listRes.ok) throw new Error('list users failed: ' + (await listRes.text()));
  const { users } = await listRes.json();
  const existing = users.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase());
  if (existing) {
    console.log('user exists; resetting password');
    const upd = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existing.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ password: PASSWORD, email_confirm: true }),
    });
    if (!upd.ok) throw new Error('update user failed: ' + (await upd.text()));
    return existing.id;
  }
  const create = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { name: 'Bill (Realism Test)' },
    }),
  });
  if (!create.ok) throw new Error('create user failed: ' + (await create.text()));
  const { id } = await create.json();
  console.log('user created:', id);
  return id;
}

async function promoteToRealism(userId) {
  const patchBody = {
    subscription_tier: 'realism',
    subscription_status: 'active',
    daily_generations_used: 0,
    weekly_generations_used: 0,
  };
  const patch = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify(patchBody),
    }
  );
  if (!patch.ok) throw new Error('promote profile failed: ' + (await patch.text()));
  const rows = await patch.json();
  if (!rows.length) {
    // Profile row doesn't exist yet — create it explicitly.
    const ins = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({ id: userId, email: EMAIL, ...patchBody }),
    });
    if (!ins.ok) throw new Error('insert profile failed: ' + (await ins.text()));
    console.log('profile inserted with realism tier');
  } else {
    console.log('profile updated to realism tier');
  }
}

(async () => {
  const userId = await getOrCreateUser();
  await promoteToRealism(userId);
  console.log('\n========== TEST ACCOUNT READY ==========');
  console.log('Email:    ' + EMAIL);
  console.log('Password: ' + PASSWORD);
  console.log('Tier:     realism (daily cap 15, Flux Kontext Pro toggle unlocked)');
  console.log('Sign in:  https://pup-portrait.vercel.app/login');
  console.log('========================================');
})().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
