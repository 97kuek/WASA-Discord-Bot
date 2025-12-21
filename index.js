// 環境変数の読み込み
require('dotenv').config();

// discord.jsのライブラリの読み込み
const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, Events } = require('discord.js');

// 定時タスクのライブラリの読み込み
const cron = require('node-cron');

// utilsフォルダに格納された各ユーティリティの読み込み
const weatherUtil = require('./utils/weather');
const countdownUtil = require('./utils/countdown');
const configManager = require('./utils/configManager');
const worklogManager = require('./utils/worklogManager');

// commandsフォルダに格納された各コマンドの読み込み
const commandFiles = {
    help: require('./commands/help'),
    check_tf: require('./commands/check_tf'),
    countdown: require('./commands/countdown'),
    worklog: require('./commands/view_worklog'),
    setting: require('./commands/setting'),
};

// ボットの初期設定
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages, // メッセージ受信に必要
        GatewayIntentBits.MessageContent  // メッセージの内容取得に必要
    ] 
});
const commands = Object.values(commandFiles).map(cmd => cmd.data);

client.once(Events.ClientReady, async () => {
    console.log(`Login successful: ${client.user.tag}`);

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(process.env.APPLICATION_ID), { body: commands.map(c => c.toJSON()) });
        console.log('Command registration completed');
    } catch (e) { console.error(e); }

    // --- 定時通知1：朝7:00 TF判定 ---
    cron.schedule('0 7 * * *', async () => {
        const config = configManager.load();
        if (!config.notifyChannelId) return console.log('通知チャンネルが設定されていません。');

        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const result = await weatherUtil.checkFujikawa(tomorrow, process.env.WEATHER_API_KEY);

            const channel = await client.channels.fetch(config.notifyChannelId);
            const embed = new EmbedBuilder()
                .setTitle(`🌅 【定時予報】富士川TF判定`)
                .setColor(result.isOk ? 0x2ECC71 : 0xE74C3C)
                .addFields(
                    { name: '翌日の判定', value: result.isOk ? '## ✅ 実施可能' : '## ❌ 中止推奨' },
                    { name: '詳細', value: result.details }
                );
            await channel.send({ embeds: [embed] });
        } catch (e) { console.error('TF判定の定時通知中にエラーが発生しました:', e); }
    }, { timezone: "Asia/Tokyo" });

    // --- 定時通知2：朝8:00 目標カウントダウン ---
    cron.schedule('0 8 * * *', async () => {
        const config = configManager.load();
        if (!config.notifyChannelId) return console.log('通知チャンネルが設定されていません。');
        
        try {
            const text = countdownUtil.getCountdownText();
            if (text === '現在、目標は設定されていません。') return; // 目標がない場合は送信しない

            const channel = await client.channels.fetch(config.notifyChannelId);
            const embed = new EmbedBuilder()
                .setTitle('📢 本日のカウントダウン')
                .setDescription(text)
                .setColor(0x3498DB);
            await channel.send({ embeds: [embed] });
        } catch (e) { console.error('カウントダウンの定時通知中にエラーが発生しました:', e); }
    }, { timezone: "Asia/Tokyo" });
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('role-assign-')) {
            const roleName = interaction.customId.split('-')[2];
            if (!roleName) return;

            await interaction.deferReply({ ephemeral: true });

            try {
                const { guild } = interaction;
                const member = interaction.member;

                let role = guild.roles.cache.find(r => r.name === roleName);

                if (!role) {
                    console.log(`ロール "${roleName}" が見つかりません。新規作成します。`);
                    role = await guild.roles.create({
                        name: roleName,
                        mentionable: true,
                        reason: '自動ロール付与機能による作成',
                    });
                     console.log(`ロール "${roleName}" を作成しました。`);
                }

                if (member.roles.cache.has(role.id)) {
                    await member.roles.remove(role);
                    await interaction.editReply(`ロール **${role.name}** を解除しました。`);
                } else {
                    await member.roles.add(role);
                    await interaction.editReply(`ロール **${role.name}** を付与しました！`);
                }
            } catch (e) {
                console.error('ロールの付与/解除中にエラーが発生しました:', e);
                await interaction.editReply('エラーが発生しました。サーバー管理者に、Botが「ロールの管理」権限を持っているか確認してください。');
            }
        }
        return;
    }

    const command = commandFiles[interaction.commandName];
    if (!command) return;

    if (interaction.isAutocomplete()) {
        if (command.autocomplete) {
            await command.autocomplete(interaction);
        }
    } else if (interaction.isChatInputCommand()) {
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'コマンド実行中にエラーが発生しました！', ephemeral: true });
            } else {
                await interaction.reply({ content: 'コマンド実行中にエラーが発生しました！', ephemeral: true });
            }
        }
    }
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot || !message.inGuild()) return;

    const config = configManager.load();
    if (message.channel.id !== config.workChannelId) return;

    const content = message.content.trim();

    if (content === 'あけた') {
        const result = worklogManager.startSession(message.author.id);
        await message.reply(result.message);
    } else if (content === 'しめた') {
        const result = worklogManager.endSession(message.author.id);
        await message.reply(result.message);
    }
});

// ボットの起動
client.login(process.env.DISCORD_TOKEN);