# RSVP System Setup Guide

## Overview
The RSVP system includes:
1. **Frontend Form** - Embedded in the invitation page
2. **Netlify Function** - Handles form submissions (`netlify/functions/rsvp.js`)
3. **Admin Dashboard** - Password-protected page (`admin.html`) to view RSVPs

---

## Quick Setup (Netlify)

### 1. Deploy to Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login and deploy
netlify login
netlify init
netlify deploy --prod
```

### 2. Configure Netlify Functions
The function is already at `netlify/functions/rsvp.js`. Netlify will automatically deploy it.

**Note:** The function stores RSVPs in a JSON file at `data/rsvp.json`. This works for low-traffic sites. For production, consider using a database (FaunaDB, MongoDB, etc.).

### 3. Set Admin Password
Edit `admin.html` and change:
```javascript
const ADMIN_PASSWORD = 'your-secret-password-here';
```
**Important:** Use a strong, unique password!

### 4. Access Admin Dashboard
Visit: `https://your-site.netlify.app/admin.html`

---

## Alternative: Client-Side Only (No Backend)

If you can't use Netlify Functions, the form will fall back to storing data in the browser's `localStorage`. The admin dashboard will still work but **only on the same browser/device** where RSVPs were submitted.

To enable this fallback, the code already handles it automatically.

---

## File Structure
```
rom-invitation/
├── index.html              # Main invitation (with RSVP section)
├── admin.html              # Admin dashboard (password protected)
├── styles.css              # Includes RSVP styles
├── app.js                  # Includes RSVP form handling
├── netlify/
│   └── functions/
│       └── rsvp.js         # Netlify Function for RSVP submissions
└── data/                   # Created automatically
    └── rsvp.json           # Stored RSVPs (Netlify Functions)
```

---

## RSVP Form Fields

| Field | Type | Required |
|-------|------|----------|
| Full Name | Text | Yes |
| Email | Email | Yes |
| Phone | Tel | No |
| Number of Guests | Select (1-5+) | Yes |
| Attendance | Radio (Yes/No) | Yes |
| Message | Textarea | No |

---

## Admin Dashboard Features

- **Statistics Cards**: Total RSVPs, Attending, Not Attending, Total Guests
- **Filter Buttons**: All / Attending / Not Attending
- **Data Table**: Date, Name, Email, Phone, Guests, Attendance, Message
- **Responsive**: Works on mobile and desktop
- **Logout**: Secure session management

---

## Customization

### Change Admin Password
Edit `admin.html`:
```javascript
const ADMIN_PASSWORD = 'your-new-secure-password';
```

### Add More Form Fields
1. Add field to `index.html` form
2. Update `app.js` form validation
3. Update `netlify/functions/rsvp.js` validation
4. Add column to `admin.html` table

### Use a Database (Production)
Replace the file-based storage in `netlify/functions/rsvp.js` with:
- **FaunaDB**: `npm install faunadb`
- **MongoDB**: `npm install mongodb`
- **Airtable**: `npm install airtable`
- **Google Sheets**: `npm install google-spreadsheet`

---

## Testing Locally

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run locally with functions
netlify dev

# Access at http://localhost:8888
# Admin at http://localhost:8888/admin.html
```

---

## Security Notes

1. **Change the default password** in `admin.html` before deploying!
2. **Use HTTPS** (Netlify provides this automatically)
3. **Rate limiting**: Consider adding rate limiting to the Netlify Function
3. **CORS**: The function allows all origins - restrict if needed
4. **Input sanitization**: The admin dashboard escapes HTML output

---

## Troubleshooting

**Form not submitting?**
- Check browser console for errors
- Verify Netlify Function deployed: `https://your-site.netlify.app/.netlify/functions/rsvp`

**Admin dashboard empty?**
- Check if `localStorage` has data (client-side fallback)
- Verify Netlify Function returns data: `/.netlify/functions/rsvp` (GET)

**Can't login to admin?**
- Verify password in `admin.html` matches what you're entering
- Clear sessionStorage: `sessionStorage.clear()`

---

## License
MIT - Feel free to use for your wedding!