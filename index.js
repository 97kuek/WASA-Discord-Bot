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
app.listen(PORT, () => {
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
const stringSelectMenuHandler = require('./handlers/stringSelectMenuHandler');
const messageHandler = require('./handlers/messageHandler');

// ボットの初期設定
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

client.once(Events.ClientReady, async () => {
    configManager.initialize(); // ★ 起動時に設定を読み込んでキャッシュを作成
    console.log(`Login successful: ${client.user.tag}`);

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(process.env.APPLICATION_ID), { body: commands });
        console.log('Command registration completed');
    } catch (e) { console.error(e); }

    initializeCronTasks(client);
});


client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand() || interaction.isAutocomplete()) {
        commandHandler(interaction, client);
    } else if (interaction.isButton()) {
        buttonHandler.handler(interaction);
    } else if (interaction.isModalSubmit()) {
        modalSubmitHandler(interaction);
    } else if (interaction.isStringSelectMenu()) {
        stringSelectMenuHandler(interaction);
    }
});

client.on(Events.MessageCreate, messageHandler);

// ボットの起動
client.login(process.env.DISCORD_TOKEN);