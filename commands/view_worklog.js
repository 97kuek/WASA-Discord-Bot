const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const worklogManager = require('../utils/worklogManager');

// ミリ秒を指定された単位に変換し、小数点以下2桁で丸める
const formatDuration = (ms, unit) => {
    if (unit === 'minutes') return (ms / (1000 * 60)).toFixed(2);
    if (unit === 'seconds') return (ms / 1000).toFixed(2);
    return (ms / (1000 * 60 * 60)).toFixed(2); // デフォルトは時間
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('log')
        .setDescription('作業時間の記録を表示します。')
        .addSubcommand(sub => sub.setName('summary').setDescription('期間を指定して作業時間の要約を表示します。')
            .addStringOption(opt => opt.setName('period').setDescription('集計期間').setRequired(true)
                .addChoices(
                    { name: '今週', value: 'week' },
                    { name: '今月', value: 'month' },
                    { name: '全期間', value: 'all' }
                ))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'summary') {
            const period = interaction.options.getString('period');
            const allSessions = worklogManager.getAllSessions();

            const now = new Date();
            let filteredSessions = [];
            let title = '';

            if (period === 'week') {
                const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
                filteredSessions = allSessions.filter(s => new Date(s.startTime) >= oneWeekAgo);
                title = '週間作業時間レポート';
            } else if (period === 'month') {
                const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
                filteredSessions = allSessions.filter(s => new Date(s.startTime) >= oneMonthAgo);
                title = '月間作業時間レポート';
            } else {
                filteredSessions = allSessions;
                title = '全期間 作業時間レポート';
            }

            const totalDurationMs = filteredSessions.reduce((acc, s) => acc + s.duration, 0);
            const totalHours = formatDuration(totalDurationMs, 'hours');
            const sessionCount = filteredSessions.length;

            const embed = new EmbedBuilder()
                .setTitle(`📊 ${title}`)
                .setColor(0xFEE75C)
                .addFields(
                    { name: '合計作業時間', value: `**${totalHours}** 時間`, inline: true },
                    { name: '合計セッション数', value: `**${sessionCount}** 回`, inline: true }
                );

            if (sessionCount > 0) {
                const recentSessions = filteredSessions.slice(-5).reverse(); // 直近5件
                const recentSessionsText = recentSessions.map(s => {
                    const start = new Date(s.startTime).toLocaleString('ja-JP');
                    const duration = formatDuration(s.duration, 'hours');
                    return `**${start}** - ${duration}時間`;
                }).join('\n');
                embed.addFields({ name: '直近のセッション', value: recentSessionsText || 'なし' });
            } else {
                 embed.setDescription('この期間の作業記録はありません。');
            }
            
            await interaction.reply({ embeds: [embed] });
        }
    }
};