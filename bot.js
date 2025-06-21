const { Client, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

const client = new Client();

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot WhatsApp siap!');
});

client.on('message', async msg => {
    // Fitur: Bikin stiker dari teks
    if (msg.body.startsWith('stiker ')) {
        const text = msg.body.slice(7).trim();
        const pngPath = 'stiker-teks.png';
        const outputWebp = 'stiker-text.webp';

        const { createCanvas } = require('canvas');
        const canvas = createCanvas(512, 512);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, 512, 512);

        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(text, 256, 256);

        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(pngPath, buffer);

        ffmpeg(pngPath)
            .outputOptions(['-vcodec', 'libwebp', '-filter:v', 'scale=512:512'])
            .toFormat('webp')
            .save(outputWebp)
            .on('end', async () => {
                const media = MessageMedia.fromFilePath(outputWebp);
                await msg.reply(media, null, { sendMediaAsSticker: true });
                fs.unlinkSync(pngPath);
                fs.unlinkSync(outputWebp);
            });
    }

    // Fitur: Bikin stiker dari gambar
    if (msg.hasMedia && msg.body.toLowerCase().includes('stiker')) {
        const media = await msg.downloadMedia();
        const imageBuffer = Buffer.from(media.data, 'base64');
        const inputPath = 'input.jpg';
        const outputPath = 'stiker-gambar.webp';

        fs.writeFileSync(inputPath, imageBuffer);

        ffmpeg(inputPath)
            .outputOptions(['-vcodec', 'libwebp', '-vf', 'scale=512:512'])
            .toFormat('webp')
            .save(outputPath)
            .on('end', async () => {
                const sticker = MessageMedia.fromFilePath(outputPath);
                await msg.reply(sticker, null, { sendMediaAsSticker: true });
                fs.unlinkSync(inputPath);
                fs.unlinkSync(outputPath);
            });
    }
});

client.initialize();
