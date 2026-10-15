/**
 * Security tests for the Supabase migrations: company data separation, role
 * enforcement, privilege-escalation guards, reorders, invitations, artwork
 * storage/approval, server-priced orders and notifications.
 *
 * Runs every migration against an in-memory Postgres (PGlite) with a minimal
 * stand-in for Supabase's auth schema, then exercises RLS as different users.
 *   npm run test:db
 */
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const MIG = fileURLToPath(new URL('../migrations', import.meta.url));
const db = new PGlite();
process.on('unhandledRejection', (e) => { console.log('FATAL', e.message); process.exit(1); });
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { if (cond) pass++; else fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); };

// ── Supabase stubs ──
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  -- Supabase ships uuid-ossp in the "extensions" schema; PGlite doesn't, so stub it there.
  -- Like Supabase, it's on the session search_path but NOT visible inside functions that
  -- pin "set search_path = public" — calling it from one of those must fail here too.
  create schema extensions;
  create function extensions.uuid_generate_v4() returns uuid language sql as $$ select gen_random_uuid() $$;
  set search_path = public, extensions;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claim.role', true), '') $$;
  create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  -- Minimal stand-in for Supabase Storage
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable
    as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  grant usage on schema storage to anon, authenticated, service_role;
  grant all on storage.objects, storage.buckets to anon, authenticated, service_role;
`);

async function apply(f) {
  try { await db.exec(readFileSync(`${MIG}/${f}`, 'utf8').replace(/create extension[^;]*;/i, '')); ok(`apply ${f}`, true); }
  catch (e) { ok(`apply ${f}`, false, e.message); }
}

for (const f of ['000_base_companies_profiles.sql', '001_add_orders_and_staff.sql', '002_safe_update.sql', '003_security_and_reorders.sql', '003_security_and_reorders.sql']) {
  await apply(f);
}

const U = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const [A1, A2, B1, S] = [U(1), U(2), U(3), U(4)];

async function signup(id, email, meta) {
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`, [id, email, meta]);
}
// Sessions are two-factor (aal2) unless a test sets AAL = 'aal1' — staff powers need aal2 (migration 009)
let AAL = 'aal2';
async function as(uid, sql, params = []) {
  await db.exec('reset role');
  await db.query(`select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claim.role', 'authenticated', false), set_config('request.jwt.claims', $2, false)`,
    [uid, JSON.stringify({ sub: uid, role: 'authenticated', aal: AAL })]);
  await db.exec('set role authenticated');
  try { return await db.query(sql, params); }
  finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claim.role', '', false), set_config('request.jwt.claims', '', false)`); }
}
async function asErr(uid, sql, params = []) {
  try { const r = await as(uid, sql, params); return { rows: r.rows, affected: r.affectedRows }; } catch (e) { return { err: e.message }; }
}
const su = (sql, p = []) => db.query(sql, p);

// ── Signup ──
await signup(A1, 'a1@acme.test', { company_name: 'Acme', first_name: 'Ann', role: 'Viewer' });
await signup(B1, 'b1@bright.test', { company_name: 'BrightBox', first_name: 'Bob', is_staff: true });
await signup(S,  'staff@gss.test', { company_name: 'GSS Internal' });
await signup(A2, 'a2@acme.test', { company_name: 'Throwaway' });

const pA1 = (await su(`select p.*, c.status cstatus from profiles p join companies c on c.id = p.company_id where p.id = $1`, [A1])).rows[0];
ok('signup creates profile as Admin of new company', pA1?.role === 'Admin' && pA1.cstatus === 'Pending' && pA1.is_staff === false);
ok('signup ignores metadata is_staff', (await su(`select is_staff from profiles where id=$1`, [B1])).rows[0].is_staff === false);
ok('profile email populated', pA1?.email === 'a1@acme.test');

const compA = pA1.company_id;
const compB = (await su(`select company_id from profiles where id=$1`, [B1])).rows[0].company_id;
// A2 joins Acme as Viewer (what an invite will do), S is staff
await su(`update profiles set company_id=$1, role='Viewer' where id=$2`, [compA, A2]);
await su(`update profiles set is_staff=true where id=$1`, [S]);

