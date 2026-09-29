# Engagement Invitation - Cinematic Digital Wedding Invitation

A premium, mobile-first digital Engagement Ceremony invitation website with cinematic animations, golden shine effects, and interactive elements.

## Features

- 🎭 **Elegant Opening Cover** - Envelope opening animation with wax seal
- ✨ **Premium Golden Shine Effect** - Animated shimmer across the cover
- 💍 **Couple Name Section** - Elegant typography with animated ampersand
- 💌 **Emotional Invitation Message** - Beautifully styled message card
- 📜 **Smooth Scroll Indicator** - Animated scroll hint
- 🎨 **Scratch-to-Reveal Date** - Interactive scratch card revealing wedding details
- 🌸 **Flower/Petal Pop Effect** - Celebration animation after reveal
- ⏰ **Countdown Timer** - Real-time countdown to the wedding
- 📸 **Couple Photo Sections** - Grid layout with hover effects
- 🖼️ **Gallery Section** - Masonry-style gallery with lightbox
- 📍 **Venue/Location Section** - With Google Maps integration
- 🎵 **Background Music** - Default melody + custom upload from device
- ✨ **Smooth Scrolling Animations** - Intersection Observer based reveals
- 🎨 **Premium Typography** - Playfair Display + Inter font pairing
- 📱 **Mobile Responsive Design** - Optimized for Android & iPhone
- ⚡ **Fast Loading** - Optimized assets and lazy loading
- 📱 **WhatsApp-Friendly Sharing** - Open Graph meta tags for rich previews

## Project Structure

```
rom-invitation/
├── index.html          # Main HTML structure
├── styles.css          # All styles and animations
├── app.js              # Main application logic
├── config.js           # Editable configuration (EDIT THIS)
├── manifest.json       # PWA manifest
├── assets/
│   ├── og-preview.svg  # WhatsApp/social sharing preview
│   ├── icon-*.svg      # PWA icons
│   ├── photos/         # Couple photos (add your images)
│   ├── gallery/        # Gallery images (add your images)
│   └── audio/          # Audio files (optional)
└── fonts/              # Font files (optional, uses CDN by default)
```

## Quick Start

1. **Edit `config.js`** with your wedding details (see Configuration section below)
2. **Add your photos** to `assets/photos/` and `assets/gallery/`
3. **Add your music** to `assets/audio/` (optional)
4. **Open `index.html`** in a browser to test
5. **Deploy** to any static hosting (Netlify, Vercel, GitHub Pages, etc.)

## Configuration

Edit `config.js` to customize all content:

```javascript
const ROM_CONFIG = {
    couple: {
        brideName: "Aisha",
        groomName: "Rahul",
        fullNames: {
            bride: "Aisha Rahman",
            groom: "Rahul Sharma"
        }
    },

    wedding: {
        date: "2026-09-16",           // YYYY-MM-DD
        time: "10:30",                // HH:MM (24-hour)
        timezone: "Asia/Singapore",   // IANA timezone
        type: "Engagement Ceremony"
    },

    venue: {
        name: "Royal Sungei Ujong Club",
        address: "2A, Jalan Dato Kelana Maamor,",
        city: "70700 Seremban, Negeri Sembilan, Malaysia",
        mapLink: "https://maps.app.goo.gl/...",
        coordinates: { lat: 1.2994, lng: 103.8608 }
    },

    messages: {
        invitation: "With hearts full of love and gratitude, we invite you to witness the beginning of our forever.",
        signature: "Swarna & Soorya",
        closing: "Your presence is the greatest gift. We look forward to celebrating with you."
    },

    photos: {
        couple: [
            { src: "assets/photos/couple-1.jpg", alt: "Aisha and Rahul", caption: "Our beginning" },
            // Add more...
        ],
        bride: [...],
        groom: [...]
    },

    gallery: [
        { src: "assets/gallery/1.jpg", alt: "Pre-wedding shoot 1" },
        // Add more...
    ],

    music: {
        defaultTrack: "assets/audio/default-melody.mp3",
        defaultTrackName: "Eternal Love",
        autoPlay: false,
        volume: 0.4
    },

    theme: {
        primaryColor: "#D4A574",    // Gold
        secondaryColor: "#C9B896",  // Light Gold
        darkColor: "#1a1a1a",       // Near Black
        lightColor: "#faf9f6",      // Off White
        accentColor: "#E8D5B7",     // Pale Gold
        fontPrimary: "'Playfair Display', serif",
        fontSecondary: "'Inter', sans-serif"
    },

    sharing: {
        title: "Swarna & Soorya - Engagement Ceremony",
        description: "You are cordially invited to celebrate our union",
        image: "assets/og-preview.jpg",
        url: "https://your-domain.com"
    }
};
```

