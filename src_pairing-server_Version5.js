// JagX Pairing & Section Server - Render Ready
// To deploy: Set OWNERS and DATA_DIR=/data in Render dashboard. Attach a persistent disk at /data.

const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Environment variables for Render
const PORT = process.env.PORT || 4260;
const OWNERS = (process.env.OWNERS || '').split(',').map(x => x.trim());
const PAIR_PREFIX = 'JagX';
const DATA_DIR = process.env.DATA_DIR || '/data'; // Use /data for Render persistent disk
const PAIRINGS_FILE = path.join(DATA_DIR, 'pairings.json');
const SECTIONS_FILE = path.join(DATA_DIR, 'sections.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Load or initialize storage
function loadJson(file, fallback = {}) {
  if (fs.existsSync(file)) {
    try { return JSON.parse(fs.readFileSync(file)); } catch { return fallback; }
  }
  return fallback;
}
function saveJson(file, obj) { fs.writeFileSync(file, JSON.stringify(obj, null, 2)); }
let pairings = loadJson(PAIRINGS_FILE);
let sections = loadJson(SECTIONS_FILE);

const app = express();
app.use(bodyParser.json());

// Generate secure code (JagX + 4 digits)
function generateJagXCode() { return PAIR_PREFIX + crypto.randomInt(1000, 9999); }

// Owners create pairing code
app.post('/create-pair', (req, res) => {
  const { owner, userPhone } = req.body;
  if (!OWNERS.includes(owner)) return res.status(403).json({ error: 'Not authorized.' });
  const code = generateJagXCode();
  pairings[userPhone] = { code, expires: Date.now() + 10 * 60 * 1000, paired: false, sectionId: null };
  saveJson(PAIRINGS_FILE, pairings);
  return res.json({ userPhone, code, expires: pairings[userPhone].expires });
});

// User requests owner info
app.get('/request-pair/:userPhone', (req, res) => {
  res.json({ message: "Contact an owner for pairing.", owners: OWNERS });
});

// User verifies pairing code
app.post('/verify-pair', (req, res) => {
  const { userPhone, code } = req.body;
  const pairing = pairings[userPhone];
  if (!pairing) return res.status(404).json({ error: 'No pairing found.' });
  if (Date.now() > pairing.expires) return res.status(410).json({ error: 'Pairing code expired.' });
  if (pairing.code !== code) return res.status(401).json({ error: 'Invalid code.' });
  pairing.paired = true;
  saveJson(PAIRINGS_FILE, pairings);
  return res.json({ message: 'Successfully paired!', userPhone });
});

// Owners create section ID
app.post('/create-section', (req, res) => {
  const { owner, sectionName } = req.body;
  if (!OWNERS.includes(owner)) return res.status(403).json({ error: 'Not authorized.' });
  const sectionId = generateJagXCode();
  sections[sectionId] = { name: sectionName, created: Date.now(), owner };
  saveJson(SECTIONS_FILE, sections);
  return res.json({ sectionId, sectionName });
});

// User requests section info
app.get('/section/:sectionId', (req, res) => {
  const sectionId = req.params.sectionId;
  if (!sections[sectionId]) return res.status(404).json({ error: 'Section ID not found.' });
  res.json(sections[sectionId]);
});

// List all active pairings
app.get('/pairings', (req, res) => {
  const owner = req.query.owner;
  if (!OWNERS.includes(owner)) return res.status(403).json({ error: 'Not authorized.' });
  res.json(pairings);
});

// List all sections
app.get('/sections', (req, res) => {
  const owner = req.query.owner;
  if (!OWNERS.includes(owner)) return res.status(403).json({ error: 'Not authorized.' });
  res.json(sections);
});

// Remove pairing
app.post('/remove-pair', (req, res) => {
  const { owner, userPhone } = req.body;
  if (!OWNERS.includes(owner)) return res.status(403).json({ error: 'Not authorized.' });
  delete pairings[userPhone];
  saveJson(PAIRINGS_FILE, pairings);
  res.json({ message: 'Pairing removed.', userPhone });
});

// Remove section
app.post('/remove-section', (req, res) => {
  const { owner, sectionId } = req.body;
  if (!OWNERS.includes(owner)) return res.status(403).json({ error: 'Not authorized.' });
  delete sections[sectionId];
  saveJson(SECTIONS_FILE, sections);
  res.json({ message: 'Section removed.', sectionId });
});

// Health check
app.get('/', (req, res) => res.send('JagX Pairing & Section Server is running on Render.'));

app.listen(PORT, () => {
  console.log(`JagX Pairing & Section Server running on port ${PORT}`);
});