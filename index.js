const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const express = require('express');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 7860;
let qrCodeImage = '';

// الرابط الخاص بقاعدة بياناتك (تم تصحيحه)
const MONGODB_URI = "mongodb+srv://abdu:abdu12345@cluster0.rowbp8x.mongodb.net/?appName=Cluster0";

app.get('/', (req, res) => {
    if (qrCodeImage) {
        res.send(`<html dir="rtl"><body style="background:#111;color:#fff;text-align:center;padding-top:40px;"><h2>مسح رمز QR لمرة واحدة فقط</h2><img src="${qrCodeImage}" style="background:#fff;padding:15px;border-radius:10px;width:280px;height:280px;"/><p>حدث الصفحة إذا طال الانتظار.</p></body></html>`);
    } else {
        res.send('<html dir="rtl"><body style="background:#111;color:#fff;text-align:center;padding-top:50px;"><h2>🚀 البوت متصل ومستقر في قاعدة البيانات.</h2></body></html>');
    }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Web server running on port ${PORT}`));

// الاتصال بقاعدة البيانات
mongoose.connect(MONGODB_URI).then(() => {
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح!');
    
    const store = new MongoStore({ mongoose: mongoose });
    const client = new Client({
        authStrategy: new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 300000 
        }),
        puppeteer: { 
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
        }
    });

    client.on('qr', async (qr) => {
        console.log('⚡ تم توليد رمز QR، افتح الموقع لمسحه.');
        qrCodeImage = await QRCode.toDataURL(qr);
    });

    client.on('remote_session_saved', () => {
        console.log('💾 [نجاح] تم حفظ الجلسة في MongoDB! لن يطلب الرمز مجدداً.');
    });

    client.on('ready', () => {
        console.log('🎉 البوت جاهز تماماً!');
        qrCodeImage = '';
        client.getChats().then(chats => {
            console.log('=== قائمة المجموعات المتاحة ===');
            chats.forEach(chat => {
                if (chat.isGroup) console.log(`المجموعة: ${chat.name} | ID: ${chat.id._serialized}`);
            });
        });
    });

    client.initialize();
}).catch(err => {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات (تحقق من الرابط أو إعدادات IP):', err);
});
