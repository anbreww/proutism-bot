# Proutometer Server

Backend interface to talk to the Telegram bot and update the database.

## Setting up

For firebase, you need a service account json file. place it in the `config/`
folder. Then copy each of the `*_sample.js` config files to a new file without
the trailing `_sample` and replace with the data for your app.

Then install node, and run

```bash
npm install
```

from the project folder, to install dependencies.

Then start the server with

```bash
node index.js
```

and start sending messages to the bot on Telegram.

## Getting docker set up

Build the image

```bash
docker build -t tunebird/proutism-bot .
```

Run it

```bash
docker run tunebird/proutism-bot
```

## Author

Andrew Watson - 2017