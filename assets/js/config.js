/* ============================================================================
   CONFIG — This is the ONLY file you need to edit.
   Everything on the site reads from here.
   ========================================================================= */

window.CONFIG = {

  /* ---------------------------------------------------------------------
     1. WHO YOU ARE
     ------------------------------------------------------------------ */
  identity: {
    name:      "16k_Caden",
    handle:    "@16k_Caden",
    role:      "Roblox Luau Developer",
    // Anything between *asterisks* gets the green-to-cyan gradient.
    headline:  "I build and script Roblox games. *14 of them are live.*",
    subline:   "I write the Luau behind gameplay, shops, saves and anti-exploit.",
    available: true,
    availableText:   "Open for work",
    unavailableText: "Booked",
    location:  "GMT+1 · remote",
    yearsExperience: 4,
  },

  /* ---------------------------------------------------------------------
     2. CONTACT  (used by the Contact tab + every CTA on the site)
     ------------------------------------------------------------------ */
  contact: {
    discord:       "caden._.arabic",
    discordServer: "",                          // optional invite URL
    x:             "Caden__Pro",
    email:         "",                          // leave "" to hide
    responseTime:  "I usually reply within a few hours.",
  },

  /* ---------------------------------------------------------------------
     3. ABOUT TAB
     ------------------------------------------------------------------ */
  about: {
    bio: [
      "I've been scripting Roblox games for 4 years. Most of my work is the part players never see: saving data properly, making shops and economies work, and keeping exploiters out.",
      "All of my games are live and public, so the numbers on this site are real and update on their own.",
    ],
    skills: [
      {
        label: "Core",
        items: ["Luau", "OOP & metatables", "Roact / Fusion", "Knit", "Rojo + Git"],
      },
      {
        label: "Systems",
        items: ["DataStore v2", "ProfileService", "Shops & economies", "Saves & session locking", "Gamepasses"],
      },
      {
        label: "Security",
        items: ["Server authority", "Anti-exploit", "Remote validation", "Rate limiting", "MicroProfiler"],
      },
    ],
    process: [
      { n: "01", title: "Scope",  text: "We agree on what I'm building and what it costs before I start." },
      { n: "02", title: "Build",  text: "You get working builds as I go, not one drop at the end." },
      { n: "03", title: "Test",   text: "I test for exploits and leave the code readable for whoever works on it next." },
    ],
  },

  /* ---------------------------------------------------------------------
     4. GAMES — live stats come from these Universe IDs.
     Name, visits, CCU, thumbnail and play link are all fetched automatically.
     `role` is the only thing you write yourself — change any that are wrong.
     ------------------------------------------------------------------ */
  games: [
    { universeId: 10023401715, role: "Scripter" },   // Bow for Lucky Blocks
    { universeId: 9958506970,  role: "Scripter" },   // Build to Become Squid Game Guard
    { universeId: 9889664408,  role: "Scripter" },   // Shrink for Lucky Blocks
    { universeId: 9857780163,  role: "Scripter" },   // Obby to Brainrots
    { universeId: 9855239414,  role: "Scripter" },   // Escape Supermarket for Brainrots
    { universeId: 9825427575,  role: "Scripter" },   // Escape Train for Brainrots
    { universeId: 9715259353,  role: "Scripter" },   // Escape Falling Stairs for Brainrot
    { universeId: 9539819854,  role: "Scripter" },   // Bomb Card
    { universeId: 9488122827,  role: "Scripter" },   // Four in a Row
    { universeId: 9160234761,  role: "Scripter" },   // Dangerous RV Driving
    { universeId: 8770927660,  role: "Scripter" },   // Feed Your Pets
    { universeId: 8158669578,  role: "Scripter" },   // FREE ADMIN Samurai Troll Tower
    { universeId: 8139614266,  role: "Scripter" },   // Steal a Samurai
    { universeId: 8048361149,  role: "Scripter" },   // Steal a Celebrity
  ],

  /* ---------------------------------------------------------------------
     5. MEDIA — videos and images of your work.
     type: "image"   → src = path or URL to an image
     type: "youtube" → src = the video ID only (e.g. "dQw4w9WgXcQ")
     type: "video"   → src = path or URL to an .mp4
                       poster is optional; without one the first frame is used
     ------------------------------------------------------------------ */
  media: [
    // Downloaded from your X posts and stored locally, so they can't expire
    // or get rate-limited the way hotlinked twimg.com URLs do.
    { type: "video", src: "assets/media/clip-01.mp4", title: "Blocks Count Down Timer", caption: "" },
    { type: "video", src: "assets/media/clip-02.mp4", title: "Luckyblock open Animation", caption: "" },
  ],

  /* ---------------------------------------------------------------------
     6. LIVE STATS — you shouldn't need to touch this.
     ------------------------------------------------------------------ */
  api: {
    hosts: [
      { games: "https://games.roproxy.com",  thumbs: "https://thumbnails.roproxy.com" },
      { games: "https://games.roblox.com",   thumbs: "https://thumbnails.roblox.com"  },
    ],
    refreshSeconds: 120,
    cacheMinutes:   10,
  },
};
