const { Client, LocalAuth } = require('whatsapp-web.js');
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox'] }
});

client.on('ready', () => {
    console.log('🚀 البوت متصل! جاري استخراج المجموعات...');
    client.getChats().then(chats => {
        console.log('--- قائمة المجموعات المتاحة ---');
        chats.forEach(chat => {
            if (chat.isGroup) {
                console.log(`اسم المجموعة: ${chat.name} | الـ ID: ${chat.id._serialized}`);
            }
        });
        console.log('------------------------------');
    });
});

client.initialize();
