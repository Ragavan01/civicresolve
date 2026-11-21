// CivicResolve — AI-Powered Citizen Grievance Management & Resolution

const STORAGE_KEY = 'civicresolve_issues_v1';
const API_KEY_SESSION = 'civicresolve_gemini_key';

let uploadedImageData = null;
let latestTriage = null;

const DEPARTMENT_MAP = {
  'Roads & Potholes': 'Public Works & Roads Department',
  'Waste & Sanitation': 'Solid Waste & Sanitation Department',
  'Streetlighting & Electrical': 'Electrical & Streetlighting Division',
  'Water Supply & Drainage': 'Water Supply & Drainage Board',
  'Traffic & Public Safety': 'Traffic Police & Public Safety',
  'Parks & Urban Spaces': 'Parks & Urban Horticulture'
};

const SAMPLE_PRESETS = [
  {
    title: 'Large crater pothole near school crossing',
    location: 'Avinashi Main Road, near St. Mary School',
    description: 'A deep 2-foot wide pothole filled with rainwater has caused two two-wheeler skids since yesterday morning. Heavy school bus and commuter traffic passes here daily.'
  },
  {
    title: 'Overflowing community garbage bin for 4 days',
    location: 'Gandhi Market North Gate, Ward 14',
    description: 'Waste bins have completely overflowed onto the sidewalk, creating a severe foul odor, stray animal congestion, and unhygienic conditions near vegetable stalls.'
  },
  {
    title: 'Three streetlights out & sparking junction box',
    location: 'College Link Road, Sector 5',
    description: 'Entire 200-meter stretch is pitch dark after 6:30 PM and one electric pole junction box was sparking during light rain. Major safety hazard for pedestrians.'
  },
  {
    title: 'Main drinking water pipeline burst and flooding street',
    location: 'Bus Stand East Lane, Cross 2',
    description: 'High-pressure clean drinking water has been gushing out of a cracked underground pipe for 6 hours, flooding nearby shops and wasting thousands of liters.'
  }
];

const INITIAL_DEMO_ISSUES = [
  {
    id: 'CR-2026-1041',
    title: 'Main drinking water pipeline rupture',
    location: 'Old Bus Stand Road, Ward 8',
    description: 'Continuous high-pressure water leakage flooding the intersection and disrupting morning commute.',
    category: 'Water Supply & Drainage',
    priority: 'Critical',
    impactScore: 93,
    department: 'Water Supply & Drainage Board',
    sla: '4–6 Hours (Emergency Dispatch)',
    reasoning: 'Active potable water loss combined with roadway flooding poses an immediate public infrastructure and safety hazard.',
    actionPlan: 'Shut off local isolation valve and dispatch rapid-response pipe repair crew.',
    engine: 'Google Gemini Triage',
    status: 'In Progress',
    adminNote: 'Valve closed; excavation & pipe clamp crew currently on site.',
    upvotes: 24,
    image: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 140).toISOString()
  },
  {
    id: 'CR-2026-1042',
    title: 'Deep pothole near hospital ambulance lane',
    location: 'GH Junction, Main Bypass',
    description: 'Severe asphalt cave-in slowing ambulances and risking axle damage during peak hours.',
    category: 'Roads & Potholes',
    priority: 'High',
    impactScore: 84,
    department: 'Public Works & Roads Department',
    sla: '24 Hours',
    reasoning: 'Road hazard directly affects emergency vehicle access and high-density commuter safety.',
    actionPlan: 'Deploy reflective barricades immediately and schedule cold-mix asphalt patching.',
    engine: 'Google Gemini Triage',
    status: 'Reported',
    adminNote: 'Queued for rapid inspection by Zone-2 Roads Engineer.',
    upvotes: 17,
    image: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString()
  },
  {
    id: 'CR-2026-1043',
    title: 'Overflowing garbage bins along market street',
    location: 'Daily Market Road, Ward 11',
    description: 'Municipal waste dumpsters have not been cleared for 3 days, blocking pedestrian walkway.',
    category: 'Waste & Sanitation',
    priority: 'Medium',
    impactScore: 68,
    department: 'Solid Waste & Sanitation Department',
    sla: '48 Hours',
    reasoning: 'Prolonged waste accumulation impacts neighborhood hygiene and pedestrian mobility.',
    actionPlan: 'Dispatch compactor truck and sanitize surrounding pavement.',
    engine: 'Google Gemini Triage',
    status: 'Resolved',
    adminNote: 'Waste cleared by Ward 11 sanitation truck #04 and area disinfected.',
    upvotes: 11,
    image: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 420).toISOString()
  },
  {
    id: 'CR-2026-1044',
    title: 'Damaged LED streetlights along residential park',
    location: 'Nehru Park East Walkway',
    description: 'Four consecutive streetlamps stopped working, leaving evening walkers in complete darkness.',
    category: 'Streetlighting & Electrical',
    priority: 'High',
    impactScore: 76,
    department: 'Electrical & Streetlighting Division',
    sla: '24 Hours',
    reasoning: 'Multiple consecutive lamp failures create a public safety and visibility risk after sunset.',
    actionPlan: 'Inspect feeder pillar breaker and replace faulty LED driver units.',
    engine: 'Google Gemini Triage',
    status: 'In Progress',
    adminNote: 'Electrical technician assigned; spare LED fixtures issued.',
    upvotes: 9,
    image: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 210).toISOString()
  }
];

