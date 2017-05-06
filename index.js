// Telegram config
const config = require('./config/config.js')
const token = config.bot_token;

// Firebase config
const firebase_config = require('./config/firebase_config.js')
const serviceAccount = require('./config/proutometer-serviceaccount.json')


const TelegramBot = require('node-telegram-bot-api');
const firebase_admin = require('firebase-admin');


// state is global for now, this could probably be improved.
const proutisme = {}

console.log("Proutism bot launching.")


// set up the database connection, callback will update the global app state.
firebase_config.credential = firebase_admin.credential.cert(serviceAccount)
firebase_admin.initializeApp(firebase_config);

var proutismRef = firebase_admin.database().ref('/');
proutismRef.on('value', function(snapshot) {
  console.log(snapshot.val())
    updateProutism(snapshot.val().proutism);
})

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

// Matches "/get" and "/getproutism"
bot.onText(/\/get\w*(proutism)? ?(.*)/i, (msg, match) => {

  const chatId = msg.chat.id;
  const username = msg.from.first_name; // Telegram name of the sender

  const message = proutisme.level ?
    `Proutism is ${proutisme.level}` :
    `Sorry ${username}, proutism level is currently unkown`;

  bot.sendMessage(chatId, message);
});

// Matches "/set [value]" and "/setproutism [value]"
bot.onText(/\/set(proutism)? (.+)/i, (msg, match) => {
  const chatId = msg.chat.id;
  const username = msg.from.first_name
  const value = match[2];

  const message = msg.chat.type === 'group' ?
  `Proutism was set to ${value}/7 by _${username}_` :
  `You set the _proutism_ to *${value}/7*`

  bot.sendMessage(chatId, message, {parse_mode: 'Markdown'});

  saveProutism(value, username)
});

// Matches "/set" and "/setproutism" with nothing after
bot.onText(/\/set(proutism?)$/i, (msg, match) => {
  console.log("empty proutism command")

  const chatId = msg.chat.id;
  const message = `
Derp. You forgot to mention the proutism level...

Use the command like this:

/setproutism 5

To set a proutism level of 5/7
  `
  bot.sendMessage(chatId, message, {parse_mode: 'Markdown'});
})

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  console.log(`Message from ${msg.from.first_name} :`)
  console.log(msg)

  // avoid running this in a group chat!
  if (msg.chat.type === 'private') {
    // try to give some helpful hints.
    if (!msg.text.match(/(get|set)/)) {
      const text = `
💩 *Hello and welcome to the ProutismBot.* 💩

I can help you see and change the current level of proutism.
Use the following commands to interact with me :

/getproutism - get the current level of proutism
/setproutism - set a new level of proutism.

💩 Have fun! 💩
      `
      bot.sendMessage(chatId, text, {parse_mode: 'Markdown'});
    }
  }

  // send a message to the chat acknowledging receipt of their message
  //bot.sendMessage(chatId, 'Received your message');
});

// inline query : not implemented
bot.on('inline_query', (msg) => {
  console.log("inline query:")
  console.log(msg);
})

// update the app state when the database publishes a new value
function updateProutism(newProutism) {
  console.log(`New proutism value: ${newProutism}`);
  proutisme['level'] = `${newProutism}/7`;
}

// save a new state to the database with the current timestamp
function saveProutism(newProutism, author) {
  author = author || "Anonymous";
  console.log(`Saving new proutism ${newProutism} to database`);
  console.log(`Operation initiated by ${author}`);
  proutismRef.set({
    proutism: newProutism,
    author: author,
    timestamp: + new Date()
  })
}
