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
                { name: '---', value: '\u200B' }, // Spacer
                { name: '📅 カウントダウン', value: '`/countdown <subcommand>`' },
                { name: '`show`', value: 'すべてのカウントダウンを表示します。', inline: true },
                { name: '`list`', value: 'すべての目標をID付きで一覧表示します。', inline: true },
                { name: '`add`', value: '新しい目標を追加します。', inline: true },
                { name: '`remove`', value: 'IDを指定して目標を削除します。', inline: true },
                { name: '---', value: '\u200B' }, // Spacer
                { name: '📊 作業記録', value: '`/worklog <subcommand>`' },
                { name: '`summary`', value: '週/月/全期間の作業時間を集計して表示します。', inline: true },
                { name: '---', value: '\u200B' }, // Spacer
                { name: '☀️ 天候', value: '`/check_tf`' },
                { name: '`today`/`tomorrow`', value: '富士川滑空場のTF実施可否を判定します。', inline: true },
                { name: '---', value: '\u200B' }, // Spacer
                { name: '⚙️ 設定 (管理者のみ)', value: '`/setting <subcommand>`' },
                { name: '`notifications`', value: '定時通知を送信するチャンネルを設定します。', inline: true },
                { name: '`worklog_channel`', value: '作業記録を行うチャンネルを設定します。', inline: true },
                { name: '`roles_panel`', value: 'ロール付与パネルを設置します。', inline: true },
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};