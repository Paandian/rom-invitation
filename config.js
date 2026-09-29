/**
 * ROM Invitation Configuration
 * Edit all wedding details here
 */
const ROM_CONFIG = {
  // Couple Details
  couple: {
    brideName: "Swarnalakshimi Ramesh",
    groomName: "Soorya Senthilkumar",
    fullNames: {
      bride: "Swarnalakshimi Ramesh",
      groom: "Soorya Senthilkumar",
    },
  },

  // Wedding Details
  wedding: {
    date: "2026-10-24", // YYYY-MM-DD format
    time: "19:00", // HH:MM 24-hour format
    timezone: "Asia/Singapore", // IANA timezone
    type: "Engagement Ceremony",
  },

  // Venue Details
  venue: {
    name: "Royal Sungei Ujong Club",
    address: "2A, Jalan Dato Kelana Maamor,",
    city: "70700 Seremban, Negeri Sembilan, Malaysia",
    mapLink: "https://maps.app.goo.gl/RqjC5gvSvZTnLbNh7",
    coordinates: {
      lat: 2.730379833163168,
      lng: 101.9450452865101,
    },
  },

  // Invitation Messages
  messages: {
    invitation:
      "With great happiness, we warmly invite you and your family to join us as we celebrate the Engagement. ",
    signature: "Soorya Senthilkumar & Swarnalakshimi Ramesh",
    closing:
      "It would mean a lot to us to have our dear family and relatives together on this special occasion. We look forward to celebrating this beautiful beginning with your love and blessings.",
  },

  // Photos (add your photo URLs here)
  photos: {
    couple: [
      {
        src: "assets/photos/couple-1.png",
        alt: "Swarna & Soorya together",
        caption: "Our beginning",
      },
      {
        src: "assets/photos/couple-2.png",
        alt: "Swarna & Soorya at engagement",
        caption: "The proposal",
      },
      {
        src: "assets/photos/couple-3.png",
        alt: "Swarna & Soorya candid moment",
        caption: "Everyday magic",
      },
    ],
    bride: [
      {
        src: "assets/photos/bride-1.png",
        alt: "Bride portrait",
        caption: "Radiant",
      },
      {
        src: "assets/photos/bride-2.png",
        alt: "Bride getting ready",
        caption: "Preparation",
      },
    ],
    groom: [
      {
        src: "assets/photos/groom-1.png",
        alt: "Groom portrait",
        caption: "Dashing",
      },
      {
        src: "assets/photos/groom-2.png",
        alt: "Groom getting ready",
        caption: "Ready",
      },
    ],
  },

  // Gallery Images
  gallery: [
    {
      src: "assets/gallery/1.png",
      alt: "Pre-wedding shoot 1",
    },
    {
      src: "assets/gallery/2.png",
      alt: "Pre-wedding shoot 2",
    },
    {
      src: "assets/gallery/3.png",
      alt: "Pre-wedding shoot 3",
    },
    {
      src: "assets/gallery/4.png",
      alt: "Pre-wedding shoot 4",
    },
    {
      src: "assets/gallery/5.png",
      alt: "Pre-wedding shoot 5",
    },
    {
      src: "assets/gallery/6.png",
      alt: "Pre-wedding shoot 6",
    },
  ],

  // Music Settings
  music: {
    defaultTrack: "assets/audio/default-melody.mp3",
    defaultTrackName: "Eternal Love",
    autoPlay: false, // Browsers block autoplay, user interaction required
    volume: 0.4,
  },

  // Visual Customization
  theme: {
    primaryColor: "#D4A574", // Gold
    secondaryColor: "#C9B896", // Light Gold
    darkColor: "#1a1a1a", // Near Black
    lightColor: "#faf9f6", // Off White
    accentColor: "#E8D5B7", // Pale Gold
    fontPrimary: "'Playfair Display', serif",
    fontSecondary: "'Inter', sans-serif",
  },

  // Animation Settings
  animations: {
    enableParticles: true,
    enablePetals: true,
    enableShimmer: true,
    scratchThreshold: 30, // Percentage to auto-reveal
    reducedMotion: false, // Will be auto-detected
  },

  // Social Sharing
  sharing: {
    title: "Soorya Senthilkumar & Swarnalakshimi Ramesh - Engagement Ceremony",
    description: "You are cordially invited to celebrate our union",
    image: "assets/og-preview.png",
    url: "https://merit.edu.my/invitation/",
  },

  // SEO
  seo: {
    title:
      "Soorya Senthilkumar & Swarnalakshimi Ramesh - Engagement Ceremony Invitation",
    description:
      "Join us for the engagement ceremony of Soorya Senthilkumar & Swarnalakshimi Ramesh on 24th October 2026 at Royal Sungei Ujong Club, Seremban, Negeri Sembilan, Malaysia.",
    keywords: "wedding invitation, ROM, engagement, Singapore, Swarna Soorya",
  },
};

// Export for modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = ROM_CONFIG;
}

// Make available globally
window.ROM_CONFIG = ROM_CONFIG;
