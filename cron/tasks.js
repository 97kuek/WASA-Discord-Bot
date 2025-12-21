const cron = require('node-cron');
const { EmbedBuilder } = require('discord.js');
const configManager = require('../utils/configManager');
const weatherUtil = require('../utils/weather');
const countdownUtil = require('../utils/countdown');

module.exports = (client) => {
    // --- 定時通知1：朝7:00 TF判定 ---
    cron.schedule('0 7 * * *', async () => {
        const config = configManager.getConfig();
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
        const config = configManager.getConfig();
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
};