// ── Ordering gated on active company + role ──
const insOrder = (uid, comp) => asErr(uid, `insert into orders (company_id, created_by, ref, status, total) values ($1, $2, 'ORD-T', 'Pending Approval', 100) returning id`, [comp, uid]);
ok('pending company cannot order', !!(await insOrder(A1, compA)).err);
await su(`update companies set status='Active' where id in ($1, $2)`, [compA, compB]);
const o1 = await insOrder(A1, compA);
ok('active company Admin can order', !o1.err, o1.err);
const orderA = o1.rows?.[0]?.id;
ok('cannot order for another company', !!(await insOrder(A1, compB)).err);
ok('Viewer cannot order', !!(await insOrder(A2, compA)).err);
ok('cannot insert order as Delivered', !!(await asErr(A1, `insert into orders (company_id, created_by, ref, status, total) values ($1,$2,'X','Delivered',1)`, [compA, A1])).err);

await su(`insert into order_items (order_id, sku_id, product_name, quantity, unit_price, line_total) values ($1,'SKU-1','Box',1000,1.50,1500),($1,'SKU-2','Label',500,0.20,100)`, [orderA]);

// ── Separation ──
ok('B cannot see A orders', (await as(B1, `select * from orders`)).rows.length === 0);
ok('B cannot see A order items', (await as(B1, `select * from order_items`)).rows.length === 0);
ok('B cannot see A company', (await as(B1, `select * from companies where id=$1`, [compA])).rows.length === 0);
ok('B cannot see A profiles', (await as(B1, `select * from profiles where company_id=$1`, [compA])).rows.length === 0);
ok('A sees own team', (await as(A1, `select * from profiles where company_id=$1`, [compA])).rows.length === 2);
ok('staff sees all orders', (await as(S, `select * from orders`)).rows.length === 1);
ok('customer cannot change order status', (await asErr(A1, `update orders set status='Delivered' where id=$1`, [orderA])).affected === 0);
ok('customer cannot edit company credit', (await asErr(A1, `update companies set credit_limit=999999 where id=$1`, [compA])).affected === 0);

// ── Profile privilege escalation ──
ok('cannot self-grant staff', !!(await asErr(A2, `update profiles set is_staff=true where id=$1`, [A2])).err);
ok('cannot self-promote role', !!(await asErr(A2, `update profiles set role='Admin' where id=$1`, [A2])).err);
ok('cannot move self to other company', !!(await asErr(A1, `update profiles set company_id=$1 where id=$2`, [compB, A1])).err);
ok('can edit own name', !(await asErr(A2, `update profiles set first_name='Al' where id=$1`, [A2])).err);
const prom = await asErr(A1, `update profiles set role='Procurement Manager' where id=$1`, [A2]);
ok('company Admin can change team role', !prom.err && prom.affected === 1, prom.err);
ok('admin cannot change own role', !!(await asErr(A1, `update profiles set role='Viewer' where id=$1`, [A1])).err);
ok('other company admin cannot touch A users', (await asErr(B1, `update profiles set role='Viewer' where id=$1`, [A2])).affected === 0);
ok('cannot insert profiles directly', !!(await asErr(A1, `insert into profiles (id, role, is_staff) values ($1,'Admin',true)`, [U(9)])).err);

// ── Reorders ──
const items = (await su(`select id, sku_id from order_items where order_id=$1 order by sku_id`, [orderA])).rows;
const qty = { [items[0].id]: 2000, [items[1].id]: 0 };
const rr = await asErr(A1, `select * from create_reorder_request($1, $2, 'PO-1', 'rush')`, [orderA, qty]);
ok('customer creates reorder request', !rr.err, rr.err);
const req = rr.rows?.[0];
ok('reorder priced server-side (2000 × 1.50 = 3000, zero-qty line dropped)', Number(req?.total) === 3000 && req?.items.length === 1, JSON.stringify(req?.total));
ok('reorder ref format', /^RRQ-\d{4}-\d{4}$/.test(req?.ref ?? ''), req?.ref);
ok('B cannot reorder A order', !!(await asErr(B1, `select create_reorder_request($1, $2)`, [orderA, qty])).err);
ok('B cannot see A reorder', (await as(B1, `select * from reorder_requests`)).rows.length === 0);
ok('direct insert into reorder_requests blocked', !!(await asErr(A1, `insert into reorder_requests (ref, company_id, source_order_id, requested_by, items, total) values ('X',$1,$2,$3,'[]',0.01)`, [compA, orderA, A1])).err);
ok('customer cannot update reorder status', (await asErr(A1, `update reorder_requests set status='Approved'`)).affected === 0);
ok('customer cannot approve', !!(await asErr(A1, `select approve_reorder_request($1)`, [req.id])).err);
ok('empty reorder rejected', !!(await asErr(A1, `select create_reorder_request($1, '{}'::jsonb)`, [orderA])).err);

