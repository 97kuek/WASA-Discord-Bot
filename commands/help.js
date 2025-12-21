const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('利用可能なすべてのコマンドを表示します。'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Bot コマンドヘルプ')
            .setColor(0x5865F2)
            .setDescription('このBotで利用できるコマンドの一覧です。')
            .addFields(
                { name: '`/help`', value: 'このヘルプメッセージを表示します。' },
                { name: '`/cd`', value: '設定された目標までのカウントダウンを表示します。' },
                { name: '`/log <期間>`', value: '作業記録の要約を表示します。（期間: `今週`, `今月`, `全期間`）' },
                { name: '`/tf <日時>`', value: '富士川滑空場のTF実施可否を判定します。（日時: `今日`, `明日`）' },
                { name: '---', value: '\u200B' },
                { name: '`/settings` (管理者のみ)', value: 'ボットのすべての設定を対話形式で行います。通知チャンネル、カウントダウン目標、ロールなどを一括で管理できます。' }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};