function getIssues() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_ISSUES));
      return [...INITIAL_DEMO_ISSUES];
    }
    return JSON.parse(raw);
  } catch {
    return [...INITIAL_DEMO_ISSUES];
  }
}

function saveIssues(issues) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  const bg = type === 'error' ? 'bg-rose-600' : type === 'info' ? 'bg-slate-900' : 'bg-emerald-600';
  el.className = `${bg} text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold fade-in`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// Navigation
function switchTab(tab) {
  ['report', 'track', 'admin'].forEach(t => {
    document.getElementById(`view-${t}`).classList.toggle('hidden', t !== tab);
    const btn = document.getElementById(`nav-${t}`);
    if (t === tab) {
      btn.classList.add('bg-blue-600', 'text-white');
      btn.classList.remove('text-slate-300');
    } else {
      btn.classList.remove('bg-blue-600', 'text-white');
      btn.classList.add('text-slate-300');
    }
  });
  if (tab === 'track') renderTrackDashboard();
  if (tab === 'admin') renderAdminDashboard();
}

// Sample presets & GPS
function loadSample(idx) {
  const s = SAMPLE_PRESETS[idx];
  document.getElementById('input-title').value = s.title;
  document.getElementById('input-location').value = s.location;
  document.getElementById('input-description').value = s.description;
  document.getElementById('input-category').value = 'Auto-Detect';
  runAITriagePreview();
}