const ap = await asErr(S, `select approve_reorder_request($1) as id`, [req.id]);
ok('staff approves reorder', !ap.err, ap.err);
const newOrder = ap.rows?.[0]?.id;
const no = (await as(A1, `select o.*, (select sum(line_total) from order_items where order_id=o.id) lt, (select count(*) from order_items where order_id=o.id)::int n from orders o where id=$1`, [newOrder])).rows[0];
ok('approval creates order visible to customer', no && no.status === 'In Production' && Number(no.lt) === 3000 && no.n === 1);
ok('cannot approve twice', !!(await asErr(S, `select approve_reorder_request($1)`, [req.id])).err);

const rr2 = (await as(A1, `select * from create_reorder_request($1, $2)`, [orderA, qty])).rows[0];
ok('Viewer-turned-PM can cancel? (not requester, not admin) → denied', !!(await asErr(A2, `select close_reorder_request($1,'Cancelled')`, [rr2.id])).err);
ok('customer cannot reject', !!(await asErr(A1, `select close_reorder_request($1,'Rejected')`, [rr2.id])).err);
ok('requester can cancel', !(await asErr(A1, `select close_reorder_request($1,'Cancelled')`, [rr2.id])).err);
const rr3 = (await as(A1, `select * from create_reorder_request($1, $2)`, [orderA, qty])).rows[0];
ok('staff rejects with reason', !(await asErr(S, `select close_reorder_request($1,'Rejected','Out of stock')`, [rr3.id])).err);

// Suspended company / inactive user
await su(`update companies set status='Suspended' where id=$1`, [compA]);
ok('suspended company cannot reorder', !!(await asErr(A1, `select create_reorder_request($1, $2)`, [orderA, qty])).err);

// ════════════════════════════════════════════════════════════════════════════
// Migration 004
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 004 ──');
await su(`update companies set status='Active' where id=$1`, [compA]);
await apply('004_team_artwork_catalog_notifications.sql');
await apply('004_team_artwork_catalog_notifications.sql');

// ── Server-priced cart orders ──
ok('customer can no longer insert orders directly', !!(await insOrder(A1, compA)).err);
await su(`insert into artwork_files (company_id, name, plate_ref, version, status) values ($1,'Box','PLT-1','v1','Approved'),($1,'Label','PLT-2','v1','Pending Review')`, [compA]);
await su(`update order_items set plate_ref='PLT-1' where sku_id='SKU-1'`);
await su(`update order_items set plate_ref='PLT-2' where sku_id='SKU-2'`);
const cat = await as(A1, `select * from get_catalog()`);
ok('catalog lists company artwork with last price', cat.rows.length === 2 && Number(cat.rows.find((r) => r.plate_ref === 'PLT-1')?.unit_price) === 1.5);
ok('other company catalog empty', (await as(B1, `select * from get_catalog()`)).rows.length === 0);
const po = await asErr(A1, `select * from place_order($1::jsonb, 'PO-9', null)`, [JSON.stringify([{ plate_ref: 'PLT-1', quantity: 3000, unit_price: 0.01 }])]);
ok('place_order prices from DB (3000 × 1.50), ignores client price', !po.err && Number(po.rows?.[0]?.total) === 4500, po.err ?? po.rows?.[0]?.total);
ok('place_order rejects unapproved artwork', !!(await asErr(A1, `select place_order($1::jsonb)`, [JSON.stringify([{ plate_ref: 'PLT-2', quantity: 10 }])])).err);
ok('place_order rejects unknown plate', !!(await asErr(A1, `select place_order($1::jsonb)`, [JSON.stringify([{ plate_ref: 'NOPE', quantity: 10 }])])).err);
await su(`update profiles set role='Viewer' where id=$1`, [A2]);
ok('place_order rejects Viewer', !!(await asErr(A2, `select place_order($1::jsonb)`, [JSON.stringify([{ plate_ref: 'PLT-1', quantity: 1 }])])).err);
await su(`update profiles set role='Procurement Manager' where id=$1`, [A2]);

