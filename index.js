require('dotenv').config({path: 'variables.env'})

// Telegram config
const config = require('./config/config.js')
const token = config.bot_token;

// Firebase config
const firebase_config = require('./config/firebase_config.js')
const serviceAccount = require('./config/proutometer_serviceaccount.json')


const TelegramBot = require('node-telegram-bot-api');
const firebase_admin = require('firebase-admin');


// state is global for now, this could probably be improved.
const proutism = {}
let registrationList = {}

console.log("Proutism bot launching.")


// set up the database connection, callback will update the global app state.
firebase_config.credential = firebase_admin.credential.cert(serviceAccount)
firebase_admin.initializeApp(firebase_config);

var proutismRef = firebase_admin.database().ref('/proutism/');
proutismRef.on('value', function(snapshot) {
  console.log('Received data from firebase DB')
  console.log(snapshot.val())
    updateProutism(snapshot.val());
})

const reg_url = `/registrations/${process.env.NODE_ENV}/`
var registrationRef = firebase_admin.database().ref(reg_url);
registrationRef.on('value', function(snapshot) {
  console.log('Registration list updated')
  registrationList = snapshot.val()
  console.log(registrationList)
})

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

// Matches "/get" and "/getproutism"
bot.onText(/\/get\w*(proutism)? ?(.*)/i, (msg, match) => {

  const chatId = msg.chat.id;
  const username = msg.from.first_name; // Telegram name of the sender

  const message = proutism.level ?
    `Proutism is ${proutism.level}` :
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

// This command gets sent the first time we start a conversation with the bot.
bot.onText(/\/start/i, (msg, match) => {
  console.log(`Conversation with new user : ${msg.from.first_name}`)
})

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

bot.onText(/\/register/i, (msg, match) => {
  const name = msg.from.first_name;
  const userId = msg.from.id;
  console.log(`received registration request from ${name} (id ${userId}`)
  const registration = {}
  registration[userId] = {
    name,
    registered: true
  };
  console.log(registration);
  registrationRef.update(registration);

  const message = `
Thanks for registering, ${name}. 
You will get updates when the proutism level changes
`
  bot.sendMessage(msg.chat.id, message, {parse_mode: 'Markdown'})

})

bot.onText(/\/unregister/i, (msg, match) => {
  const name = msg.from.first_name;
  const userId = msg.from.id;
  console.log(`received DE-registration request from ${name} (id ${userId}`)
  const registration = {}
  registration[userId] = {
    name,
    registered: false
  };
  console.log(registration);
  registrationRef.update(registration);

  const message = `
Oh no ${name} :( So sad to see you go! 
You will no longer receive updates when the proutism level changes.
`
  bot.sendMessage(msg.chat.id, message, {parse_mode: 'Markdown'})
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
    if (!msg.text.match(/(get|set|register|unregister)/)) {
      const text = `
💩 *Hello and welcome to the ProutismBot.* 💩

I can help you see and change the current level of proutism.
Use the following commands to interact with me :

/getproutism - get the current level of proutism
/setproutism - set a new level of proutism.
/register - receive notifications every time the proutism changes
/unregister - stop receiving notifications

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
  console.log(newProutism)
  const prout = newProutism.proutism;
  const author = newProutism.author;
  console.log(`Got new proutism value from database: ${prout}`);
  proutism['level'] = `${prout}/7`;
  proutism['author'] = author;


  // notify everyone that the level has changed
  for (let userId in registrationList) {
    let {name, registered} = registrationList[userId]

    console.log(`${name} (id ${userId}) ${registered?'gets':'doesn\'t get'} an update`)

    if (registered === true) {
      notifyUser(userId);
    } 
  }
}

function notifyUser(userId) {
  const message = `
Ouh la la, the proutism has just been updated to *${proutism.level}*
by _${proutism.author}_
`
  bot.sendMessage(userId, message, {
    disable_notification:true,
    parse_mode: 'Markdown'
  })
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
