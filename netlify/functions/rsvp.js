// Netlify Function: RSVP Handler with JSONBin.io primary + email backup

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};

// Environment variables (set in Netlify Dashboard)
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID || '';
const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const ADMIN_EMAIL = 'm.paandian@gmail.com';

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
    const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_API_KEY }
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
    const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_API_KEY
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
  if (await saveToJSONBin(rsvps)) {
    console.log('Saved to JSONBin.io');
    return true;
  }
  
  // 2. Try Netlify Blobs
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('rsvp-data');
    await store.setJSON('all', rsvps);
    console.log('Saved to Netlify Blobs');
    return true;
  } catch (err) {
    console.warn('Blobs SET failed:', err.message);
  }
  
  // 3. In-memory fallback
  memoryStore = rsvps;
  console.log('Saved to memory fallback');
  return true;
}

async function sendEmailBackup(rsvp) {
  const apiKey = process.env.RESEND_API_KEY || '';
  if (!apiKey) {
    console.log('RESEND_API_KEY not set, skipping email backup');
    return false;
  }
  
  try {
    const guestText = rsvp.attendance === 'yes' ? `${rsvp.guests} guest(s)` : 'Not attending';
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'RSVP <onboarding@resend.dev>',
        to: 'm.paandian@gmail.com',
        subject: `New RSVP: ${data.name} - ${guestText}`,
        html: `
          <h2>New RSVP Received</h2>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Phone:</strong> ${data.phone || 'Not provided'}</p>
          <p><strong>Guests:</strong> ${guestText}</p>
          <p><strong>Attendance:</strong> ${data.attendance === 'yes' ? 'Attending' : 'Not Attending'}</p>
          <p><strong>Message:</strong> ${data.message || 'None'}</p>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>IP:</strong> ${event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown'}</p>
          <hr>
          <p><small>RSVP ID: ${Date.now().toString()}</small></p>
        `
      })
    });
    return response.ok;
  } catch (err) {
    console.warn('Email backup failed:', err.message);
    return false;
  }
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
  
  // Helper: Get all RSVPs from storage
  async function getAllRSVPs() {
    // Try JSONBin.io first
    const binId = process.env.JSONBIN_BIN_ID || '';
    const apiKey = process.env.JSONBIN_API_KEY || '';
    
    if (binId && apiKey) {
      try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}/latest`, {
          headers: { 'X-Master-Key': process.env.JSONBIN_API_KEY }
        });
        if (response.ok) {
          const data = await response.json();
          return data.record || [];
        }
      } catch (err) {
        console.warn('JSONBin GET failed:', err.message);
      }
    }
    
    // Try Netlify Blobs
    try {
      const { getStore } = await import('@netlify/blobs');
      const store = getStore('rsvp-data');
      const data = await store.get('all', { type: 'json' });
      if (data) return data;
    } catch (err) {
      console.warn('Blobs GET failed:', err.message);
    }
    
    // In-memory fallback
    return [];
  }
  
  async function saveAllRSVPs(rsvps) {
    // Try JSONBin first
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
    
    // Try Netlify Blobs
    try {
      const { getStore } = await import('@netlify/blobs');
      const store = getStore('rsvp-data');
      await store.setJSON('all', rsvps);
      return true;
    } catch (err) {
      console.warn('Blobs SET failed:', err.message);
    }
    
    return false;
  }
  
  // Email backup
  async function sendEmailBackup(rsvp) {
    const apiKey = process.env.RESEND_API_KEY || '';
    if (!apiKey) {
      console.log('RESEND_API_KEY not set, skipping email backup');
      return;
    }
    
    try {
      const guestText = rsvp.attendance === 'yes' ? `${rsvp.guests} guest(s)` : 'Not attending';
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'RSVP <onboarding@resend.dev>',
          to: 'm.paandian@gmail.com',
          subject: `New RSVP: ${rsvp.name} - ${guestText}`,
          html: `
            <h2>New RSVP Received (Backup)</h2>
            <p><strong>Name:</strong> ${rsvp.name}</p>
            <p><strong>Email:</strong> ${rsvp.email}</p>
            <p><strong>Phone:</strong> ${rsvp.phone || 'Not provided'}</p>
            <p><strong>Guests:</strong> ${guestText}</p>
            <p><strong>Attendance:</strong> ${rsvp.attendance === 'yes' ? 'Attending' : 'Not Attending'}</p>
            <p><strong>Message:</strong> ${rsvp.message || 'None'}</p>
            <p><strong>Submitted:</strong> ${new Date(rsvp.submittedAt).toLocaleString()}</p>
            <p><strong>IP:</strong> ${rsvp.ip}</p>
            <hr>
            <p><small>RSVP ID: ${rsvp.id}</small></p>
          `
        })
      });
      console.log('Email backup sent:', response.ok);
    } catch (err) {
      console.warn('Email backup failed:', err.message);
    }
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
      
      // Save to storage
      await saveAllRSVPs(rsvps);
      
      // Send email backup (async, don't wait)
      sendEmailBackup(rsvp).catch(console.error);
      
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

// Helper: fetch from JSONBin.io
async function fetchFromJSONBin() {
  const binId = process.env.JSONBIN_BIN_ID || '';
  const apiKey = process.env.JSONBIN_API_KEY || '';
  
  if (!binId || !apiKey) return null;
  
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_API_KEY }
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
    const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_API_KEY
      },
      body: JSON.stringify(rsvps)
    });
    return response.ok;
  } catch (err) {
    console.warn('JSONBin SET failed:', err.message);
    return false;
  }
}