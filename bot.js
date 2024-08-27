const { Telegraf } = require('telegraf');
const express = require('express');
const app = express();
const port = process.env.PORT || 32020;

const token = '7478644585:AAHI1uitIHsscNBLE7F-h-WpljjnR4zQec4';
const bot = new Telegraf(token);

// Handle /start command
bot.start((ctx) => {
  const chatId = ctx.chat.id;
  console.log(chatId);

  ctx.reply('SHOP', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'SHOP',
            web_app: { url: `https://vader-g34v.onrender.com/?userId=${chatId}` }
          }
        ]
      ]
    }
  });
});

// Handle /admin command
bot.command('admin', (ctx) => {
  const chatId = ctx.chat.id;
  console.log(chatId);

  ctx.reply('SHOP', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'SHOP',
            web_app: { url: `https://vader-g34v.onrender.com/admin/admin.html?userId=${chatId}` }
          }
        ]
      ]
    }
  });
});
bot.command('location', (ctx) => {
  const chatId = ctx.chat.id;
  console.log(chatId);

  ctx.reply('SHOP', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'SHOP',
            web_app: { url: `https://vader-g34v.onrender.com/index2.html` }
          }
        ]
      ]
    }
  });
});
// Start the bot
bot.launch();

// Express route for the root
app.get('/', (req, res) => {
  res.send('Telegram Bot is running');
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
