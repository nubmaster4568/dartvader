const TelegramBot = require('node-telegram-bot-api');

// Replace 'YOUR_BOT_API_TOKEN' with your actual bot token
const token = '7403034731:AAEU50Yc_gG3PMkW9Pci1PvjZUEgTuYaCBg';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

// Start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // Send a message with a keyboard asking for location
  bot.sendMessage(chatId, "Hi! Please share your location with me.", {
    "reply_markup": {
      "keyboard": [
        [{
          text: "Share Location", 
          request_location: true
        }]
      ],
      "one_time_keyboard": true,
      "resize_keyboard": true
    }
  });
});

// Handle location data
bot.on('location', (msg) => {
  const chatId = msg.chat.id;
  const location = msg.location;

  if (location) {
    const latitude = location.latitude;
    const longitude = location.longitude;

    bot.sendMessage(chatId, `Thanks! I received your location:\nLatitude: ${latitude}\nLongitude: ${longitude}`);
  } else {
    bot.sendMessage(chatId, "Sorry, I couldn't retrieve your location.");
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.log(error);
});
