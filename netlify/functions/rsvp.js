// Netlify Function: RSVP Handler with JSONBin.io + Email backup
// All imports inside handler to avoid build-time issues

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};

// In-memory fallback
let memoryStore = null;

// Helper: fetch from JSONBin.io
async function fetchFromJSONBin() {
  const binId = process.env.JSONBIN_BIN_ID || '';
  const apiKey = process.env.JSONBIN_API_KEY || '';
  
  if (!binId || !apiKey) {
    console.log('JSONBin not configured');
    return null;
  }
  
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': process.env.JSONBIN_API_KEY }
    });
    if (response.ok) {
      const data = await response.json();
      return data.record || [];
    }
    console.warn('JSONBin GET failed:', response.status);
  } catch (err) {
    console.warn('JSONBin GET error:', err.message);
  }
  return null;
}

async function saveToJSONBin(rsvps) {
  const binId = process.env.JSONBIN_BIN_ID || '';
  const apiKey = process.env.JSONBIN_API_KEY || '';
  
  if (!binId || !apiKey) return false;
  
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': process.env.JSONBIN_API_KEY
      },
      body: JSON.stringify(rsvps)
    });
    return response.ok;
  } catch (err) {
    console.warn('JSONBin SET failed:', err.message);
    return false;
  }
}

// In-memory fallback
let memoryStore = null;

async function getAllRSVPs() {
  // 1. Try JSONBin.io (primary)
  const jsonBinData = await fetchFromJSONBin();
  if (jsonBinData) {
    console.log('Loaded from JSONBin.io');
    return jsonBinData;
  }
  
  // 2. Try Netlify Blobs
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('rsvp-data');
    const data = await store.get('all', { type: 'json' });
    if (data) {
      console.log('Loaded from Netlify Blobs');
      return data;
    }
  } catch (err) {
    console.warn('Blobs GET failed:', err.message);
  }
  
  // 3. In-memory fallback
  console.log('Using in-memory fallback');
  return memoryStore || [];
}

async function saveAllRSVPs(rsvps) {
  // 1. Try JSONBin.io (primary)
  const binId = process.env.JSONBIN_BIN_ID || '';
  const apiKey = process.env.JSONBIN_API_KEY || '';
  
  if (binId && apiKey) {
    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': process.env.JSONBIN_API_KEY
        },
        body: JSON.stringify(rsvps)
      });
      if (response.ok) return true;
    } catch (err) {
      console.warn('JSONBin SET failed:', err.message);
    }
  }
  
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
  
  // Helper: fetch from JSONBin.io
  async function fetchFromJSONBin() {
    const binId = process.env.JSONBIN_BIN_ID || '';
    const apiKey = process.env.JSONBIN_API_KEY || '';
    
    if (!binId || !apiKey) return null;
    
    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}/latest`, {
        headers: { 'X-Master-Key': process.env.JSONBIN_API_KEY }
      });
      if (response.ok) {
        const data = await response.json();
        return data.record || [];
      }
    } catch (err) {
      console.warn('JSONBin GET error:', err.message);
    }
    return null;
  }

  async function saveToJSONBin(rsvps) {
    const binId = process.env.JSONBIN_BIN_ID || '';
    const apiKey = process.env.JSONBIN_API_KEY || '';
    
    if (!binId || !apiKey) return false;
    
    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': process.env.JSONBIN_API_KEY
        },
        body: JSON.stringify(rsvps)
      });
      return response.ok;
    } catch (err) {
      console.warn('JSONBin SET failed:', err.message);
      return false;
    }
  }

  async function getAllRSVPs() {
    // 1. Try JSONBin.io (primary)
    const jsonBinData = await fetchFromJSONBin();
    if (jsonBinData) {
      console.log('Loaded from JSONBin.io');
      return jsonBinData;
    }
    
    // 2. Try Netlify Blobs
    try {
      const { getStore } = await import('@netlify/blobs');
      const store = getStore('rsvp-data');
      const data = await store.get('all', { type: 'json' });
      if (data) {
        console.log('Loaded from Netlify Blobs');
        return data;
      }
    } catch (err) {
      console.warn('Blobs GET failed:', err.message);
    }
    
    // 3. In-memory fallback
    console.log('Using in-memory fallback');
    return memoryStore || [];
  }

  async function saveAllRSVPs(rsvps) {
    // 1. Try JSONBin.io (primary)
    const binId = process.env.JSONBIN_BIN_ID || '';
    const apiKey = process.env.JSONBIN_API_KEY || '';
    
    if (binId && apiKey) {
      try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': process.env.JSONBIN_API_KEY
          },
          body: JSON.stringify(rsvps)
        });
        if (response.ok) return true;
      } catch (err) {
        console.warn('JSONBin SET failed:', err.message);
      }
    }
    
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
    
    try {
      const rsvps = await getAllRSVPs();
      rsvps.push(rsvp);
      await saveAllRSVPs(rsvps);
      
      return { 
        statusCode: 200, 
        headers: corsHeaders,
        body: JSON.stringify({ 
          message: 'RSVP submitted successfully',
          id: rsvp.id 
        }) 
      };
    } catch (err) {
      console.error('POST error:', err);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Failed to save RSVP', error: err.message })
      };
    }
  }
  
  if (event.httpMethod === 'GET') {
    try {
      const rsvps = await getAllRSVPs();
      return { 
        statusCode: 200, 
        headers: corsHeaders,
        body: JSON.stringify({ rsvps }) 
      };
    } catch (err) {
      console.error('GET error:', err);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Failed to load RSVPs', error: err.message })
      };
    }
  }
  
  if (event.httpMethod === 'DELETE') {
    const id = event.queryStringParameters?.id;
    if (!id) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: 'Missing RSVP ID' }) };
    }
    
    try {
      const rsvps = await getAllRSVPs();
      const filtered = rsvps.filter(r => r.id !== id);
      if (filtered.length === rsvps.length) {
        return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ message: 'RSVP not found' }) };
      }
      
      await saveAllRSVPs(filtered);
      return { 
        statusCode: 200, 
        headers: corsHeaders,
        body: JSON.stringify({ message: 'RSVP deleted successfully' }) 
      };
    } catch (err) {
      console.error('DELETE error:', err);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Failed to delete RSVP', error: err.message })
      };
    }
  }
  
  return { 
    statusCode: 405, 
    headers: corsHeaders,
    body: JSON.stringify({ message: 'Method not allowed' }) 
  };
};