/**
 * Live Supabase production readiness checks (read-only).
 * Loads ../.env via dotenv — never prints secret values.
 */
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)))
dotenv.config({ path: resolve(rootDir, '.env') })
dotenv.config({ path: resolve(rootDir, '.env.local') })

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const dbUrl =
  process.env.SUPABASE_DB_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DATABASE_URL

/** Minimal column probe per table (PostgREST needs real column names). */
const tableProbes = [
  ['profiles', 'id'],
  ['organizations', 'id'],
  ['customers', 'id'],
  ['employees', 'id'],
  ['jobs', 'id'],
  ['job_assignees', 'job_id'],
  ['job_tasks', 'id'],
  ['job_checklist_items', 'id'],
  ['task_photos', 'id'],
  ['employee_day_schedules', 'id'],
  ['employee_invites', 'id'],
]

function out(section, ok, detail = '') {
  const s = ok ? 'PASS' : 'FAIL'
  console.log(`[${section}] ${s}${detail ? `: ${detail}` : ''}`)
  return ok
}

async function main() {
  let tablesOk = true
  let rlsOk = true
  let storageOk = true
  let photoE2EOk = true
  let inviteRpcOk = false
  let inviteRpcSkipped = true

  if (!url) {
    console.log('[ENV] FAIL: Missing SUPABASE_URL or VITE_SUPABASE_URL')
    process.exit(1)
  }
  if (!serviceKey) {
    console.log('[ENV] FAIL: Missing SUPABASE_SERVICE_ROLE_KEY (needed for structural checks)')
    process.exit(1)
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const failures = []

  for (const [table, col] of tableProbes) {
    const { error } = await admin.from(table).select(col).limit(1)
    if (error) {
      failures.push(`${table}: ${error.message} (${error.code ?? 'no code'})`)
      tablesOk = false
    }
  }

  /** Invite-tracking columns from migrations */
  const inviteCols =
    'id,email_sent_at,email_send_error,sms_sent_at,sms_send_error'.split(',')
  const { error: inviteMetaErr } = await admin
    .from('employee_invites')
    .select(inviteCols.join(','))
    .limit(1)
  if (inviteMetaErr && inviteMetaErr.message?.includes('column')) {
    failures.push(`employee_invites tracking columns: ${inviteMetaErr.message}`)
    tablesOk = false
  }

  out('Tables', tablesOk, failures.join(' | ') || 'all probed tables readable')

  /** ---------- Postgres: RLS + storage policies ---------- */
  if (!dbUrl) {
    out(
      'RLS',
      false,
      'No database connection string (set SUPABASE_DB_URL or DATABASE_URL from Supabase Settings → Database) — cannot verify RLS flags in pg_catalog.',
    )
    rlsOk = false
    out(
      'Storage',
      false,
      'Same: need DB URL to read storage.objects policies, or verify in Dashboard.',
    )
    storageOk = false
  } else {
    const sql = postgres(dbUrl, { ssl: 'require', max: 1, connect_timeout: 15 })
    try {
      const rlsRows = await sql`
        SELECT c.relname AS name, c.relrowsecurity AS rls_on
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND c.relname = ANY(${tableProbes.map((t) => t[0])})
      `
      const byName = Object.fromEntries(rlsRows.map((r) => [r.name, r.rls_on]))
      const missingRls = tableProbes
        .map(([t]) => t)
        .filter((t) => byName[t] !== true)
      rlsOk = missingRls.length === 0
      out(
        'RLS',
        rlsOk,
        rlsOk
          ? 'row security ON for all listed public business tables'
          : `missing or RLS OFF: ${missingRls.join(', ')}`,
      )

      const { count: storagePolicyCount } = await sql`
        SELECT COUNT(*)::int AS count
        FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
      `
      const { data: buckets, error: be } = await admin.storage.listBuckets()
      const hasJobPhotos = !be && buckets?.some((b) => b.id === 'job-photos')
      storageOk = hasJobPhotos && storagePolicyCount > 0
      out(
        'Storage',
        storageOk,
        [
          hasJobPhotos ? 'bucket job-photos exists' : 'bucket job-photos missing',
          `storage.objects policies: ${storagePolicyCount}`,
        ].join('; '),
      )

      /** Read policy names (no secrets) — expect job-photo scoped policies from SQL file */
      const pol = await sql`
        SELECT policyname, cmd
        FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
        ORDER BY policyname
      `
      const names = pol.map((p) => p.policyname).join(', ')
      console.log(`[Storage policies] ${names || '(none)'}`)

      /** Data isolation sanity: policies reference auth — heuristic only */
      const qualSample = await sql`
        SELECT COALESCE(MAX(LENGTH(qual::text)), 0) AS q FROM pg_policies
        WHERE schemaname = 'public' AND tablename IN ('jobs','customers','task_photos')
      `
      const hasQualifiers = Number(qualSample[0]?.q) > 0
      out(
        'RLS-org-scope-heuristic',
        hasQualifiers,
        hasQualifiers
          ? 'public policies have qualifiers (review manually)'
          : 'no USING clauses found on sampled tables — suspicious',
      )

      /** Invite RPC exists */
      const rpcCheck = await sql`
        SELECT EXISTS (
          SELECT 1 FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = 'public' AND p.proname = 'accept_employee_invite'
        ) AS ok
      `
      inviteRpcSkipped = false
      inviteRpcOk = rpcCheck[0]?.ok === true
      out(
        'Invite-RPC',
        inviteRpcOk,
        inviteRpcOk ? 'accept_employee_invite present' : 'missing accept_employee_invite',
      )
    } catch (e) {
      rlsOk = false
      storageOk = false
      out('RLS', false, e instanceof Error ? e.message : String(e))
      out('Storage', false, 'postgres query failed')
    } finally {
      await sql.end({ timeout: 5 }).catch(() => {})
    }
  }

  /** ---------- Anon without session: should not bulk-read org data ---------- */
  if (anonKey) {
    const anon = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: anonCustomers, error: anonErr } = await anon.from('customers').select('id').limit(5)
    const anonBlocked =
      anonErr ||
      !anonCustomers ||
      anonCustomers.length === 0 ||
      anonErr?.message?.includes('JWT')
    out(
      'RLS-anon-sample',
      Boolean(anonBlocked),
      anonErr
        ? `anon query error (good if permission/JWT): ${anonErr.code ?? anonErr.message}`
        : anonCustomers?.length === 0
          ? 'anon returned 0 rows (typical with RLS)'
          : 'WARNING: anon returned rows without JWT — investigate',
    )
  } else {
    console.log('[RLS-anon-sample] SKIP: VITE_SUPABASE_ANON_KEY not in env')
  }

  /** ---------- Photo path: list empty prefix (non-destructive) ---------- */
  const { error: listErr } = await admin.storage.from('job-photos').list('', { limit: 1 })
  out('Storage-list', !listErr, listErr ? listErr.message : 'list prefix ok')

  /** E2E upload: skip destructive write to production by default */
  const allowWrite = process.env.VERIFY_ALLOW_PROD_WRITE === '1'
  if (allowWrite) {
    const testPath = `_verify_${Date.now()}.txt`
    const { error: upErr } = await admin.storage
      .from('job-photos')
      .upload(testPath, new Uint8Array([80]), { contentType: 'text/plain', upsert: true })
    if (upErr) {
      photoE2EOk = false
      out('Photo-upload', false, upErr.message)
    } else {
      await admin.storage.from('job-photos').remove([testPath])
      out('Photo-upload', true, 'temporary object written and removed (service role)')
    }
  } else {
    console.log(
      '[Photo E2E] SKIP: Set VERIFY_ALLOW_PROD_WRITE=1 for a test upload/delete (uses service role; not a substitute for crew JWT testing).',
    )
  }

  /** Summary */
  console.log('')
  console.log('--- Summary (no secrets printed) ---')
  console.log(`Tables: ${tablesOk ? 'PASS' : 'FAIL'}`)
  console.log(`RLS: ${rlsOk ? 'PASS' : 'FAIL'}`)
  console.log(`Storage: ${storageOk ? 'PASS' : 'FAIL'}`)
  console.log(`Photo E2E (automated): ${allowWrite ? (photoE2EOk ? 'PASS' : 'FAIL') : 'SKIPPED'}`)
  console.log(
    `Invite RPC: ${inviteRpcSkipped ? 'SKIP (no DB URL)' : inviteRpcOk ? 'PASS' : 'FAIL'}`,
  )
  console.log('')
  console.log(
    'Employee vs org isolation (#3, #8): requires manual tests with two JWTs or SQL as test users — not fully automatable here.',
  )

  process.exit(tablesOk && rlsOk && storageOk ? 0 : 1)
}

main().catch((e) => {
  console.error('[FATAL]', e instanceof Error ? e.message : e)
  process.exit(1)
})
