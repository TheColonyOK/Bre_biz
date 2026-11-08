import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
const base = process.env.DEMO_TEST_ORIGIN || 'http://127.0.0.1:8877';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base)) throw new Error('This test only runs against a local loopback demo.');
const accessCode = process.env.DEMO_ACCESS_CODE;
if (!accessCode) throw new Error('Set DEMO_ACCESS_CODE in the test process environment.');
const origin = new URL(base).origin;
const results = [];
function pass(name) { results.push({ name, status: 'passed' }); console.log('PASS', name); }
async function call(path, { method = 'GET', body, cookie, headers = {}, includeOrigin = true } = {}) {
  const h = new Headers(headers);
  if (body !== undefined) h.set('Content-Type', 'application/json');
  if (cookie) h.set('Cookie', cookie);
  if (includeOrigin && !h.has('Origin')) h.set('Origin', origin);
  const response = await fetch(base + path, { method, headers: h, signal: AbortSignal.timeout(15000), ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  let data = null; const raw = await response.text();
  try { data = JSON.parse(raw); } catch {}
  return { status: response.status, data, headers: response.headers };
}
async function login(code = accessCode, opts = {}) {
  const response = await call('/api/demo-session', { method: 'POST', body: { code }, ...opts });
  const cookie = response.headers.get('set-cookie')?.split(';')[0];
  return { ...response, cookie };
}
async function request(method = 'GET', body, cookie, headers = {}, includeOrigin = true) {
  return call('/api/demo', { method, body, cookie, headers, includeOrigin });
}
const homepage = await fetch(base, { redirect: 'manual' });
assert.equal(homepage.status, 307); assert.match(homepage.headers.get('location') ?? '', /demo-access/);
pass('Private homepage redirects before rendering demo');
const accessPage = await fetch(base + '/demo-access'); assert.equal(accessPage.status, 200); assert.match(await accessPage.text(), /Demo access code/);
for (const file of ['celebration', 'cocktails', 'details']) { const asset = await fetch(base + '/images/' + file + '.webp'); assert.equal(asset.status, 200); await asset.arrayBuffer(); }
pass('Access form and all generated image assets serve');
assert.equal((await login(accessCode, { includeOrigin: false })).status, 403);
assert.equal((await login(accessCode, { headers: { Origin: 'https://unrelated.example' } })).status, 403);
assert.equal((await login('wrong-demo-passcode', {})).status, 401);
assert.equal((await login('x'.repeat(3000), {})).status, 413);
pass('Login requires exact origin and rejects wrong passcode');
const forged = await request('GET', undefined, undefined, { 'oai-authenticated-user-id': 'forged', 'oai-authenticated-user-email': 'forged@example.test' });
assert.equal(forged.status, 401); pass('Forged OAI identity headers do not authenticate');
const first = await login(); assert.equal(first.status, 200); assert.ok(first.cookie); assert.match(first.headers.get('set-cookie') ?? '', /HttpOnly/); assert.match(first.headers.get('set-cookie') ?? '', /; Secure(?:;|$)/);
const second = await login(); assert.equal(second.status, 200); assert.ok(second.cookie); assert.notEqual(first.cookie, second.cookie);
const tampered = first.cookie.replace(/.$/, first.cookie.endsWith('a') ? 'b' : 'a'); assert.equal((await request('GET', undefined, tampered)).status, 401);
const [cookieName, token] = first.cookie.split('='); const [sessionId, expires, signature] = token.split('.');
const changedId = randomUUID(); assert.equal((await request('GET', undefined, `${cookieName}=${changedId}.${expires}.${signature}`)).status, 401);
const expiredPayload = `${randomUUID()}.${Math.floor(Date.now() / 1000) - 1}`;
const expiredSignature = createHmac('sha256', process.env.DEMO_SESSION_SECRET).update(expiredPayload).digest('base64url');
assert.equal((await request('GET', undefined, `${cookieName}=${expiredPayload}.${expiredSignature}`)).status, 401);
pass('Separate browsers receive unique signed sessions; tampered sessions are rejected');
let current = await request('GET', undefined, first.cookie); assert.equal(current.status, 200); assert.equal(current.data.state.posts.length, 3); assert.equal(current.headers.get('cache-control'), 'private, no-store');
pass('Authenticated SQLite workspace initializes with seed content');
const secondState = await request('GET', undefined, second.cookie); assert.equal(secondState.status, 200);
const nextDate = new Date(Date.now() + 120 * 86400000).toISOString().slice(0, 10);
const inquiry = { name: 'QA Demo Host', email: 'host@example.test', phone: '', type: 'QA private celebration', service: 'Planning + bar', date: nextDate, time: '17:00', guests: 65, location: 'Demo Courtyard', budget: '5000-8000', notes: 'Test only, no real booking.' };
async function action(action, payload, status = 200, version = current.data.version) { const r = await request('POST', { action, payload, version }, first.cookie); assert.equal(r.status, status, JSON.stringify(r.data)); if (status === 200) current = r; return r; }
await action('createInquiry', { ...inquiry, date: '2020-01-01' }, 400); await action('createInquiry', { ...inquiry, email: 'invalid' }, 400); await action('createInquiry', { ...inquiry, guests: -2 }, 400); await action('createInquiry', { ...inquiry, name: '<script>alert(1)</script>' }, 400);
pass('Past dates, invalid emails, invalid guest counts and HTML rejected');
const before = current.data.version; await action('createInquiry', inquiry); const created = current.data.state.inquiries.find(i => i.name === 'QA Demo Host'); assert.ok(created?.eventId); assert.ok(current.data.state.events.find(e => e.id === created.eventId));
pass('Booking creates inquiry and linked event atomically');
await action('createInquiry', inquiry, 400); pass('Duplicate sample date and time rejected');
await action('updateInquiry', { id: created.id, status: 'contacted' }, 409, before); pass('Stale version cannot overwrite current data');
await action('updateInquiry', { id: created.id, status: 'confirmed' }); assert.equal(current.data.state.inquiries.find(i => i.id === created.id).status, 'confirmed'); pass('Owner inquiry status persists');
let event = structuredClone(current.data.state.events.find(e => e.id === created.eventId)); event.notes = 'Verified planning notes'; event.tasks.push({ id: 'qa-task', title: 'Choose linens', done: true }); event.timeline.push({ id: 'qa-moment', time: '19:00', title: 'Dinner' }); event.budgetItems = [{ id: 'qa-budget', name: 'Flowers', estimated: 850, actual: 700 }]; event.drinks = ['Raspberry spritz', 'Alcohol-free citrus cooler']; event.guests = 72; event.venue = 'Updated demo venue';
await action('updateEvent', event); let fresh = await request('GET', undefined, first.cookie); assert.deepEqual(fresh.data.state.events.find(e => e.id === event.id), event); assert.equal(fresh.data.state.inquiries.find(i => i.id === created.id).guests, 72);
pass('Planner, checklist, timeline, budget and menu survive fresh read and sync inquiry');
const otherState = await request('GET', undefined, second.cookie); assert.ok(!otherState.data.state.inquiries.some(i => i.id === created.id)); const stolen = await request('POST', { action: 'updateEvent', payload: event, version: otherState.data.version }, second.cookie); assert.equal(stolen.status, 400); pass('Second browser session cannot read or update first session data');
const crossOrigin = await request('POST', { action: 'updateInquiry', payload: { id: created.id, status: 'new' }, version: current.data.version }, first.cookie, { Origin: 'https://unrelated.example' }); assert.equal(crossOrigin.status, 403); assert.equal((await request('GET', undefined, first.cookie)).status, 200); pass('Cross-origin mutation rejected; valid session recovers');
const noOrigin = await request('POST', { action: 'updateInquiry', payload: { id: created.id, status: 'new' }, version: current.data.version }, first.cookie, {}, false); assert.equal(noOrigin.status, 200); current = noOrigin;
const post = { title: 'QA planning article', category: 'Planning tips', excerpt: 'Useful sample article.', body: 'The first paragraph is a practical planning note.\n\nThe second paragraph is a considered next step.', image: '/images/details.webp', published: false, readTime: '2 min read' };
await action('savePost', post); const article = current.data.state.posts.find(p => p.title === post.title); assert.equal(article.published, false); await action('savePost', { ...article, published: true }); assert.equal(current.data.state.posts.find(p => p.id === article.id).published, true); await action('deletePost', { id: article.id }); assert.ok(!current.data.state.posts.find(p => p.id === article.id)); pass('Journal draft, publish, update and deletion persist');
await action('saveHighlight', { title: 'QA concept', category: 'Private parties', description: 'An illustrative celebration concept.', image: '/images/celebration.webp', guests: 72 }); const h = current.data.state.highlights.find(h => h.title === 'QA concept'); await action('saveHighlight', { ...h, title: 'QA concept edited' }); await action('deleteHighlight', { id: h.id }); assert.ok(!current.data.state.highlights.find(x => x.id === h.id)); pass('Highlights create, edit and delete persist');
const version = current.data.version; const parallel = await Promise.all([request('POST', { action: 'updateInquiry', payload: { id: created.id, status: 'contacted' }, version }, first.cookie), request('POST', { action: 'updateInquiry', payload: { id: created.id, status: 'confirmed' }, version }, first.cookie)]); assert.deepEqual(parallel.map(r => r.status).sort(), [200, 409]); pass('Concurrent writes allow one save and reject stale save');
assert.equal((await request('GET')).status, 401); assert.equal((await request('POST', { action: 'createInquiry', payload: {}, version: 1 })).status, 401); pass('Anonymous reads and writes rejected');
for (let i = 0; i < 120; i++) assert.equal((await login('incorrect-test-code')).status, 401);
assert.equal((await login()).status, 429); pass('Login body is bounded and repeated failed attempts are rate-limited');
console.log(JSON.stringify({ origin: base, passed: results.length, results }));
