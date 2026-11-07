/* ============================================================================
   CONFIG — This is the ONLY file you need to edit.
   Everything on the site reads from here. After editing, run
   `node tools/prerender.mjs` so the page source matches (see README).

   {games}, {visits} and {years} in any text below are filled in for you:
   the number of games listed, their combined visits ("22M+"), and
   yearsExperience.
   ========================================================================= */

window.CONFIG = {

  /* ---------------------------------------------------------------------
     1. WHO YOU ARE
     ------------------------------------------------------------------ */
  identity: {
    name:      "16k_Caden",
    handle:    "@16k_Caden",
    role:      "Fullstack Roblox Developer",
    // Anything between *asterisks* gets the green-to-cyan gradient.
    headline:  "One developer for your *whole Roblox game.*",
    subline:   "I script, build, model and design UI. My {games} games have {visits} visits.",
    description: "Fullstack Roblox developer for hire: scripting, building, 3D modeling and UI. {games} games with {visits} visits. From $500 a month.",
    available: true,
    availableText:   "Open for work",
    unavailableText: "Booked",
    location:  "GMT+1, remote",
    yearsExperience: 4,
  },

  /* ---------------------------------------------------------------------
     2. CONTACT  (used by the Contact tab + every CTA on the site)
     ------------------------------------------------------------------ */
  contact: {
    lede:          "Tell me what you need on Discord. I'll say if I can do it and when I can start.",
    discord:       "caden._.arabic",
    discordServer: "",                          // optional invite URL
    x:             "Caden__Pro",
    talentHub:     { label: "16k_Caden", url: "https://create.roblox.com/talent/creators/867951875" },
    roblox:        { label: "@16k_Caden", url: "https://www.roblox.com/users/867951875/profile" },
    email:         "",                          // leave "" to hide
    responseTime:  "I usually reply within a few hours. I work 5-8 hours a day, 4-6 days a week.",
  },

  /* ---------------------------------------------------------------------
     3. PRICING  (Contact tab). featured: true highlights a tier.
     ------------------------------------------------------------------ */
  pricing: [
    { name: "One role",  price: "$500",   per: "/ month", text: "Scripting, building, modeling or UI" },
    { name: "Two roles", price: "$1,000", per: "/ month", text: "Any two, like scripting and building" },
    { name: "Full dev",  price: "$1,500", per: "/ month", text: "Scripts, maps, models and UI", featured: true },
  ],

  /* ---------------------------------------------------------------------
     4. ABOUT TAB
     ------------------------------------------------------------------ */
  about: {
    bio: [
      "I'm Caden, a fullstack Roblox developer. I've been making Roblox games for {years}+ years, and the {games} on this site have {visits} visits between them: simulators, tycoons, obbies, horror, escape and steal-a games.",
      "Studios hire me because I cover the whole game: Luau systems, maps and lobbies, Blender models and rigs, and the UI players tap on. One person, one Discord chat, no hand-offs.",
    ],
    skills: [
      {
        label: "Scripting",
        items: ["Luau", "Knit", "ProfileStore & DataStores", "Shops & gamepasses", "Anti-exploit", "Rojo + Git"],
      },
      {
        label: "Building & modeling",
        items: ["Maps & lobbies", "Stud style & low-poly", "Blender modeling", "Rigging & animation"],
      },
      {
        label: "UI & effects",
        items: ["HUDs & shops", "Menus & popups", "Particles & VFX"],
      },
    ],
    process: [
      { n: "01", title: "Scope", text: "We agree on the features, the deadline and the monthly price before I start." },
      { n: "02", title: "Build", text: "I work in your place 5-8 hours a day and post progress clips on Discord." },
      { n: "03", title: "Ship",  text: "I test for exploits, data loss and mobile, then hand over clean, organized code." },
    ],
  },

  /* ---------------------------------------------------------------------
     5. GAMES — live stats come from these Universe IDs.
     Name, visits, CCU and thumbnail are fetched automatically.
     You write `role` and `contribution` (one line on what you built).
     `placeId` keeps the Play link working even when Roblox is unreachable.
     `closed: true` is for games that went private: they keep their visits
     but show "Closed" instead of a Play link.
     ------------------------------------------------------------------ */
  games: [
    { universeId: 9160234761, placeId: 78758085598611, role: "Scripter",
      contribution: "Driving physics, world progression, collectible cars and the car shop." },   // Dangerous RV Driving
    { universeId: 8865934317, placeId: 111392584461873, role: "Scripter",
      contribution: "Bubble wrap tower obby with poppable wrap and pick-your-own pop sounds." },   // Bubble Wrap ASMR Tower
    { universeId: 9488122827, placeId: 118638953131946, role: "Scripter",
      contribution: "Two-player Connect 4: turns, win detection and table matchmaking." },   // Four in a Row!
    { universeId: 2576960132, placeId: 6790675778, role: "Scripter",
      contribution: "Obby stages, checkpoints and group-join rewards." },   // Secret Obby
    { universeId: 9508198844, placeId: 124101752948502, role: "Scripter",
      contribution: "Speed-per-step system, treadmills, jetpack upgrades and tsunami waves." },   // Escape Tsunami on Jetpack!
    { universeId: 9825427575, placeId: 93014298159631, role: "Scripter", closed: true,
      contribution: "Brainrot collecting on the tracks, speed upgrades and train hazards." },   // Escape Train for Brainrots! (private now)
    { universeId: 9684216326, placeId: 82573717400450, role: "Scripter",
      contribution: "Minecart physics ride through obstacle tracks." },   // Minecart Ride
    { universeId: 8158669578, placeId: 115768905804211, role: "Scripter",
      contribution: "Katana combat, fling traps and free admin commands." },   // Samurai Troll Tower
    { universeId: 2778824421, placeId: 7161718519, role: "Scripter",
      contribution: "Weapons, destruction effects and admin events." },   // Destroy a Cute Axolotl!
    { universeId: 10143449522, placeId: 101931368733728, role: "Scripter",
      contribution: "Night-by-night survival loop with anomalies that change every day." },   // Scary Pizzeria: ANOMALIES
    { universeId: 8048361149, placeId: 96771164438323, role: "Scripter",
      contribution: "Buy, steal and defend celebrities: bases, income and fame upgrades." },   // Steal a Celebrity
    { universeId: 9889664408, placeId: 97071633125628, role: "Scripter",
      contribution: "Shrink zones, lucky block rolls, guard AI and brainrot upgrades." },   // Shrink for Lucky Blocks
    { universeId: 10154654970, placeId: 71178322219919, role: "Scripter", closed: true,
      thumb: "https://tr.rbxcdn.com/180DAY-c2f2d09b4b9d0b61ac70c7af7cd65037/768/432/Image/Png/noFilter",
      fallback: { name: "Roll in a Minecart", visits: 258278, favorites: 564 },
      contribution: "Shopping cart physics with brakes, obstacles and crash effects." },   // Roll in a Minecart (unavailable since 2026-11-07)
    { universeId: 10486990560, placeId: 73834606570962, role: "Scripter", closed: true,
      thumb: "https://tr.rbxcdn.com/180DAY-8e53e042050f1cadf862977586876c8d/768/432/Image/Png/noFilter",
      fallback: { name: "+1 Speed Rock Cave Escape", visits: 233580, favorites: 4115 },
      contribution: "+1 speed per step, multipliers, races and rock smashing." },   // +1 Speed Rock Cave Escape (unavailable since 2026-11-07)
    { universeId: 9715259353, placeId: 116990588746086, role: "Scripter",
      contribution: "Collapsing staircase, brainrot income and the speed shop." },   // Escape Falling Stairs for Brainrot
    { universeId: 9858955445, placeId: 124513042683021, role: "Scripter",
      contribution: "Dealership tycoon: crates, parking lot, customers and expansions." },   // My Car Dealership!
    { universeId: 9856252042, placeId: 74595003236475, role: "Scripter",
      contribution: "Steal brainrots, teacher chase AI and base income." },   // Escape School For Brainrots!
    { universeId: 9958506970, placeId: 110424054961189, role: "Scripter",
      contribution: "Stair-building race, sniper throne, rocket launchers and shields." },   // Build to Become Squid Game Guard!
    { universeId: 9539819854, placeId: 80288638708154, role: "Scripter", closed: true,
      contribution: "Two-player card game: bomb placement, turns and loss rules." },   // Bomb Card (private now)
    { universeId: 10023401715, placeId: 121627323638824, role: "Scripter",
      contribution: "Bow combat, lucky block rolls, damage and luck upgrades, rebirths." },   // Bow for Lucky Blocks
    { universeId: 8471471873, placeId: 93108774146455, role: "Scripter",
      contribution: "Ragdoll launch physics and distance upgrades." },   // Fling a Brainrot
    { universeId: 10770035099, placeId: 102399059182565, role: "Developer",
      contribution: "Whole game: tree chopping, egg catching, guard chases and hatching." },   // Chop a Lucky Nest
    { universeId: 9855239414, placeId: 71872042924927, role: "Scripter",
      contribution: "Stealth runs past cameras and guards, brainrot income and upgrades." },   // Escape Supermarket for Brainrots!
    { universeId: 5829071530, placeId: 16989186790, role: "Scripter",
      contribution: "Wall climbing, pets, codes and leaderboards." },   // Climb a Wall!
    { universeId: 9986533324, placeId: 125134397398913, role: "Scripter",
      contribution: "Live re-release of Escape Train for Brainrots." },   // Escape Train For Brainrots
    { universeId: 9700383470, placeId: 119317336392339, role: "Scripter",
      contribution: "Speed per step, noob evolutions and unlockable worlds." },   // +1 Speed Noob Escape
    { universeId: 9551152786, placeId: 83830555014105, role: "Scripter",
      contribution: "Tsunami waves, collecting, base slots and upgrades." },   // Escape Tsunami to Steal Waifus
    { universeId: 10768217698, placeId: 97827991493021, role: "Developer",
      contribution: "Whole game: boats, crate deliveries, training and creature feeding." },   // Feed the Creature
    { universeId: 10766728783, placeId: 105756703188805, role: "Scripter",
      contribution: "Item pickup and sorting across store maps, with auto-save." },   // Sort the Ducks
    { universeId: 9742452738, placeId: 91087372456657, role: "Scripter",
      contribution: "Helicopter flight, brainrot rescues, upgrades and base expansion." },   // Fly HELICOPTER For Brainrots
    { universeId: 9870987151, placeId: 86566121590906, role: "Scripter",
      contribution: "Hoverboards, speed trails and train dodging." },   // +1 Speed Hoverboard Train Escape
    { universeId: 9665201247, placeId: 120040750339058, role: "Scripter",
      contribution: "Egg hatching, pets that fish for you and offline income." },   // My Fishing Pets
    { universeId: 8684640288, placeId: 108449645333426, role: "Scripter",
      contribution: "Mining, ore selling and coin progression." },   // Ore Mine Simulator
    { universeId: 9897477160, placeId: 84640059339046, role: "Scripter",
      contribution: "Lucky block spins, ruler upgrades and rare variants." },   // Teach A Lucky Block!
    { universeId: 10771812020, placeId: 97330213338981, role: "Scripter",
      contribution: "Woodshop crafting: blueprints, bandsaw, lathe, sanding and selling." },   // Woodmaker
    { universeId: 10257555178, placeId: 131907213910555, role: "Scripter",
      contribution: "Aura crate rolls, token stations, islands and rebirths." },   // Roll Crates For Auras
    { universeId: 8878100545, placeId: 131672423006503, role: "Scripter",
      contribution: "Tag and place brainrots, with offline earnings." },   // Tag a Brainrot
    { universeId: 10768184152, placeId: 130237662544324, role: "Scripter",
      contribution: "8-player waterslide racing with momentum and launch physics." },   // Waterslide Race
    { universeId: 10766457988, placeId: 126242985657410, role: "Developer",
      contribution: "Boats to 7 islands, egg hooking, jetski guards and hatching." },   // Sail to Steal Eggs
    { universeId: 8770927660, placeId: 140049315593804, role: "Scripter",
      contribution: "Pet feeding and growth loop." },   // Feed Your Pets
  ],

  /* ---------------------------------------------------------------------
     6. MEDIA — videos and images of your work.
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
     7. LIVE STATS — you shouldn't need to touch this.
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
