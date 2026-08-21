const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const express = require('express');

let qrCodeImage = '';
const app = express();
const PORT = process.env.PORT || 7860;

app.get('/', (req, res) => {
    if (qrCodeImage) {
        res.send(`
            <html dir="rtl">
            <body style="background: #111; color: #fff; text-align: center; font-family: sans-serif; padding-top: 40px;">
                <h2>مسح رمز QR الخاص ببوت الواتساب</h2>
                <img src="${qrCodeImage}" alt="QR Code" style="background: #fff; padding: 15px; border-radius: 10px; width: 280px; height: 280px;"/>
                <p>قم بتحديث الصفحة إذا انتهت صلاحية الرمز.</p>
            </body>
            </html>
        `);
    } else {
        res.send('<html dir="rtl"><body style="background: #111; color: #fff; text-align: center; padding-top: 50px;"><h2>🚀 البوت متصل ومستعد أو جاري تحميل الرمز... حدث الصفحة خلال ثوانٍ.</h2></body></html>');
    }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Web server running on port ${PORT}`));

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
});

client.on('qr', async (qr) => {
    console.log('⚡ تم توليد رمز QR جديد، افتح الرابط لمسحه فوراً.');
    try {
        qrCodeImage = await QRCode.toDataURL(qr);
    } catch (err) {
        console.log('Error generating QR', err);
    }
});

client.on('authenticated', () => {
    console.log('✅ تم مسح الرمز وتوثيق الحساب بنجاح!');
});

client.on('auth_failure', msg => {
    console.error('❌ فشل التوثيق:', msg);
});

client.on('ready', () => {
    console.log('🎉 البوت جاهز تماماً! جاري استخراج المجموعات...');
    qrCodeImage = '';
    
    client.getChats().then(chats => {
        console.log('=== قائمة المجموعات والـ IDs ===');
        chats.forEach(chat => {
            if (chat.isGroup) {
                console.log(`اسم المجموعة: ${chat.name} ===> ID: ${chat.id._serialized}`);
            }
        });
        console.log('===============================');
    }).catch(err => console.log('خطأ في جلب المجموعات:', err));
});

client.initialize();
            
