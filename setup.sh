#!/bin/bash
echo "ðŸš€ JagX Automated Setup"

if ! command -v node &>/dev/null; then
  echo "âŒ Node.js not found."
  exit 1
fi

npm install
npm install jimp

node tools/generate-assets.js

if [ ! -f .env ]; then
  echo "OWNERS=2349160654415,2347050512232" > .env
  echo "PAIR_SERVER=http://localhost:4260" >> .env
fi

mkdir -p auth_info
mkdir -p data

echo "{}" > data/pairings.json
echo "{}" > data/sections.json

echo "âœ… JagX setup complete! Run: node src/pairing-server.js & npm start"
