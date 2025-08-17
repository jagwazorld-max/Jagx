module.exports = {
  entry: "src/index.js",
  env: [
    "OWNERS",
    "PAIR_SERVER"
  ],
  assets: [
    "assets/jagx-profile.png",
    "assets/welcome-image.png",
    "assets/goodbye-image.png",
    "assets/meme-template.png",
    "assets/default-avatar.png",
    "assets/profile-card-bg.png",
    "assets/xp-icon.png",
    "assets/poll-banner.png",
    "assets/ai-generated-image.png",
    "assets/sticker-template.png",
    "assets/tts-voice.mp3"
  ],
  autorestart: true,
  panel: {
    name: "JagX WhatsApp Bot",
    description: "JagX: Secure WhatsApp bot with pairing, section IDs, games, media utilities, and full admin panel.",
    image: "assets/jagx-profile.png"
  },
  expose: [4260], // Expose pairing server port
  volumes: [
    "data",
    "auth_info"
  ],
  prestart: [
    "npm install",
    "npm install jimp",
    "node tools/generate-assets.js"
  ]
};