const TelegramBot = require('node-telegram-bot-api');
const { Telegraf } = require('telegraf');

// Replace 'YOUR_BOT_API_TOKEN' with your actual bot token

// Replace 'YOUR_BOT_SHORT_NAME' with a short name for your bot on Telegraph
const short_name = 'YOUR_BOT_SHORT_NAME';

// Create a bot that uses 'polling' to fetch new updates
const bot = new Telegraf('7403034731:AAFKq8o7qBvkCJ3HmMz_PSfmksmHSoQu8kM');

// // Start command
bot.start((ctx) => {
  // Send a message with a button to open the shop and a separate inline button for location
  ctx.reply('Welcome! Click the button below to visit the shop and share your location:', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Open Shop',
            web_app: { url: 'https://vader-g34v.onrender.com' }
          },
          {
            text: 'Share Location',
            callback_data: 'request_location' // Use a callback for the location request
          }
        ]
      ]
    }
  });
});

// Handle location data
bot.on('location', (ctx) => {
  const location = ctx.message.location;

  if (location) {
    const latitude = location.latitude;
    const longitude = location.longitude;

    // Send the location details back to the user
    ctx.reply(`Thanks! I received your location:\nLatitude: ${latitude}\nLongitude: ${longitude}`);
  } else {
    ctx.reply("Sorry, I couldn't retrieve your location.");
  }
});

// Error handling
bot.catch((err) => {
  console.log('Error:', err);
});

// Start polling for updates
bot.launch().then(() => {
  console.log('Bot is running...');
});