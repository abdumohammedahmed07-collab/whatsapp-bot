const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const express = require('express');
const fs = require('fs');
const crypto = require('crypto');

let qrCodeImage = '';

// --- سيرفر يعرض رمز QR كصورة حقيقية واضحة جداً ---
const app = express();
app.get('/', (req, res) => {
    if (qrCodeImage) {
        res.send(`
            <html dir="rtl">
            <body style="background: #111; color: #fff; text-align: center; font-family: sans-serif; padding-top: 50px;">
                <h2>مسح رمز QR الخاص ببوت الواتساب</h2>
                <img src="${qrCodeImage}" alt="QR Code" style="background: #fff; padding: 20px; border-radius: 10px; width: 300px; height: 300px;"/>
                <p>قم بتحديث الصفحة (Refresh) إذا انقضى وقت الرمز.</p>
            </body>
            </html>
        `);
    } else {
        res.send('<html dir="rtl"><body style="background: #111; color: #fff; text-align: center; padding-top: 50px;"><h2>البوت يعمل أو يقوم بالاتصال، انتظر قليلاً وحدث الصفحة...</h2></body></html>');
    }
});

app.listen(7860, '0.0.0.0', () => console.log('Web server running on port 7860'));

// --- الإعدادات والكلمات المفتاحية ---
const TARGET_GROUP_ID = "1234567890-group@g.us"; // ⚠️ ضع آيدي مجموعتك هنا بدقة
const HISTORY_FILE = "sent_history.txt";

const KEYWORDS = [
    "الواجب", "ابغى احد", "احد يعرف ي", "أبي حد", "أبغى حد", "أبغى احد",
    "فيه احد ي", "ابغى حد", "اريد", "محتاج", "واجب", "تحل", "ابي احد",
    "ابي واحد", "مشاريع", "واجبات", "يسوي", "فيه حد يعرف", "تسوي",
    "ابغا حد", "أبغا احد", "تعرفون احد ي", "تعرفون حد ي", "الواجبات",
    "مشروع", "بحث", "يكون فاهم", "حد يسوي", "عندي مشروع", "احد يحل",
    "تعرفون حد يسوي", "في احد يعرف", "في احد ي", "برزنتيشن",
    "من يعرف يسويه", "عندي بحث", "احد فاهم", "ابا احد", "احتاج احد",
    "تكليف", "العرض التقديمي", "يحل"
];

function checkIfSent(msgHash) {
    if (!fs.existsSync(HISTORY_FILE)) return false;
    const data = fs.readFileSync(HISTORY_FILE, 'utf8');
    return data.includes(msgHash);
}

function saveToHistory(msgHash) {
    fs.appendFileSync(HISTORY_FILE, msgHash + "\n");
}

function countEmojis(text) {
    const emojis = text.match(/[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu);
    return emojis ? emojis.length : 0;
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
});

client.on('qr', async (qr) => {
    console.log('--- تم توليد رمز QR، افتح رابط موقعك على Render لرؤيته بوضوح ---');
    try {
        qrCodeImage = await QRCode.toDataURL(qr);
    } catch (err) {
        console.log('Error generating QR image', err);
    }
});

client.on('ready', () => {
    console.log('🚀 بوت واتساب يعمل الآن بكفاءة وبنفس الفلاتر المطلوبة!');
    qrCodeImage = ''; // إخفاء الكود بعد نجاح الربط
});

client.on('message', async msg => {
    try {
        if (!msg.from.endsWith('@g.us') || msg.from === TARGET_GROUP_ID) return;

        const content = msg.body || "";
        const contentLower = content.toLowerCase().trim();

        let matched = false;
        for (let kw of KEYWORDS) {
            let pattern = new RegExp('\\b' + kw.trim() + '\\b', 'i');
            if (pattern.test(contentLower)) {
                matched = true;
                break;
            }
        }
        if (!matched) return;

        if (contentLower.length > 100 || /\d{7,15}/.test(contentLower)) return;
        if (countEmojis(content) > 1) return;

        const senderId = msg.author || msg.from;
        const hashString = `${senderId}_${contentLower}`;
        const msgHash = crypto.createHash('md5').update(hashString).digest('hex');

        if (checkIfSent(msgHash)) return;
        saveToHistory(msgHash);

        const contact = await msg.getContact();
        const chat = await msg.getChat();
        const senderName = contact.pushname || contact.number || "مستخدم";

        let infoMessage = (
            `📝 *رسالة مهمة مرصودة*\n\n` +
            `👤 *المرسل:* ${senderName}\n` +
            `📱 *رقم التواصل:* wa.me/${contact.number}\n\n` +
            `📢 *المجموعة:* ${chat.name}\n\n` +
            `✅ *الرسالة الأصلية محولة أدناه:*`
        );

        await client.sendMessage(TARGET_GROUP_ID, infoMessage);
        try {
            await msg.forward(TARGET_GROUP_ID);
        } catch (err) {
            await client.sendMessage(TARGET_GROUP_ID, `🔄 *محتوى الرسالة:*\n${content}`);
        }

    } catch (e) {
        console.log("Error:", e);
    }
});

client.initialize();
    