## Adding Photos

1. Place your images in the appropriate folders:
   - `assets/photos/couple/` - Couple photos
   - `assets/photos/bride/` - Bride photos
   - `assets/photos/groom/` - Groom photos
   - `assets/gallery/` - Gallery images

2. Update the paths in `config.js` to match your filenames

3. Recommended sizes:
   - Couple photos: 800x1000px (4:5 ratio)
   - Gallery images: 600x600px (1:1 ratio)
   - OG preview: 1200x630px (1.91:1 ratio)

## Adding Music

1. Place your audio file in `assets/audio/` (MP3 recommended)
2. Update `config.js` music section:
   ```javascript
   music: {
       defaultTrack: "assets/audio/your-song.mp3",
       defaultTrackName: "Your Song Title",
       volume: 0.4
   }
   ```
3. Users can also upload their own music from their device

## Customizing Colors

Edit the `theme` section in `config.js`:

```javascript
theme: {
    primaryColor: "#D4A574",    // Main gold color
    secondaryColor: "#C9B896",  // Lighter gold
    darkColor: "#1a1a1a",       // Dark background
    lightColor: "#faf9f6",      // Light background
    accentColor: "#E8D5B7",     // Accent gold
    fontPrimary: "'Playfair Display', serif",
    fontSecondary: "'Inter', sans-serif"
}
```

## Deployment

### Netlify (Recommended)

1. Push to GitHub
2. Connect repository to Netlify
3. Build command: (none)
4. Publish directory: `.` (root)

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Framework: Other
4. Output directory: `.`

### GitHub Pages

1. Push to GitHub
2. Settings > Pages > Deploy from branch
3. Select `main` branch, `/ (root)` folder

### Any Static Host

Upload all files to your web server.

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+
- Mobile Safari (iOS 14+)
- Chrome for Android

## Performance Features

- Lazy loading for images
- Preloading critical assets
- Optimized CSS animations (transform/opacity only)
- Intersection Observer for scroll animations
- Minimal JavaScript bundle
- No external dependencies (except Google Fonts)

## Accessibility

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Focus indicators
- Reduced motion support
- High contrast mode support
- Screen reader friendly

## Customization Tips

### Change Fonts

Update `theme.fontPrimary` and `theme.fontSecondary` in config.js, and add `@font-face` declarations in styles.css if using self-hosted fonts.

### Add More Sections

Add new `<section>` elements in index.html following the existing pattern, then add corresponding styles in styles.css.

### Modify Animations

Adjust animation durations in CSS custom properties:

```css
:root {
  --transition-slow: 500ms;
  --transition-slower: 800ms;
  --transition-bounce: 600ms;
}
```

### Change Scratch Threshold

In config.js:

```javascript
animations: {
    scratchThreshold: 30,  // Percentage (0-100)
    ...
}
```

## Troubleshooting

### Music doesn't auto-play

Browsers block auto-play. Users must interact first (tap envelope, click play button).

### Images not loading

Check file paths in config.js match actual filenames (case-sensitive on Linux servers).

### Sharing preview not showing

Deploy to HTTPS domain, then test with WhatsApp. Facebook/Meta caches OG tags - use their Sharing Debugger to refresh.

### Countdown shows wrong time

Ensure `wedding.timezone` matches your venue's IANA timezone (e.g., "Asia/Singapore", "America/New_York").

## License

MIT License - Feel free to use for your own wedding!

## Credits

- Fonts: Playfair Display & Inter (Google Fonts)
- Icons: Custom SVG
- Inspiration: Premium wedding invitation designs

---

**Made with love for Aisha & Rahul** 💍