function detectLocation() {
  const input = document.getElementById('input-location');
  if (!navigator.geolocation) {
    showToast('GPS not supported on this browser.', 'error');
    return;
  }
  input.value = 'Fetching GPS coordinates...';
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      input.value = `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      showToast('Location captured via GPS!');
    },
    () => {
      input.value = '';
      showToast('Location permission denied. Enter address manually.', 'error');
    }
  );
}

// Image Upload
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) {
    showToast('Please select an image smaller than 3 MB.', 'error');
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    uploadedImageData = e.target.result;
    document.getElementById('image-preview').src = uploadedImageData;
    document.getElementById('image-preview-wrap').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function removeImage() {
  uploadedImageData = null;
  document.getElementById('input-image').value = '';
  document.getElementById('image-preview-wrap').classList.add('hidden');
}

// Gemini API Modal
function updateApiStatusUI() {
  const hasKey = Boolean(sessionStorage.getItem(API_KEY_SESSION));
  const dot = document.getElementById('ai-status-dot');
  const txt = document.getElementById('ai-status-text');
  if (hasKey) {
    dot.className = 'w-2 h-2 rounded-full bg-blue-400 animate-pulse';
    txt.textContent = 'Gemini Live API';
  } else {
    dot.className = 'w-2 h-2 rounded-full bg-emerald-400';
    txt.textContent = 'Smart AI Active';
  }
}

function openApiModal() {
  document.getElementById('gemini-key-input').value = sessionStorage.getItem(API_KEY_SESSION) || '';
  document.getElementById('api-modal').classList.remove('hidden');
}

function closeApiModal() {
  document.getElementById('api-modal').classList.add('hidden');
}

function saveApiKey() {
  const key = document.getElementById('gemini-key-input').value.trim();
  if (!key) {
    showToast('Enter a valid Gemini API key or click Use Built-in AI.', 'error');
    return;
  }
  sessionStorage.setItem(API_KEY_SESSION, key);
  updateApiStatusUI();
  closeApiModal();
  showToast('Google Gemini Live API connected!');
}

function clearApiKey() {
  sessionStorage.removeItem(API_KEY_SESSION);
  updateApiStatusUI();
  closeApiModal();
  showToast('Switched to built-in Smart AI Triage Engine.', 'info');
}

// Smart Local Heuristic Fallback AI Engine (guarantees zero-friction testing without API keys)
function runLocalSmartTriage(title, description, location, manualCategory) {
  const text = `${title} ${description} ${location}`.toLowerCase();

  let category = manualCategory !== 'Auto-Detect' ? manualCategory : 'Roads & Potholes';
  if (manualCategory === 'Auto-Detect') {
    const rules = [
      { cat: 'Water Supply & Drainage', keys: ['water', 'pipe', 'leak', 'burst', 'drain', 'sewage', 'flood', 'gutter', 'manhole', 'overflowing drain'] },
      { cat: 'Waste & Sanitation', keys: ['garbage', 'trash', 'waste', 'bin', 'dump', 'smell', 'odor', 'sanitation', 'sweeping', 'litter', 'plastic'] },
      { cat: 'Streetlighting & Electrical', keys: ['light', 'streetlight', 'lamp', 'dark', 'pole', 'wire', 'spark', 'electric', 'shock', 'transformer', 'blackout'] },
      { cat: 'Roads & Potholes', keys: ['pothole', 'road', 'asphalt', 'crater', 'pavement', 'footpath', 'speed breaker', 'bridge', 'tar', 'cave'] },
      { cat: 'Traffic & Public Safety', keys: ['signal', 'traffic', 'accident', 'crossing', 'sign', 'encroachment', 'parking', 'hazard', 'blocked'] },
      { cat: 'Parks & Urban Spaces', keys: ['park', 'tree', 'branch', 'bench', 'playground', 'garden', 'fallen tree'] }
    ];

    let bestScore = 0;
    for (const r of rules) {
      const hits = r.keys.reduce((acc, k) => acc + (text.includes(k) ? 1 : 0), 0);
      if (hits > bestScore) {
        bestScore = hits;
        category = r.cat;
      }
    }
  }

  let score = 56;
  const criticalSignals = ['spark', 'shock', 'exposed wire', 'burst', 'flood', 'ambulance', 'hospital', 'school', 'accident', 'skid', 'collapse', 'sewage', 'gas', 'fire', 'live wire'];
  const highSignals = ['deep', 'major', 'danger', 'hazard', 'dark', 'overflow', 'blocked', 'main road', 'highway', 'days', 'broken', 'gushing', 'heavy traffic'];
  const mediumSignals = ['smell', 'litter', 'flicker', 'cracked', 'slow', 'dirty', 'damaged'];

  criticalSignals.forEach(k => { if (text.includes(k)) score += 14; });
  highSignals.forEach(k => { if (text.includes(k)) score += 7; });
  mediumSignals.forEach(k => { if (text.includes(k)) score += 4; });
  if (uploadedImageData) score += 4;
  score = Math.max(35, Math.min(98, score));

  let priority = 'Low';
  let sla = '5–7 Business Days';
  if (score >= 86) { priority = 'Critical'; sla = '4–6 Hours (Emergency Dispatch)'; }
  else if (score >= 72) { priority = 'High'; sla = '24 Hours'; }
  else if (score >= 55) { priority = 'Medium'; sla = '48–72 Hours'; }

  const department = DEPARTMENT_MAP[category] || 'Municipal General Services';

  const actionPlans = {
    'Roads & Potholes': 'Install safety cones around damaged stretch and dispatch asphalt patching team.',
    'Waste & Sanitation': 'Route nearest compactor truck for clearance and apply area disinfectant.',
    'Streetlighting & Electrical': 'Inspect electrical pole circuit safety, isolate live faults, and restore LED lighting.',
    'Water Supply & Drainage': 'Isolate affected pipeline valve, clear blockage/leakage, and restore normal flow.',
    'Traffic & Public Safety': 'Alert local traffic wardens and repair affected signage or signal controllers.',
    'Parks & Urban Spaces': 'Dispatch urban maintenance crew to clear hazards and restore public space.'
  };

  return {
    category,
    priority,
    impactScore: score,
    department,
    sla,
    reasoning: `Classified under ${category} with ${priority.toLowerCase()} urgency (${score}/100) based on safety keywords, public exposure, and location context.`,
    actionPlan: actionPlans[category],
    engine: 'Smart AI Triage Engine'
  };
}

// Live Google Gemini API Call (with automatic fallback)
async function analyzeComplaintAI(title, description, location, manualCategory) {
  const apiKey = sessionStorage.getItem(API_KEY_SESSION);
  if (!apiKey) {
    await new Promise(r => setTimeout(r, 450));
    return runLocalSmartTriage(title, description, location, manualCategory);
  }

  const prompt = `You are CivicResolve, a municipal AI grievance triage system.
Analyze this citizen complaint and return ONLY valid JSON with no markdown fences:
{
  "category": one of ["Roads & Potholes", "Waste & Sanitation", "Streetlighting & Electrical", "Water Supply & Drainage", "Traffic & Public Safety", "Parks & Urban Spaces"],
  "priority": one of ["Critical", "High", "Medium", "Low"],
  "impactScore": integer from 1 to 100,
  "department": exact municipal department name,
  "sla": short response timeline (e.g., "6 Hours" or "24 Hours"),
  "reasoning": concise 1-2 sentence explanation of urgency and public impact,
  "actionPlan": concise 1 sentence recommended first step for field crew
}
Title: ${title}
Location: ${location}
User Selected Category: ${manualCategory}
Description: ${description}`;

  const parts = [{ text: prompt }];
  if (uploadedImageData && uploadedImageData.includes(',')) {
    const [meta, base64] = uploadedImageData.split(',');
    const mimeType = meta.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
    parts.push({ inline_data: { mime_type: mimeType, data: base64 } });
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.2 }
      })
    });

    if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = rawText.replace(/```json|```/gi, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      category: parsed.category || 'Roads & Potholes',
      priority: parsed.priority || 'Medium',
      impactScore: Number(parsed.impactScore) || 70,
      department: parsed.department || DEPARTMENT_MAP[parsed.category] || 'Municipal Services',
      sla: parsed.sla || '24–48 Hours',
      reasoning: parsed.reasoning || 'Analyzed by Google Gemini.',
      actionPlan: parsed.actionPlan || 'Dispatch field inspection team.',
      engine: 'Google Gemini 2.5 Flash'
    };
  } catch (err) {
    console.warn('Gemini API fallback triggered:', err);
    showToast('Gemini API unreachable—used Smart AI fallback.', 'info');
    return runLocalSmartTriage(title, description, location, manualCategory);
  }
}

function priorityColorClasses(priority) {
  if (priority === 'Critical') return 'bg-rose-100 text-rose-700 border-rose-200';
  if (priority === 'High') return 'bg-orange-100 text-orange-700 border-orange-200';
  if (priority === 'Medium') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function statusColorClasses(status) {
  if (status === 'Resolved') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (status === 'In Progress') return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
}

function renderTriagePreview(result) {
  document.getElementById('triage-empty').classList.add('hidden');
  document.getElementById('triage-loading').classList.add('hidden');
  document.getElementById('triage-result').classList.remove('hidden');

  document.getElementById('res-engine').textContent = result.engine;
  document.getElementById('res-category').textContent = result.category;

  const prioEl = document.getElementById('res-priority');
  prioEl.textContent = result.priority;
  prioEl.className = `inline-block text-xs font-extrabold px-2.5 py-0.5 rounded-full border mt-1 ${priorityColorClasses(result.priority)}`;

  document.getElementById('res-score').textContent = `${result.impactScore}/100`;
  const bar = document.getElementById('res-score-bar');
  bar.style.width = `${result.impactScore}%`;
  bar.className = `h-full rounded-full transition-all duration-500 ${
    result.impactScore >= 85 ? 'bg-rose-600' : result.impactScore >= 70 ? 'bg-orange-500' : 'bg-blue-600'
  }`;

  document.getElementById('res-sla').textContent = result.sla;
  document.getElementById('res-department').textContent = result.department;
  document.getElementById('res-reasoning').textContent = result.reasoning;
  document.getElementById('res-action').textContent = result.actionPlan;
}

async function runAITriagePreview() {
  const title = document.getElementById('input-title').value.trim();
  const description = document.getElementById('input-description').value.trim();
  const location = document.getElementById('input-location').value.trim();
  const manualCategory = document.getElementById('input-category').value;

  if (!title || !description) {
    showToast('Enter at least a title and description to analyze.', 'error');
    return null;
  }

  document.getElementById('triage-empty').classList.add('hidden');
  document.getElementById('triage-result').classList.add('hidden');
  document.getElementById('triage-loading').classList.remove('hidden');

  latestTriage = await analyzeComplaintAI(title, description, location || 'Not specified', manualCategory);
  renderTriagePreview(latestTriage);
  return latestTriage;
}

// Form Submit
document.getElementById('issue-form').addEventListener('submit', async e => {
  e.preventDefault();
  const title = document.getElementById('input-title').value.trim();
  const location = document.getElementById('input-location').value.trim();
  const description = document.getElementById('input-description').value.trim();
  const manualCategory = document.getElementById('input-category').value;

  const submitBtn = document.getElementById('btn-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Analyzing & Submitting...';

  const triage = await analyzeComplaintAI(title, description, location, manualCategory);
  renderTriagePreview(triage);

  const issues = getIssues();
  const nextNum = 1045 + issues.length;
  cons
