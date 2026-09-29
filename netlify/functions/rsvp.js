import { getStore } from '@netlify/blobs';

exports.handler = async (event, context) => {
  const store = getStore('rsvp-data');
  
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    
    // Validate required fields
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
    
    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { 
        statusCode: 400, 
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Invalid email format' }) 
      };
    }
    
    // Add metadata
    const rsvp = {
      id: Date.now().toString(),
      ...data,
      submittedAt: new Date().toISOString(),
      ip: event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown'
    };
    
    // Read existing, add new, save to Blobs
    const rsvps = await store.get('all', { type: 'json' }) || [];
    rsvps.push(rsvp);
    await store.setJSON('all', rsvps);
    
    // Return success
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
    const rsvps = await store.get('all', { type: 'json' }) || [];
    return { 
      statusCode: 200, 
      headers: corsHeaders,
      body: JSON.stringify({ rsvps }) 
    };
  }
  
  return { 
    statusCode: 405, 
    headers: corsHeaders,
    body: JSON.stringify({ message: 'Method not allowed' }) 
  };
};