// ── Notifications ──
const notifs = async (uid) => (await as(uid, `select type, title from notifications order by created_at`)).rows;
ok('staff notified of new cart order', (await notifs(S)).some((n) => n.type === 'order' && n.title.startsWith('New order')));
await asErr(S, `update orders set status='Dispatched' where id=$1`, [po.rows[0].id]);
ok('company users notified of status change', (await notifs(A1)).some((n) => n.title.includes('Dispatched')) && (await notifs(A2)).some((n) => n.title.includes('Dispatched')));
ok('other company not notified', (await notifs(B1)).every((n) => !n.title.includes('Dispatched')));
const rq = (await as(A1, `select * from create_reorder_request($1, $2)`, [orderA, qty])).rows[0];
ok('staff notified of reorder request', (await notifs(S)).some((n) => n.title === 'Reorder request ' + rq.ref));
await as(S, `select approve_reorder_request($1)`, [rq.id]);
ok('requester notified of approval', (await notifs(A1)).some((n) => n.title === `Reorder ${rq.ref} approved`));
ok('cannot insert notifications directly', !!(await asErr(A1, `insert into notifications (user_id, type, title) values ($1,'x','spoof')`, [B1])).err);
ok('cannot read others notifications', (await as(B1, `select * from notifications where user_id=$1`, [A1])).rows.length === 0);
ok('can mark own notification read', (await asErr(A1, `update notifications set read_at=now() where user_id=$1`, [A1])).affected > 0);

// ── Artwork proofs ──
const art = (await su(`insert into artwork_files (company_id, name, plate_ref, version, status) values ($1,'Box v2','PLT-1','v2','Pending Review') returning id`, [compA])).rows[0].id;
ok('approvers notified of new proof', (await notifs(A2)).some((n) => n.title === 'Proof ready for review'));
ok('B cannot review A artwork', !!(await asErr(B1, `select review_artwork($1,'Approved')`, [art])).err);
ok('revision request needs a comment', !!(await asErr(A2, `select review_artwork($1,'Revision Required','')`, [art])).err);
const rv = await asErr(A2, `select review_artwork($1,'Approved')`, [art]);
ok('Procurement Manager approves proof', !rv.err, rv.err);
const plt1 = (await su(`select version, status from artwork_files where plate_ref='PLT-1' order by version`)).rows;
ok('approval supersedes previous version', plt1[0].status === 'Superseded' && plt1[1].status === 'Approved');
ok('staff notified of approval', (await notifs(S)).some((n) => n.title === 'Proof approved'));
ok('cannot re-review decided proof', !!(await asErr(A2, `select review_artwork($1,'Revision Required','x')`, [art])).err);
ok('customer cannot edit artwork directly', (await asErr(A1, `update artwork_files set status='Approved'`)).affected === 0);

// ── Storage ──
await su(`insert into storage.objects (bucket_id, name) values ('artwork', $1), ('artwork', $2)`, [`${compA}/a.pdf`, `${compB}/b.pdf`]);
const objs = (await as(A1, `select name from storage.objects`)).rows.map((r) => r.name);
ok('customer sees only own company files', objs.length === 1 && objs[0].startsWith(compA));
ok('staff sees all files', (await as(S, `select * from storage.objects`)).rows.length === 2);
ok('customer cannot upload', !!(await asErr(A1, `insert into storage.objects (bucket_id, name) values ('artwork', $1)`, [`${compA}/x.pdf`])).err);
ok('staff can upload', !(await asErr(S, `insert into storage.objects (bucket_id, name) values ('artwork', $1)`, [`${compA}/y.pdf`])).err);

