// Netlify Function: RSVP Handler with reliable JSONBin.io primary + Netlify Blobs fallback

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};

// JSONBin.io Configuration (FREE at jsonbin.io)
const JSONBIN_CONFIG = {
  binId: process.env.JSONBIN_BIN_ID || '',      // Set in Netlify env vars
  apiKey: process.env.JSONBIN_API_KEY || '',    // Set in Netlify env vars
  baseUrl: 'https://api.jsonbin.io/v3/b'
};

// In-memory fallback (last resort)
let memoryStore = null;

async function getBlobsStore() {
  try {
    const { getStore } = await import('@netlify/blobs');
    return getStore('rsvp-data');
  } catch (err) {
    console.warn('Netlify Blobs not available:', err.message);
    return null;
  }
}

async function fetchFromJSONBin() {
  if (!JSONBIN_CONFIG.binId || !JSONBIN_CONFIG.apiKey) return null;
  
  try {
    const response = await fetch(`${JSONBIN_CONFIG.baseUrl}/${JSONBIN_CONFIG.binId}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_CONFIG.apiKey }
    });
    if (response.ok) {
      const data = await response.json();
      return data.record || [];
    }
  } catch (err) {
    console.warn('JSONBin GET failed:', err.message);
  }
  return null;
}

async function saveToJSONBin(rsvps) {
  if (!JSONBIN_CONFIG.binId || !JSONBIN_CONFIG.apiKey) return false;
  
  try {
    const response = await fetch(`${JSONBIN_CONFIG.baseUrl}/${JSONBIN_CONFIG.binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_CONFIG.apiKey
      },
      body: JSON.stringify(rsvps)
    });
    return response.ok;
  } catch (err) {
    console.error('JSONBin SET failed:', err.message);
    return false;
  }
}

// In-memory fallback
let memoryStore = null;

async function safeGetRSVPs() {
  // 1. Try JSONBin.io (primary - reliable external storage)
  const jsonBinData = await fetchFromJSONBin();
  if (jsonBinData) return jsonBinData;
  
  // 2. Try Netlify Blobs
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('rsvp-data');
    const data = await store.get('all', { type: 'json' });
    if (data) return data;
  } catch (err) {
    console.warn('Blobs GET failed:', err.message);
  }
  
  // 3. In-memory fallback
  return memoryStore || [];
}

async function safeSetRSVPs(rsvps) {
  // 1. Try JSONBin.io (primary)
  const saved = await saveToJSONBin(rsvps);
  if (saved) return true;
  
  // 2. Try Netlify Blobs
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('rsvp-data');
    await store.setJSON('all', rsvps);
    return true;
  } catch (err) {
    console.warn('Blobs SET failed:', err.message);
  }
  
  // 3. In-memory fallback
  memoryStore = rsvps;
  return true;
}

async function safeDeleteRSVP(id) {
  const rsvps = await getAllRSVPs();
  const filtered = rsvps.filter(r => r.id !== id);
  return await saveAllRSVPs(filtered);
}

async function getAllRSVPs() {
  // Same priority: JSONBin → Blobs → Memory
  const jsonBinData = await fetchFromJSONBin();
  if (jsonBinData) return jsonBinData;
  
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('rsvp-data');
    return await store.get('all', { type: 'json' }) || [];
  } catch {}
  
  return memoryStore || [];
}

async function saveAllRSVPs(rsvps) {
  // Try JSONBin first
  if (await saveToJSONBin(rsvps)) return true;
  
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('rsvp-data');
    await store.setJSON('all', rsvps);
    return true;
  } catch {}
  
  memoryStore = rsvps;
  return true;
}

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};

exports.handler = async (event, context) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }
  
  if (event.httpMethod === 'POST') {
    let data;
    try { data = JSON.parse(event.body); } 
    catch { return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: 'Invalid JSON' }) }; }
    
    const required = ['name', 'email', 'guests', 'attendance'];
    for (const field of required) {
      if (!data[field]) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: `Missing required field: ${field}` }) };
      }
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: 'Invalid email format' }) };
    }
    
    const rsvp = {
      id: Date.now().toString(),
      ...data,
      submittedAt: new Date().toISOString(),
      ip: event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown'
    };
    
    const rsvps = await getAllRSVPs();
    rsvps.push(rsvp);
    await saveAllRSVPs(rsvps);
    
    return { 
      statusCode: 200, 
      headers: corsHeaders,
      body: JSON.stringify({ message: 'RSVP submitted successfully', id: rsvp.id }) 
    };
  }
  
  if (event.httpMethod === 'GET') {
    const rsvps = await getAllRSVPs();
    return { 
      statusCode: 200, 
      headers: corsHeaders,
      body: JSON.stringify({ rsvps }) 
    };
  }
  
  if (event.httpMethod === 'DELETE') {
    const id = event.queryStringParameters?.id;
    if (!id) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: 'Missing RSVP ID' }) };
    }
    
    const rsvps = await getAllRSVPs();
    const filtered = rsvps.filter(r => r.id !== id);
    if (filtered.length === rsvps.length) {
      return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ message: 'RSVP not found' }) };
    }
    
    await saveAllRSVPs(filtered);
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ message: 'RSVP deleted successfully' }) };
  }
  
  return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ message: 'Method not allowed' }) };
};