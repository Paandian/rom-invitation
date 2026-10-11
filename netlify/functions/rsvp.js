// Netlify Function: RSVP Handler
// Storage priority: JSONBin.io -> Netlify Blobs -> in-memory
// Email backup via Resend (optional)

// In-memory fallback (last resort, survives warm invocations only)
let memoryStore = null;

// Environment-driven config (set in Netlify Dashboard > Environment Variables)
function getJSONBinConfig() {
  return {
    binId: process.env.JSONBIN_BIN_ID || '',
    apiKey: process.env.JSONBIN_API_KEY || '',
  };
}

// Read all RSVPs from JSONBin.io
async function jsonBinRead() {
  const { binId, apiKey } = getJSONBinConfig();
  if (!binId || !apiKey) return null;

  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      headers: { 'X-Master-Key': apiKey },
    });
    if (!res.ok) {
      console.warn('JSONBin read failed:', res.status);
      return null;
    }
    const data = await res.json();
    return Array.isArray(data.record) ? data.record : [];
  } catch (err) {
    console.warn('JSONBin read error:', err.message);
    return null;
  }
}

// Write all RSVPs to JSONBin.io
async function jsonBinWrite(rsvps) {
  const { binId, apiKey } = getJSONBinConfig();
  if (!binId || !apiKey) return false;

  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey,
      },
      body: JSON.stringify(rsvps),
    });
    return res.ok;
  } catch (err) {
    console.warn('JSONBin write error:', err.message);
    return false;
  }
}

// Read all RSVPs following the storage priority
async function getRSVPs() {
  // 1. JSONBin.io
  const fromJsonBin = await jsonBinRead();
  if (fromJsonBin) return fromJsonBin;

  // 2. Netlify Blobs
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('rsvp-data');
    const data = await store.get('all', { type: 'json' });
    if (data) return data;
  } catch (err) {
    console.warn('Blobs read failed:', err.message);
  }

  // 3. In-memory
  return memoryStore || [];
}

// Write all RSVPs following the storage priority
async function saveRSVPs(rsvps) {
  // 1. JSONBin.io
  if (await jsonBinWrite(rsvps)) return { ok: true, via: 'jsonbin' };

  // 2. Netlify Blobs
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('rsvp-data');
    await store.setJSON('all', rsvps);
    return { ok: true, via: 'blobs' };
  } catch (err) {
    console.warn('Blobs write failed:', err.message);
  }

  // 3. In-memory
  memoryStore = rsvps;
  return { ok: true, via: 'memory' };
}

// Send an email backup of the RSVP via Resend
async function sendEmailBackup(rsvp) {
  const apiKey = process.env.RESEND_API_KEY || '';
  if (!apiKey) return false;

  const guestText = rsvp.attendance === 'yes' ? `${rsvp.guests} guest(s)` : 'Not attending';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RSVP Backup <onboarding@resend.dev>',
        to: ['m.paandian@gmail.com'],
        subject: `New RSVP: ${rsvp.name} (${guestText})`,
        html: `
          <h2>New RSVP Received</h2>
          <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif">
            <tr><td><strong>Name</strong></td><td>${rsvp.name}</td></tr>
            <tr><td><strong>Email</strong></td><td>${rsvp.email}</td></tr>
            <tr><td><strong>Phone</strong></td><td>${rsvp.phone || '-'}</td></tr>
            <tr><td><strong>Attendance</strong></td><td>${rsvp.attendance === 'yes' ? 'Attending' : 'Not Attending'}</td></tr>
            <tr><td><strong>Guests</strong></td><td>${guestText}</td></tr>
            <tr><td><strong>Message</strong></td><td>${rsvp.message || '-'}</td></tr>
            <tr><td><strong>Submitted</strong></td><td>${rsvp.submittedAt}</td></tr>
            <tr><td><strong>IP</strong></td><td>${rsvp.ip}</td></tr>
            <tr><td><strong>ID</strong></td><td>${rsvp.id}</td></tr>
          </table>
        `,
      }),
    });
    if (!res.ok) console.warn('Resend failed:', res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.warn('Email backup error:', err.message);
    return false;
  }
}

// CORS headers
const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};

function respond(statusCode, bodyObj) {
  return { statusCode, headers: CORS, body: JSON.stringify(bodyObj) };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  try {
    // GET: list all RSVPs
    if (event.httpMethod === 'GET') {
      const rsvps = await getRSVPs();
      return respond(200, { rsvps });
    }

    // POST: create a new RSVP
    if (event.httpMethod === 'POST') {
      let data;
      try {
        data = JSON.parse(event.body);
      } catch {
        return respond(400, { message: 'Invalid JSON' });
      }

      const required = ['name', 'email', 'guests', 'attendance'];
      for (const field of required) {
        if (!data[field]) {
          return respond(400, { message: `Missing required field: ${field}` });
        }
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return respond(400, { message: 'Invalid email format' });
      }

      const rsvp = {
        id: Date.now().toString(),
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        guests: data.guests,
        attendance: data.attendance,
        message: data.message || '',
        submittedAt: new Date().toISOString(),
        ip: event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown',
      };

      // Send email backup first (do not block response too long)
      try {
        await sendEmailBackup(rsvp);
      } catch (err) {
        console.warn('Backup email failed (non-fatal):', err.message);
      }

      // Persist
      const rsvps = await getRSVPs();
      rsvps.push(rsvp);
      await saveRSVPs(rsvps);

      return respond(200, { message: 'RSVP submitted successfully', id: rsvp.id });
    }

    // DELETE: remove an RSVP by id
    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters && event.queryStringParameters.id;
      if (!id) return respond(400, { message: 'Missing RSVP ID' });

      const rsvps = await getRSVPs();
      const filtered = rsvps.filter((r) => r.id !== id);
      if (filtered.length === rsvps.length) {
        return respond(404, { message: 'RSVP not found' });
      }

      await saveRSVPs(filtered);
      return respond(200, { message: 'RSVP deleted successfully' });
    }

    return respond(405, { message: 'Method not allowed' });
  } catch (err) {
    console.error('Unhandled error:', err);
    return respond(500, { message: 'Internal error', error: err.message });
  }
};