// ── Invitations ──
const inv = await asErr(A1, `select * from create_invitation('New.Person@Acme.test', 'Finance')`);
ok('company Admin creates invitation', !inv.err, inv.err);
const token = inv.rows?.[0]?.token;
ok('Procurement Manager cannot invite', !!(await asErr(A2, `select create_invitation('x@acme.test','Viewer')`)).err);
ok('Admin cannot invite into another company', (await as(A1, `select company_id from create_invitation('y@acme.test','Viewer', $1)`, [compB])).rows[0].company_id === compA);
ok('cannot invite existing user', !!(await asErr(A1, `select create_invitation('b1@bright.test','Viewer')`)).err);
ok('B cannot see A invitations', (await as(B1, `select * from company_invitations`)).rows.length === 0);
ok('staff invites into any company', !(await asErr(S, `select create_invitation('z@bright.test','Viewer', $1)`, [compB])).err);
await db.exec(`reset role; set role anon`);
const look = (await db.query(`select * from get_invitation($1)`, [token])).rows;
await db.exec('reset role');
ok('anon can look up invite by token', look.length === 1 && look[0].company_name === 'Acme' && look[0].role === 'Finance');

const N1 = U(11), N2 = U(12), N3 = U(13);
await signup(N2, 'intruder@evil.test', { company_name: 'Evil', invite_token: token });
ok('token with wrong email does not join company', (await su(`select company_id from profiles where id=$1`, [N2])).rows[0].company_id !== compA);
await signup(N1, 'new.person@acme.test', { first_name: 'Nia', invite_token: token });
const pN1 = (await su(`select company_id, role, is_staff from profiles where id=$1`, [N1])).rows[0];
ok('invitee joins inviting company with invited role', pN1.company_id === compA && pN1.role === 'Finance' && !pN1.is_staff);
ok('inviter notified of acceptance', (await notifs(A1)).some((n) => n.title === 'Invitation accepted'));
await signup(N3, 'new.person2@acme.test', { invite_token: 'not-a-uuid' });
ok('malformed token falls back to new company', (await su(`select role from profiles where id=$1`, [N3])).rows[0].role === 'Admin');

// ── Deactivation ──
await as(A1, `update profiles set status='Suspended' where id=$1`, [A2]);
ok('deactivated user loses company data', (await as(A2, `select * from orders`)).rows.length === 0);
ok('deactivated user cannot reorder', !!(await asErr(A2, `select create_reorder_request($1, $2)`, [orderA, qty])).err);

// ════════════════════════════════════════════════════════════════════════════
// Migration 005 — Stripe payments
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 005 ──');
await apply('005_stripe_payments.sql');
await apply('005_stripe_payments.sql');

const payOrder = po.rows[0].id;
ok('existing orders default to Unpaid', (await as(A1, `select payment_status from orders where id=$1`, [payOrder])).rows[0]?.payment_status === 'Unpaid');
const po2 = await asErr(A1, `select * from place_order($1::jsonb)`, [JSON.stringify([{ plate_ref: 'PLT-1', quantity: 10 }])]);
ok('place_order still works and starts Unpaid', !po2.err && po2.rows?.[0]?.payment_status === 'Unpaid', po2.err);
ok('customer cannot mark own order paid', (await asErr(A1, `update orders set payment_status='Paid' where id=$1`, [payOrder])).affected === 0);
ok('customer cannot set Stripe session id', (await asErr(A1, `update orders set stripe_checkout_session_id='cs_x' where id=$1`, [payOrder])).affected === 0);
ok('invalid payment status rejected', !!(await su(`update orders set payment_status='Refunded' where id=$1`, [payOrder]).then(() => null, (e) => e.message)));

// Server (service role) records a confirmed Stripe payment
await su(`update orders set payment_status='Paid', amount_paid=4950, paid_at=now(), stripe_checkout_session_id='cs_test_1' where id=$1`, [payOrder]);
ok('staff notified of payment', (await notifs(S)).some((n) => n.title === 'Payment received ' + po.rows[0].ref));
ok('company payers notified of payment', (await notifs(A1)).some((n) => n.title === 'Payment received for ' + po.rows[0].ref));
ok('other company not notified of payment', (await notifs(B1)).every((n) => !n.title.includes(po.rows[0].ref)));
ok('customer sees payment state', (await as(A1, `select payment_status, amount_paid from orders where id=$1`, [payOrder])).rows[0]?.payment_status === 'Paid');
ok('B cannot see A payment', (await as(B1, `select * from orders where id=$1`, [payOrder])).rows.length === 0);

