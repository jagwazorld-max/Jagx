// JagX WhatsApp Bot - Games, Media, Admin, Advanced Messaging Features

require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const nodeCron = require('node-cron');
const Jimp = require('jimp');

const OWNERS = process.env.OWNERS?.split(',').map(x => x.trim()) || [];
const PAIR_SERVER = process.env.PAIR_SERVER || 'http://localhost:4260';
const jagxName = '🤖 JagX 🤖';
const assets = {
  profile: path.join(__dirname, '../assets/jagx-profile.png'),
  welcome: path.join(__dirname, '../assets/welcome-image.png'),
  goodbye: path.join(__dirname, '../assets/goodbye-image.png'),
  meme: path.join(__dirname, '../assets/meme-template.png'),
  avatar: path.join(__dirname, '../assets/default-avatar.png'),
  profileCard: path.join(__dirname, '../assets/profile-card-bg.png'),
  xpIcon: path.join(__dirname, '../assets/xp-icon.png'),
  pollBanner: path.join(__dirname, '../assets/poll-banner.png'),
  aiImage: path.join(__dirname, '../assets/ai-generated-image.png'),
  sticker: path.join(__dirname, '../assets/sticker-template.png'),
  tts: path.join(__dirname, '../assets/tts-voice.mp3')
};
const XP = {}; // {userJid: xp}
const QUIZZES = [
  { question: "Capital of France?", answer: "Paris" },
  { question: "2 + 2?", answer: "4" },
  { question: "First president of USA?", answer: "George Washington" },
];
const deletedMsgs = {}; // {keyId: message}
const viewOnceMedia = {}; // {keyId: message}

function isOwner(jid) {
  const num = jid.replace(/[^0-9]/g, '');
  return OWNERS.includes(num);
}

async function requestPairCode(userPhone) {
  const resp = await axios.get(`${PAIR_SERVER}/request-pair/${userPhone}`).catch(() => null);
  return resp ? resp.data : null;
}
async function verifyPairCode(userPhone, code) {
  const resp = await axios.post(`${PAIR_SERVER}/verify-pair`, { userPhone, code }).catch(() => null);
  return resp ? resp.data : null;
}
async function createSection(owner, sectionName) {
  const resp = await axios.post(`${PAIR_SERVER}/create-section`, { owner, sectionName }).catch(() => null);
  return resp ? resp.data : null;
}

