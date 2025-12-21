// 環境変数の読み込み
require('dotenv').config();

// discord.jsのライブラリの読み込み
const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, Events } = require('discord.js');

// 定時タスクのライブラリの読み込み
const cron = require('node-cron');

// utilsフォルダに格納された各ユーティリティの読み込み
const weatherUtil = require('./utils/weather');
const countdownUtil = require('./utils/countdown');

// commandsフォルダに格納された各コマンドの読み込み
const checkTf = require('./commands/check_tf');
const setTarget = require('./commands/set_target');
const countdownCmd = require('./commands/countdown');

// ボットの初期設定
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const commands = [checkTf.data, setTarget.data, countdownCmd.data];

const NOTIFY_CHANNEL_ID = 'あなたのチャンネルID';

client.once(Events.ClientReady, async () => {
    console.log(`Login successful: ${client.user.tag}`);

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(process.env.APPLICATION_ID), { body: commands.map(c => c.toJSON()) });
        console.log('Command registration completed');
    } catch (e) { console.error(e); }

    // --- 定時通知1：朝7:00 TF判定 ---
    cron.schedule('0 7 * * *', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const result = await weatherUtil.checkFujikawa(tomorrow, process.env.WEATHER_API_KEY);

        const channel = await client.channels.fetch(NOTIFY_CHANNEL_ID);
        const embed = new EmbedBuilder()
            .setTitle(`🌅 【定時予報】富士川TF判定`)
            .setColor(result.isOk ? 0x2ECC71 : 0xE74C3C)
            .addFields(
                { name: '翌日の判定', value: result.isOk ? '## ✅ 実施可能' : '## ❌ 中止推奨' },
                { name: '詳細', value: result.details }
            );
        channel.send({ embeds: [embed] });
    }, { timezone: "Asia/Tokyo" });

    // --- 定時通知2：朝8:00 目標カウントダウン ---
    cron.schedule('0 8 * * *', async () => {
        const text = countdownUtil.getCountdownText();
        const channel = await client.channels.fetch(NOTIFY_CHANNEL_ID);
        const embed = new EmbedBuilder()
            .setTitle('📢 本日のカウントダウン')
            .setDescription(text)
            .setColor(0x3498DB);
        channel.send({ embeds: [embed] });
    }, { timezone: "Asia/Tokyo" });
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'check_tf') await checkTf.execute(interaction);
    if (interaction.commandName === 'set_target') await setTarget.execute(interaction);
    if (interaction.commandName === 'countdown') await countdownCmd.execute(interaction);
});

// ボットの起動
client.login(process.env.DISCORD_TOKEN);