// JagX Entrypoint: Start Pairing Server & Bot

const { fork } = require('child_process');
const path = require('path');

const pairingServer = fork(path.join(__dirname, 'pairing-server.js'), [], {
  stdio: 'inherit',
  env: process.env
});

const bot = fork(path.join(__dirname, 'bot.js'), [], {
  stdio: 'inherit',
  env: process.env
});