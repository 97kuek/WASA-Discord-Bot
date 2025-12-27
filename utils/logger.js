const { EmbedBuilder } = require('discord.js');
const configManager = require('./configManager');

/**
 * ログを送信するための内部関数
 * @param {Client} client - Discordクライアント
 * @param {EmbedBuilder} embed - 送信するEmbed
 */
async function sendLog(client, embed) {
    const { logChannelId } = configManager.getConfig();
    if (!logChannelId) {
        // console.log('ログチャンネルが設定されていないため、コンソールに出力します。', embed.data.description);
        return;
    }

    try {
        const channel = await client.channels.fetch(logChannelId);
        if (channel && channel.isTextBased()) {
            await channel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error(`ログチャンネルへの送信に失敗しました (ID: ${logChannelId})`, error);
    }
}

/**
 * 通常の情報をログとして送信します。
 * @param {Client} client - Discordクライアント
 * @param {string} title - ログのタイトル
 * @param {string} message - ログの本文
 */
async function log(client, title, message) {
    const embed = new EmbedBuilder()
        .setColor(0x3498DB) // Blue
        .setTitle(`ℹ️ ${title}`)
        .setDescription(message)
        .setTimestamp();
    
    await sendLog(client, embed);
}

/**
 * エラー情報をログとして送信します。
 * @param {Client} client - Discordクライアント
 * @param {Error} error - Errorオブジェクト
 * @param {string} [context='エラーが発生しました'] - エラーの発生状況を示すタイトル
 */
async function error(client, error, context = 'エラーが発生しました') {
    const embed = new EmbedBuilder()
        .setColor(0xE74C3C) // Red
        .setTitle(`❌ ${context}`)
        .setDescription(`**エラーメッセージ:**\n\
\
\
${error.message}\
\
\
`)
        .addFields({ name: 'スタックトレース', value: `\
\
\
${error.stack || 'N/A'}\
\
\
` })
        .setTimestamp();
        
    await sendLog(client, embed);
}

module.exports = {
    log,
    error,
};
