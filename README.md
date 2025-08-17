# Jagx
# ðŸ¤– JagX - WhatsApp Bot with Secure Pairing, Section IDs, Games, Media Utilities, and Admin Panel

A modern WhatsApp bot with secure pairing and section ID system, games, media utilities, and full admin panel.

## ðŸš€ Features

- Secure pairing server (REST API)
- Section ID management (for grouping/roles)
- All codes/IDs start with `JagX` + 4 digits (e.g. JagX2345)
- Owners: Kick, promote, demote, mute, broadcast, create section/pairing codes
- Game commands: `.rps`, `.quiz`, `.level`
- Media utilities: meme generator, sticker maker, profile card, OCR, TTS, GIF, poll, AI image, file sharing
- Automated setup & local asset generation (no downloads)

## â© Quick Start

1. Clone this repo.
2. Run:
   ```bash
   bash setup.sh
   ```
3. Start pairing server:
   ```bash
   node src/pairing-server.js
   ```
4. Start WhatsApp bot:
   ```bash
   npm start
   ```

## ðŸ“¦ File Structure

- `src/pairing-server.js` - REST server for pairing & section IDs
- `src/bot.js` - WhatsApp bot with all commands
- `data/pairings.json` - Stores active pairings
- `data/sections.json` - Stores all sections
- `tools/generate-assets.js` - Node script to design images
- `assets/` - Images (profile, welcome, meme, sticker, poll, etc.)
- `.env` - Owner config & server URL
- `setup.sh` - Automated setup

## ðŸ¤ Contributing

Issues and PRs welcome!

## ðŸ“„ License

MIT
