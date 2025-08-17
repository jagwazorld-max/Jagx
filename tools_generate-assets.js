const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const assetsDir = path.join(__dirname, '../assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

async function createProfile() {
  const img = new Jimp(400, 400, '#3737ff');
  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  img.circle();
  img.print(font, 0, 150, {
    text: 'JagX',
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
  }, 400, 100);
  img.print(font, 0, 250, {
    text: '🤖',
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
  }, 400, 100);
  await img.writeAsync(path.join(assetsDir, 'jagx-profile.png'));
}
async function createWelcome(type = 'welcome') {
  const img = new Jimp(400, 120, type === 'welcome' ? '#00ff88' : '#ff8800');
  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
  img.print(font, 0, 35, {
    text: type === 'welcome' ? 'Welcome to JagX!' : 'Goodbye from JagX!',
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
  }, 400, 40);
  await img.writeAsync(path.join(assetsDir, `${type}-image.png`));
}
async function createMemeTemplate() {
  const img = new Jimp(400, 300, '#eeeeee');
  const font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
  img.print(font, 20, 20, 'TOP TEXT', 360);
  img.print(font, 20, 260, 'BOTTOM TEXT', 360);
  await img.writeAsync(path.join(assetsDir, 'meme-template.png'));
}
async function createAvatar() {
  const img = new Jimp(100, 100, '#5555ee');
  const font = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
  img.circle();
  img.print(font, 0, 40, {
    text: 'JX',
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
  }, 100, 20);
  await img.writeAsync(path.join(assetsDir, 'default-avatar.png'));
}
async function createProfileCardBG() {
  const img = new Jimp(400, 140, '#f3f3f3');
  img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
    if (x % 20 < 10 && y % 20 < 10) {
      this.bitmap.data[idx + 0] = 180; // R
      this.bitmap.data[idx + 1] = 200; // G
      this.bitmap.data[idx + 2] = 255; // B
    }
  });
  await img.writeAsync(path.join(assetsDir, 'profile-card-bg.png'));
}
async function createXPIcon() {
  const img = new Jimp(48, 48, '#00ffff');
  const font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
  img.print(font, 0, 14, {
    text: 'XP',
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
  }, 48, 20);
  await img.writeAsync(path.join(assetsDir, 'xp-icon.png'));
}
async function createPollBanner() {
  const img = new Jimp(400, 80, '#f8f800');
  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
  img.print(font, 0, 20, {
    text: 'Poll Time!',
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
  }, 400, 40);
  await img.writeAsync(path.join(assetsDir, 'poll-banner.png'));
}
async function createAIImage() {
  const img = new Jimp(400, 300, '#ffffff');
  const font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
  img.print(font, 0, 130, {
    text: 'AI Generated',
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
  }, 400, 40);
  await img.writeAsync(path.join(assetsDir, 'ai-generated-image.png'));
}
async function createStickerTemplate() {
  const img = new Jimp(320, 200, '#ffefef');
  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
  img.print(font, 0, 80, {
    text: 'JagX',
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
  }, 320, 60);
  await img.writeAsync(path.join(assetsDir, 'sticker-template.png'));
}
async function createTTSVoice() {
  // Dummy file for demo
  fs.writeFileSync(path.join(assetsDir, 'tts-voice.mp3'), Buffer.alloc(1024));
}

(async () => {
  await createProfile();
  await createWelcome('welcome');
  await createWelcome('goodbye');
  await createMemeTemplate();
  await createAvatar();
  await createProfileCardBG();
  await createXPIcon();
  await createPollBanner();
  await createAIImage();
  await createStickerTemplate();
  await createTTSVoice();
  console.log('✅ JagX assets generated!');
})();