function addXP(jid, amount = 10) {
  XP[jid] = (XP[jid] || 0) + amount;
  return XP[jid];
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ version, auth: state, printQRInTerminal: true });

  // Welcome/Goodbye
  sock.ev.on('group-participants.update', async (update) => {
    const jid = update.id;
    if (update.action === 'add') {
      await sock.sendMessage(jid, {
        image: { url: assets.welcome },
        caption: `🎉 Welcome ${update.participants.join(', ')} to ${jagxName}!`
      });
    }
    if (update.action === 'remove') {
      await sock.sendMessage(jid, {
        image: { url: assets.goodbye },
        caption: `👋 Goodbye ${update.participants.join(', ')}!`
      });
    }
  });

  // Advanced Message Handling: Anti-delete, View Once
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || !msg.key.remoteJid) return;
    const sender = msg.key.participant || msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

    // Save deleted and view-once messages for anti-delete/view-once
    deletedMsgs[msg.key.id] = msg.message;
    if (msg.message.viewOnceMessage) viewOnceMedia[msg.key.id] = msg.message.viewOnceMessage.message;

    // Add XP for any message
    addXP(sender);

    // Menu/help
    if (/^\.(menu|help)$/i.test(text)) {
      await sock.sendMessage(sender, {
        image: { url: assets.profile },
        caption: `
${jagxName}
Commands:
.menu / .help - Show menu
.pair <JagXcode> - Pair with the bot using code
.requestpair - Get owner info for pairing
.sectionid <sectionName> - Generate section ID
.verifysection <JagXsectionId> - Verify section ID

Game/XP:
.rps - Rock Paper Scissors
.quiz - Trivia quiz
.level - Show your XP/level
.meme <top>|<bottom> - Meme generator
.sticker+ <text> - Custom sticker
.profile - Profile card
.poll <question>|<opt1>|<opt2>... - Create poll
.gif - Fun GIF
.ocr - OCR image to text
.tts <text> - Text to speech (demo)
.kick <number> - Kick user (admin)
.promote <number> - Promote user (admin)
.demote <number> - Demote user (admin)
.broadcast <text> - Owner broadcast
.mute <number> - Mute user (admin)
.unmute <number> - Unmute user (admin)
.sendfile - Send file demo
.aiimg <prompt> - AI image demo

Advanced Messaging:
.saveviewonce - Save 'view once' media
.retrieve - Retrieve deleted messages
.react <emoji> - React to last message
.viewstatus - View message status (demo)
.reactstatus <emoji> - React to status (demo)
`
      });
    }

    // Request pairing info
    if (text.startsWith('.requestpair')) {
      const num = sender.replace(/[^0-9]/g, '');
      const info = await requestPairCode(num);
      await sock.sendMessage(sender, { text: info ? `Contact owners: ${info.owners.join(', ')}` : 'Server error.' });
    }

    // Pair with code
    if (text.startsWith('.pair ')) {
      const code = text.split(' ')[1];
      const num = sender.replace(/[^0-9]/g, '');
      const result = await verifyPairCode(num, code);
      await sock.sendMessage(sender, { text: result?.message || 'Pairing failed.' });
    }

    // Generate section ID
    if (text.startsWith('.sectionid ')) {
      if (!isOwner(sender)) {
        await sock.sendMessage(sender, { text: 'Only owners can generate section IDs.' });
        return;
      }
      const sectionName = text.replace('.sectionid ', '').trim();
      const result = await createSection(sender.replace(/[^0-9]/g, ''), sectionName);
      await sock.sendMessage(sender, { text: result ? `Section ID: ${result.sectionId}` : 'Section creation failed.' });
    }

    // Verify section ID
    if (text.startsWith('.verifysection ')) {
      const sectionId = text.split(' ')[1];
      const resp = await axios.get(`${PAIR_SERVER}/section/${sectionId}`).catch(() => null);
      if (resp && resp.data && resp.data.name) {
        await sock.sendMessage(sender, { text: `Section '${resp.data.name}' is valid.` });
      } else {
        await sock.sendMessage(sender, { text: 'Invalid section ID.' });
      }
    }

    // Game: Rock Paper Scissors
    if (text.startsWith('.rps')) {
      const choices = ['rock', 'paper', 'scissors'];
      const botChoice = choices[Math.floor(Math.random() * choices.length)];
      await sock.sendMessage(sender, { text: `🤖 I choose: ${botChoice}` });
    }

    // Game: Quiz
    if (text.startsWith('.quiz')) {
      const q = QUIZZES[Math.floor(Math.random() * QUIZZES.length)];
      await sock.sendMessage(sender, { text: `Quiz: ${q.question}\nReply with .answer <your answer>` });
      msg.__quizAnswer = q.answer; // Save for checking
    }

    // Game: Answer
    if (text.startsWith('.answer ')) {
      if (msg.__quizAnswer) {
        const ans = text.replace('.answer ', '').trim();
        if (ans.toLowerCase() === msg.__quizAnswer.toLowerCase()) {
          addXP(sender, 50);
          await sock.sendMessage(sender, { text: '🎉 Correct! +50 XP' });
        } else {
          await sock.sendMessage(sender, { text: '❌ Incorrect. Try again!' });
        }
        delete msg.__quizAnswer;
      }
    }

    // XP/Level
    if (text.startsWith('.level')) {
      const xp = XP[sender] || 0;
      const level = Math.floor(xp / 100);
      await sock.sendMessage(sender, { text: `XP: ${xp}\nLevel: ${level}` });
    }

    // Media: Meme generator
    if (text.startsWith('.meme ')) {
      const [top, bottom] = text.replace('.meme ', '').split('|').map(x => x.trim());
      const meme = await Jimp.read(assets.meme);
      const font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
      meme.print(font, 20, 20, top, 360);
      meme.print(font, 20, 260, bottom, 360);
      await meme.writeAsync('assets/generated-meme.png');
      await sock.sendMessage(sender, { image: { url: 'assets/generated-meme.png' }, caption: `${top}\n${bottom}` });
    }

    // Media: Custom sticker
    if (text.startsWith('.sticker+ ')) {
      const stickerText = text.replace('.sticker+ ', '');
      const sticker = await Jimp.read(assets.sticker);
      const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
      sticker.print(font, 0, 80, {
        text: stickerText,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
      }, 320, 60);
      await sticker.writeAsync('assets/generated-sticker.png');
      await sock.sendMessage(sender, { sticker: fs.readFileSync('assets/generated-sticker.png') });
    }

    // Media: Profile card
    if (text.startsWith('.profile')) {
      const card = await Jimp.read(assets.profileCard);
      const font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
      card.print(font, 30, 10, `User: ${sender}`, 330);
      card.print(font, 30, 40, `Level: ${Math.floor((XP[sender] || 0)/100)}`, 330);
      card.print(font, 30, 70, `XP: ${XP[sender] || 0}`, 330);
      await card.writeAsync('assets/generated-profile-card.png');
      await sock.sendMessage(sender, { image: { url: 'assets/generated-profile-card.png' }, caption: 'Profile Card' });
    }

    // Media: Poll
    if (text.startsWith('.poll ')) {
      const pollText = text.replace('.poll ', '');
      await sock.sendMessage(sender, { image: { url: assets.pollBanner }, caption: `Poll started!\n${pollText}` });
    }

    // Media: GIF (demo)
    if (text.startsWith('.gif')) {
      await sock.sendMessage(sender, { image: { url: assets.aiImage }, caption: 'Here is a fun GIF!' });
    }

    // Media: OCR (stub)
    if (text.startsWith('.ocr') && msg.message.imageMessage) {
      await sock.sendMessage(sender, { text: 'OCR: [Extracted text would be here]' });
    }

    // Media: TTS (demo)
    if (text.startsWith('.tts ')) {
      await sock.sendMessage(sender, { audio: { url: assets.tts }, mimetype: 'audio/mp4' });
    }

    // Admin: Kick, promote, demote, broadcast, mute, unmute
    if (isOwner(sender)) {
      if (text.startsWith('.kick ')) {
        const number = text.split(' ')[1];
        await sock.groupParticipantsUpdate(msg.key.remoteJid, [`${number}@s.whatsapp.net`], 'remove');
      }
      if (text.startsWith('.promote ')) {
        const number = text.split(' ')[1];
        await sock.groupParticipantsUpdate(msg.key.remoteJid, [`${number}@s.whatsapp.net`], 'promote');
      }
      if (text.startsWith('.demote ')) {
        const number = text.split(' ')[1];
        await sock.groupParticipantsUpdate(msg.key.remoteJid, [`${number}@s.whatsapp.net`], 'demote');
      }
      if (text.startsWith('.broadcast ')) {
        const bcText = text.replace('.broadcast ', '');
        await sock.sendMessage(sender, { text: `[Broadcast] ${bcText}` });
      }
      if (text.startsWith('.mute ')) {
        await sock.sendMessage(sender, { text: "User muted (demo)" });
      }
      if (text.startsWith('.unmute ')) {
        await sock.sendMessage(sender, { text: "User unmuted (demo)" });
      }
    }

    // Media: Send file
    if (text.startsWith('.sendfile')) {
      await sock.sendMessage(sender, { document: fs.readFileSync(path.join(__dirname, '../assets/rules.pdf')), mimetype: 'application/pdf', fileName: 'rules.pdf' });
    }

    // Media: AI image demo
    if (text.startsWith('.aiimg ')) {
      await sock.sendMessage(sender, { image: { url: assets.aiImage }, caption: 'AI generated image (demo)' });
    }

    // ADVANCED: Save view once media
    if (text.startsWith('.saveviewonce')) {
      const ids = Object.keys(viewOnceMedia);
      if (!ids.length) {
        await sock.sendMessage(sender, { text: "No view once media found." });
        return;
      }
      for (const id of ids) {
        await sock.sendMessage(sender, { text: "Saved view once media:" });
        await sock.sendMessage(sender, viewOnceMedia[id]);
      }
    }

    // ADVANCED: Retrieve deleted messages
    if (text.startsWith('.retrieve')) {
      const ids = Object.keys(deletedMsgs);
      if (!ids.length) {
        await sock.sendMessage(sender, { text: "No deleted messages found." });
        return;
      }
      for (const id of ids) {
        await sock.sendMessage(sender, { text: "Retrieved deleted message:" });
        await sock.sendMessage(sender, deletedMsgs[id]);
      }
    }

    // ADVANCED: React to last message
    if (text.startsWith('.react ')) {
      const emoji = text.split(' ')[1];
      if (emoji) {
        await sock.sendMessage(sender, { react: { text: emoji, key: msg.key } });
      }
    }

    // ADVANCED: View message status (stub)
    if (text.startsWith('.viewstatus')) {
      await sock.sendMessage(sender, { text: 'Status: [Delivered/Read demo]' });
    }

    // ADVANCED: React to status (stub)
    if (text.startsWith('.reactstatus ')) {
      const emoji = text.split(' ')[1];
      await sock.sendMessage(sender, { text: `Reacted to status with ${emoji}` });
    }
  });

  // Anti-delete: Announce deleted messages
  sock.ev.on('messages.delete', async ({ keys }) => {
    for (const key of keys) {
      if (deletedMsgs[key.id]) continue;
      deletedMsgs[key.id] = { text: "[Deleted message was here]" };
      await sock.sendMessage(key.remoteJid, { text: `A message was deleted: [Recovered]` });
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

startBot();