const payOrder2 = po2.rows[0].id;
await su(`update orders set payment_status='Processing', stripe_checkout_session_id='cs_test_2' where id=$1`, [payOrder2]);
await su(`update orders set payment_status='Unpaid' where id=$1`, [payOrder2]);
ok('failed delayed payment notifies company', (await notifs(A1)).some((n) => n.title === 'Payment failed for ' + po2.rows[0].ref));

// ════════════════════════════════════════════════════════════════════════════
// Migration 006 — email delivery
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 006 ──');
await su(`insert into notifications (user_id, type, title, created_at) values ($1, 'order', 'Ancient', now() - interval '3 days')`, [A1]);
await apply('006_email_notifications.sql');
await apply('006_email_notifications.sql');

ok('old notifications marked as already handled', (await su(`select emailed_at from notifications where title='Ancient'`)).rows[0]?.emailed_at !== null);
const fresh = (await su(`select id, emailed_at, email_attempts from notifications where user_id=$1 and title like 'Payment failed%'`, [A1])).rows[0];
ok('recent notifications left pending for email', fresh && fresh.emailed_at === null && fresh.email_attempts === 0);
ok('user can still mark own notification read', (await asErr(A1, `update notifications set read_at=now() where id=$1`, [fresh.id])).affected === 1);
ok('user cannot mark own notification emailed', !!(await asErr(A1, `update notifications set emailed_at=now() where id=$1`, [fresh.id])).err);
ok('user cannot rewrite notification text', !!(await asErr(A1, `update notifications set title='spoof' where id=$1`, [fresh.id])).err);
ok('user cannot reassign notification', !!(await asErr(A1, `update notifications set user_id=$2 where id=$1`, [fresh.id, B1])).err);

// Server (service role) claims a pending email; a second, overlapping claim gets nothing
await db.exec('set role service_role');
const claim  = await db.query(`update notifications set emailed_at=now() where id=$1 and emailed_at is null returning id`, [fresh.id]);
const claim2 = await db.query(`update notifications set emailed_at=now() where id=$1 and emailed_at is null returning id`, [fresh.id]);
await db.exec('reset role');
ok('service role claims a pending email exactly once', claim.rows.length === 1 && claim2.rows.length === 0);
const po3 = await asErr(A1, `select * from place_order($1::jsonb)`, [JSON.stringify([{ plate_ref: 'PLT-1', quantity: 5 }])]);
ok('new notifications start pending', (await su(`select count(*)::int n from notifications where title='New order ' || $1 and emailed_at is null`, [po3.rows?.[0]?.ref])).rows[0].n > 0, po3.err);

// ════════════════════════════════════════════════════════════════════════════
// Migration 007 — product pricing
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 007 ──');
await apply('007_product_pricing.sql');
await apply('007_product_pricing.sql');

const lineOf = async (ref) => (await su(`select oi.* from order_items oi join orders o on o.id=oi.order_id where o.ref=$1`, [ref])).rows[0];
ok('fallback: no fixed price → last order price still used', Number((await as(A1, `select unit_price from get_catalog() where plate_ref='PLT-1'`)).rows[0]?.unit_price) === 1.5);

const setPrice = `insert into product_prices (company_id, plate_ref, product_name, sku_id, unit_price, min_quantity) values ($1,'PLT-1','Box (contract)','SKU-C1',1.25,500)`;
ok('customer cannot set prices', !!(await asErr(A1, setPrice, [compA])).err);
ok('staff sets a fixed price', !(await asErr(S, setPrice, [compA])).err);
ok('customer cannot change a price', (await asErr(A1, `update product_prices set unit_price=0.01`)).affected === 0);
ok('customer cannot delete a price', (await asErr(A1, `delete from product_prices`)).affected === 0);
ok('customer sees own company price', (await as(A1, `select * from product_prices`)).rows.length === 1);
ok('other company cannot see the price', (await as(B1, `select * from product_prices`)).rows.length === 0);

