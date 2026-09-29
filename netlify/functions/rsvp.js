// Netlify Function: RSVP Handler with graceful fallback
// Uses Netlify Blobs (primary) with in-memory fallback

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};

// In-memory fallback (works for session, not persistent across cold starts)
let memoryStore = null;

async function getStore() {
  // Try Netlify Blobs first (dynamic import to avoid build-time issues)
  try {
    const { getStore } = await import('@netlify/blobs');
    return getStore('rsvp-data');
  } catch (err) {
    console.warn('Netlify Blobs not available, using in-memory fallback:', err.message);
    return null;
  }
}

async function safeGetRSVPs(store) {
  if (store) {
    try {
      return await store.get('all', { type: 'json' }) || [];
    } catch (err) {
      console.warn('Blobs GET failed:', err.message);
    }
  }
  // Fallback to in-memory
  return memoryStore || [];
}

async function safeSetRSVPs(store, rsvps) {
  if (store) {
    try {
      await store.setJSON('all', rsvps);
      return true;
    } catch (err) {
      console.warn('Blobs SET failed:', err.message);
    }
  }
  // Fallback to in-memory
  memoryStore = rsvps;
  return true;
}

async function safeDeleteRSVP(store, id) {
  if (store) {
    try {
      const rsvps = await store.get('all', { type: 'json' }) || [];
      const filtered = rsvps.filter(r => r.id !== id);
      await store.setJSON('all', filtered);
      return true;
    } catch (err) {
      console.warn('Blobs DELETE failed:', err.message);
    }
  }
  // Fallback to in-memory
  memoryStore = (memoryStore || []).filter(r => r.id !== id);
  return true;
}

exports.handler = async (event, context) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };
  
  // Initialize store with dynamic import (avoids build-time issues)
  let store;
  try {
    const { getStore } = await import('@netlify/blobs');
    store = getStore('rsvp-data');
  } catch (err) {
    console.warn('Netlify Blobs not available, using in-memory fallback:', err.message);
  }
  
  async function safeGetRSVPs() {
    if (store) {
      try {
        return await store.get('all', { type: 'json' }) || [];
      } catch (err) {
        console.warn('Blobs GET failed:', err.message);
      }
    }
    // Fallback to in-memory
    return memoryStore || [];
  }
  
  async function safeSetRSVPs(rsvps) {
    if (store) {
      try {
        await store.setJSON('all', rsvps);
        return true;
      } catch (err) {
        console.warn('Blobs SET failed:', err.message);
      }
    }
    // Fallback to in-memory
    memoryStore = rsvps;
    return true;
  }
  
  async function safeDeleteRSVP(id) {
    if (store) {
      try {
        const rsvps = await store.get('all', { type: 'json' }) || [];
        const filtered = rsvps.filter(r => r.id !== id);
        await store.setJSON('all', filtered);
        return true;
      } catch (err) {
        console.warn('Blobs DELETE failed:', err.message);
      }
    }
    // Fallback to in-memory
    memoryStore = (memoryStore || []).filter(r => r.id !== id);
    return true;
  }
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }
  
  if (event.httpMethod === 'POST') {
    let data;
    try { 
      data = JSON.parse(event.body); 
    } catch { 
      return { 
        statusCode: 400, 
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Invalid JSON' }) 
      };
    }
    
    const required = ['name', 'email', 'guests', 'attendance'];
    for (const field of required) {
      if (!data[field]) {
        return { 
          statusCode: 400, 
          headers: corsHeaders,
          body: JSON.stringify({ message: `Missing required field: ${field}` }) 
        };
      }
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { 
        statusCode: 400, 
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Invalid email format' }) 
      };
    }
    
    const rsvp = {
      id: Date.now().toString(),
      ...data,
      submittedAt: new Date().toISOString(),
      ip: event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown'
    };
    
    const rsvps = await safeGetRSVPs();
    rsvps.push(rsvp);
    const saved = await safeSetRSVPs(rsvps);
    
    return { 
      statusCode: 200, 
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: 'RSVP submitted successfully',
        id: rsvp.id 
      }) 
    };
  }
  
  if (event.httpMethod === 'GET') {
    const rsvps = await safeGetRSVPs();
    return { 
      statusCode: 200, 
      headers: corsHeaders,
      body: JSON.stringify({ rsvps }) 
    };
  }
  
  if (event.httpMethod === 'DELETE') {
    const id = event.queryStringParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Missing RSVP ID' })
      };
    }
    
    const deleted = await safeDeleteRSVP(id);
    if (!deleted) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'RSVP not found' })
      };
    }
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'RSVP deleted successfully' })
    };
  }
  
  return { 
    statusCode: 405, 
    headers: corsHeaders,
    body: JSON.stringify({ message: 'Method not allowed' }) 
  };
};