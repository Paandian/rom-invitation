import { getStore } from '@netlify/blobs';

exports.handler = async (event, context) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };
  
  // Initialize store with error handling
  let store;
  try {
    store = getStore('rsvp-data');
  } catch (err) {
    console.error('Blobs store init failed:', err);
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        message: 'Storage service temporarily unavailable. Please try again in a moment.',
        retry: true
      })
    };
  }
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }
  
  // Helper: safely read from Blobs with fallback
  async function safeGetRSVPs() {
    try {
      return await store.get('all', { type: 'json' }) || [];
    } catch (err) {
      console.warn('Blobs GET failed, using empty array:', err.message);
      return [];
    }
  }
  
  // Helper: safely write to Blobs
  async function safeSetRSVPs(rsvps) {
    try {
      await store.setJSON('all', rsvps);
      return true;
    } catch (err) {
      console.error('Blobs SET failed:', err);
      return false;
    }
  }
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }
  
  if (event.httpMethod === 'POST') {
    let data;
    try { 
      data = JSON.parse(event.body); 
    } catch { 
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: 'Invalid JSON' }) };
    }
    
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
    
    const rsvps = await safeGetRSVPs();
    rsvps.push(rsvp);
    const saved = await safeSetRSVPs(rsvps);
    
    if (!saved) {
      return { statusCode: 503, headers: corsHeaders, body: JSON.stringify({ message: 'Storage temporarily unavailable. Please try again.', retry: true }) };
    }
    
    return { 
      statusCode: 200, 
      headers: corsHeaders,
      body: JSON.stringify({ message: 'RSVP submitted successfully', id: rsvp.id }) 
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
  
  return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ message: 'Method not allowed' }) };
};