const cat7 = (await as(A1, `select * from get_catalog() where plate_ref='PLT-1'`)).rows[0];
ok('catalog shows fixed price + minimum', Number(cat7?.unit_price) === 1.25 && cat7?.min_quantity === 500 && cat7?.product_name === 'Box (contract)', JSON.stringify(cat7 && { p: cat7.unit_price, m: cat7.min_quantity }));
ok('below minimum quantity rejected', /Minimum order/.test((await asErr(A1, `select place_order($1::jsonb)`, [JSON.stringify([{ plate_ref: 'PLT-1', quantity: 499 }])])).err ?? ''));
const po7 = await asErr(A1, `select * from place_order($1::jsonb)`, [JSON.stringify([{ plate_ref: 'PLT-1', quantity: 1000, unit_price: 0.01 }])]);
ok('order uses fixed price (1000 × 1.25 = 1250), ignores client price', !po7.err && Number(po7.rows?.[0]?.total) === 1250, po7.err ?? po7.rows?.[0]?.total);
const l7 = po7.rows?.[0] && await lineOf(po7.rows[0].ref);
ok('order line takes product name / SKU from price, specs from artwork', l7?.product_name === 'Box (contract)' && l7?.sku_id === 'SKU-C1');

// A plate with approved artwork but never ordered can be priced and ordered
await su(`insert into artwork_files (company_id, name, plate_ref, version, status, dimensions) values ($1,'New Label','PLT-NEW','v1','Approved','50×30mm')`, [compA]);
ok('never-ordered plate is not orderable without a price', /No price on file/.test((await asErr(A1, `select place_order($1::jsonb)`, [JSON.stringify([{ plate_ref: 'PLT-NEW', quantity: 10 }])])).err ?? ''));
await as(S, `insert into product_prices (company_id, plate_ref, product_name, unit_price) values ($1,'PLT-NEW','New Label',0.3)`, [compA]);
const poNew = await asErr(A1, `select * from place_order($1::jsonb)`, [JSON.stringify([{ plate_ref: 'PLT-NEW', quantity: 10 }])]);
ok('priced new plate can be ordered (10 × 0.30 = 3)', !poNew.err && Number(poNew.rows?.[0]?.total) === 3, poNew.err);
ok('specs copied from artwork', (await lineOf(poNew.rows?.[0]?.ref))?.dimensions === '50×30mm');
ok('non-positive price rejected', !!(await asErr(S, `update product_prices set unit_price=0 where plate_ref='PLT-NEW'`)).err);

// ════════════════════════════════════════════════════════════════════════════
// Migration 008 — portal subscriptions (Stripe Billing)
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 008 ──');
await apply('008_subscriptions.sql');
await apply('008_subscriptions.sql');

await db.exec('set role service_role');
const subIns = await db.query(`insert into subscriptions (stripe_subscription_id, stripe_customer_id, email, company_name, plan, billing_interval, status)
  values ('sub_test_1','cus_test_1','ops@harbour.test','Harbour Signs','growth','month','trialing') returning id`).then(() => null, (e) => e.message);
await db.query(`insert into subscriptions (stripe_subscription_id, stripe_customer_id, plan, billing_interval, status) values ('sub_test_1','cus_test_1','growth','month','active')
  on conflict (stripe_subscription_id) do update set status = excluded.status`);
await db.exec('reset role');
ok('server (service role) records a subscription', subIns === null, subIns);
ok('upsert by Stripe subscription id keeps one row', (await su(`select count(*)::int n, max(status) s from subscriptions`)).rows[0].n === 1 && (await su(`select status from subscriptions`)).rows[0].status === 'active');
ok('staff can read subscriptions', (await as(S, `select * from subscriptions`)).rows.length === 1);
ok('customers cannot read subscriptions', (await as(A1, `select * from subscriptions`)).rows.length === 0);
ok('customers cannot insert subscriptions', !!(await asErr(A1, `insert into subscriptions (stripe_subscription_id, stripe_customer_id, plan, billing_interval, status) values ('sub_x','cus_x','scale','year','active')`)).err);
ok('staff cannot edit subscriptions (Stripe is the source of truth)', (await asErr(S, `update subscriptions set status='active', plan='scale'`)).affected === 0);
ok('duplicate Stripe subscription id rejected', !!(await su(`insert into subscriptions (stripe_subscription_id, stripe_customer_id, plan, billing_interval, status) values ('sub_test_1','cus_y','starter','month','active')`).then(() => null, (e) => e.message)));

// ════════════════════════════════════════════════════════════════════════════
// Migration 009 — rate limits, audit log, staff two-factor
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 009 ──');
await apply('009_security_audit_mfa.sql');
await apply('009_security_audit_mfa.sql');

