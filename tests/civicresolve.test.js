const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadAppSandbox() {
  const store = {};
  const session = {};
  const makeEl = (id) => ({
    id,
    value: id.includes('search') ? '' : 'All',
    textContent: '',
    innerHTML: '',
    className: '',
    disabled: false,
    src: '',
    style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {}
  });

  const elements = {};
  const sandbox = {
    console,
    setTimeout: () => {},
    URL: { createObjectURL: () => 'blob:mock', revokeObjectURL() {} },
    Blob: class {},
    navigator: {},
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; }
    },
    sessionStorage: {
      getItem: (k) => (k in session ? session[k] : null),
      setItem: (k, v) => { session[k] = String(v); },
      removeItem: (k) => { delete session[k]; }
    },
    document: {
      getElementById: (id) => (elements[id] ||= makeEl(id)),
      createElement: () => makeEl('dynamic')
    },
    fetch: async () => ({ ok: false, status: 500 })
  };

  vm.createContext(sandbox);
  const code = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  vm.runInContext(code, sandbox);
  return { sandbox, store, session };
}

test('Security: escapeHtml neutralizes XSS injection payloads', () => {
  const { sandbox } = loadAppSandbox();
  const payload = `<script>alert("xss")</script>'&`;
  const safe = sandbox.escapeHtml(payload);
  assert.equal(safe.includes('<script>'), false);
  assert.equal(safe, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;&#39;&amp;');
});

test('AI Classification: detects Water Supply & Critical urgency for burst pipe', () => {
  const { sandbox } = loadAppSandbox();
  const res = sandbox.runLocalSmartTriage(
    'Main water pipeline burst',
    'High-pressure drinking water gushing and flooding near hospital road',
    'Ward 8',
    'Auto-Detect'
  );
  assert.equal(res.category, 'Water Supply & Drainage');
  assert.equal(res.department, 'Water Supply & Drainage Board');
  assert.equal(res.priority, 'Critical');
  assert.ok(res.impactScore >= 86);
});

test('AI Classification: detects Roads, Waste, and Streetlighting categories', () => {
  const { sandbox } = loadAppSandbox();

  const road = sandbox.runLocalSmartTriage('Deep pothole', 'Asphalt crater on main road', 'Cross 2', 'Auto-Detect');
  assert.equal(road.category, 'Roads & Potholes');
  assert.equal(road.department, 'Public Works & Roads Department');

  const waste = sandbox.runLocalSmartTriage('Overflowing garbage bin', 'Trash dump creating foul odor', 'Market', 'Auto-Detect');
  assert.equal(waste.category, 'Waste & Sanitation');
  assert.equal(waste.department, 'Solid Waste & Sanitation Department');

  const light = sandbox.runLocalSmartTriage('Broken streetlight', 'Sparking electric pole leaving road dark', 'Sector 5', 'Auto-Detect');
  assert.equal(light.category, 'Streetlighting & Electrical');
  assert.equal(light.priority, 'Critical');
});

test('AI Classification: respects explicit manual category override', () => {
  const { sandbox } = loadAppSandbox();
  const res = sandbox.runLocalSmartTriage('Tree branch fallen', 'Blocking footpath', 'Park Rd', 'Parks & Urban Spaces');
  assert.equal(res.category, 'Parks & Urban Spaces');
  assert.equal(res.department, 'Parks & Urban Horticulture');
});

test('Resilience: analyzeComplaintAI falls back safely if Gemini API fails', async () => {
  const { sandbox, session } = loadAppSandbox();
  session['civicresolve_gemini_key'] = 'mock-key';
  const res = await sandbox.analyzeComplaintAI('Pothole hazard', 'Deep road damage near school', 'Main St', 'Auto-Detect');
  assert.equal(res.category, 'Roads & Potholes');
  assert.ok(res.impactScore >= 55);
});

test('Workflow: issue persistence, upvoting, and admin deletion work end-to-end', () => {
  const { sandbox } = loadAppSandbox();
  const initial = sandbox.getIssues();
  assert.ok(initial.length >= 4);

  const targetId = initial[0].id;
  const beforeVotes = initial[0].upvotes;
  sandbox.upvoteIssue(targetId);
  assert.equal(sandbox.getIssues()[0].upvotes, beforeVotes + 1);

  sandbox.deleteIssue(targetId);
  assert.equal(sandbox.getIssues().some((i) => i.id === targetId), false);
});

test('Accessibility & Structure: index.html includes core landmarks and metadata', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(html.includes('lang="en"'));
  assert.ok(html.includes('<header'));
  assert.ok(html.includes('<nav'));
  assert.ok(html.includes('<main'));
  assert.ok(html.includes('<footer'));
});
