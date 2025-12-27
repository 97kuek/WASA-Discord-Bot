// 環境変数の読み込み
require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const express = require('express');

// discord.jsのライブラリの読み込み
const { Client, Collection, GatewayIntentBits, REST, Routes, Events } = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('WASA Bot is running!'));
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Web server is listening on port ${PORT}`);
});

// 定時タスクのライブラリの読み込み
const initializeCronTasks = require('./cron/tasks');

// utilsフォルダに格納された各ユーティリティの読み込み
const weatherUtil = require('./utils/weather');
const countdownUtil = require('./utils/countdown');
const configManager = require('./utils/configManager');
const worklogManager = require('./utils/worklogManager');

// ハンドラの読み込み
const commandHandler = require('./handlers/commandHandler');
const buttonHandler = require('./handlers/buttonHandler');
const modalSubmitHandler = require('./handlers/modalSubmitHandler');
const stringSelectMenuHandler = require('./handlers/stringSelectMenuHandler.js');
const messageHandler = require('./handlers/messageHandler');

// 設定ファイルを初期化
configManager.initialize();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages, // メッセージ受信に必要
        GatewayIntentBits.MessageContent  // メッセージの内容取得に必要
    ]
});

client.commands = new Collection();
const commands = [];
const commandPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

const logger = require('./utils/logger.js');

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    logger.log(client, 'Bot起動', `${client.user.tag}として正常に起動しました。`);
    initializeCronTasks(client);
});


client.on('messageCreate', async message => {
    try {
        await messageHandler(message, client);
    } catch (error) {
        console.error('An unexpected error occurred in messageCreate event:', error);
    }
});

client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            await commandHandler(interaction, client);
        } else if (interaction.isButton()) {
            await buttonHandler.handler(interaction);
        } else if (interaction.isModalSubmit()) {
            await modalSubmitHandler(interaction);
        } else if (interaction.isStringSelectMenu()) {
            await stringSelectMenuHandler(interaction);
        }
    } catch (error) {
        console.error('An unexpected error occurred in interactionCreate event:', error);
        // interactionCreate のエラーは各ハンドラで処理されるべきだが、ここでのcatchは念のため
        // 必要に応じて、ここでもユーザーへのエラー通知を検討
    }
});

// ボットの起動
client.login(process.env.DISCORD_TOKEN);