// Staff two-factor
ok('staff with two-factor session sees all orders', (await as(S, `select * from orders`)).rows.length > 1);
AAL = 'aal1';
ok('staff with password-only session is not staff', (await as(S, `select is_staff() s`)).rows[0].s === false);
ok('password-only staff sees no other companies\' orders', (await as(S, `select * from orders`)).rows.length === 0);
ok('password-only staff cannot set prices', !!(await asErr(S, `insert into product_prices (company_id, plate_ref, product_name, unit_price) values ($1,'PLT-AAL','X',1)`, [compA])).err);
ok('password-only staff cannot read the audit log', (await as(S, `select * from audit_log`)).rows.length === 0);
AAL = 'aal2';

// Rate limits
const hit = async () => { await db.exec('set role service_role'); try { return (await db.query(`select hit_rate_limit('t:1', 3, 60) ok`)).rows[0].ok; } finally { await db.exec('reset role'); } };
const hits = [await hit(), await hit(), await hit(), await hit()];
ok('rate limit allows 3 then blocks the 4th', hits.join() === 'true,true,true,false', hits.join());
ok('customers cannot call the rate limiter', !!(await asErr(A1, `select hit_rate_limit('t:1', 3, 60)`)).err);
ok('customers cannot read rate limit counters', !!(await asErr(A1, `select * from rate_limits`)).err);

// Audit log
const auditFor = async (table) => (await su(`select * from audit_log where table_name=$1 order by id desc`, [table])).rows;
await as(S, `update product_prices set unit_price=0.35 where plate_ref='PLT-NEW'`);
const pa = (await auditFor('product_prices'))[0];
ok('price change logged with who and old/new value', pa?.actor_id === S && pa.actor_email === 'staff@gss.test' && pa.action === 'update'
  && Number(pa.changes.unit_price?.from) === 0.3 && Number(pa.changes.unit_price?.to) === 0.35 && pa.company_id === compA, JSON.stringify(pa?.changes));
await as(S, `delete from product_prices where plate_ref='PLT-NEW'`);
ok('price removal logged', (await auditFor('product_prices'))[0]?.action === 'delete');
ok('price entries labelled with the plate ref', (await auditFor('product_prices')).every((r) => r.label === 'PLT-NEW' || r.label === 'PLT-1'));

const ord = (await su(`select id, status from orders where company_id=$1 and status <> 'In Production' limit 1`, [compA])).rows[0];
await as(S, `update orders set status='In Production' where id=$1`, [ord.id]);
const oa = (await auditFor('orders'))[0];
ok('order status change logged', oa?.record_id === ord.id && oa.changes.status?.to === 'In Production', JSON.stringify(oa?.changes));
ok('audit entry labelled with the order ref', !!oa?.label && oa.label === (await su(`select ref from orders where id=$1`, [ord.id])).rows[0].ref);
const nOrd = (await auditFor('orders')).length;
await as(S, `update orders set notes='internal note' where id=$1`, [ord.id]);
ok('untracked column change is not logged', (await auditFor('orders')).length === nOrd);

await su(`update orders set payment_status='Paid' where id=$1`, [ord.id]);
ok('server/webhook changes logged as system', (await auditFor('orders'))[0]?.actor_kind === 'system');

await asErr(S, `update profiles set role='Finance' where id=$1`, [A2]);
const ra = (await auditFor('profiles'))[0];
ok('role change logged', ra?.changes.role?.to === 'Finance', JSON.stringify(ra?.changes));
await as(S, `update companies set credit_limit=5000 where id=$1`, [compA]);
ok('company terms change logged', Number((await auditFor('companies'))[0]?.changes.credit_limit?.to) === 5000);

ok('staff can read the audit log', (await as(S, `select * from audit_log`)).rows.length >= 5);
ok('customers cannot read the audit log', (await as(A1, `select * from audit_log`)).rows.length === 0);
ok('customers cannot write the audit log', !!(await asErr(A1, `insert into audit_log (actor_kind, table_name, action) values ('user','x','update')`)).err);
const stEdit = await asErr(S, `update audit_log set actor_email='x'`);
ok('staff cannot edit the audit log', !!stEdit.err || stEdit.affected === 0);
await db.exec('set role service_role');
const svcDel = await db.query(`delete from audit_log`).then(() => null, (e) => e.message);
await db.exec('reset role');
ok('even the server cannot delete audit entries', !!svcDel);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
