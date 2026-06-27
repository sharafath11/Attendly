const { Client, LocalAuth } = require('whatsapp-web.js');
const client = new Client({
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});
client.initialize().then(() => console.log('Init success')).catch(e => console.error('Init failed', e));
