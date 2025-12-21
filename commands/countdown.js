const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const configManager = require('../utils/configManager');
const countdownUtil = require('../utils/countdown');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('countdown')
        .setDescription('目標日までのカウントダウンを管理します。')
        .addSubcommand(sub => sub.setName('show').setDescription('現在のカウントダウンを表示します。'))
        .addSubcommand(sub => sub.setName('list').setDescription('設定されているすべての目標を一覧表示します。'))
        .addSubcommand(sub => sub.setName('add').setDescription('新しいカウントダウン目標を追加します。')
            .addStringOption(o => o.setName('date').setDescription('日付 (YYYY-MM-DD)').setRequired(true))
            .addStringOption(o => o.setName('name').setDescription('イベント名').setRequired(true)))
        .addSubcommand(sub => sub.setName('remove').setDescription('カウントダウン目標を削除します。')
            .addStringOption(option => option.setName('id').setDescription('削除する目標のID').setRequired(true).setAutocomplete(true))),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const targets = configManager.getTargets();
        const choices = targets.map(target => ({
            name: `${target.name} (${target.date})`,
            value: String(target.id)
        }));
        const filtered = choices.filter(choice => choice.name.includes(focusedValue));
        await interaction.respond(filtered);
    },

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'show': {
                const text = countdownUtil.getCountdownText();
                const embed = new EmbedBuilder()
                    .setTitle('本日のカウントダウン')
                    .setDescription(text)
                    .setColor(0x3498DB)
                    .setTimestamp();
                await interaction.reply({ embeds: [embed] });
                break;
            }
            case 'list': {
                const targets = configManager.getTargets();
                if (targets.length === 0) {
                    return interaction.reply({ content: '現在、目標は設定されていません。', ephemeral: true });
                }
                const embed = new EmbedBuilder()
                    .setTitle('🎯 設定中のカウントダウン目標')
                    .setColor(0x3498DB);

                const description = targets.map(target => {
                    const targetDate = new Date(target.date + 'T00:00:00+09:00');
                    const now = new Date();
                    const diffDays = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
                    let countdownText;
                    if (diffDays > 0) countdownText = `あと **${diffDays}** 日`;
                    else if (diffDays === 0) countdownText = '**本日です！**';
                    else countdownText = '終了しました';
                    return `**${target.name}** (${target.date})\n> ID: ${target.id} | ${countdownText}`;
                }).join('\n\n');

                embed.setDescription(description);
                await interaction.reply({ embeds: [embed] });
                break;
            }
            case 'add': {
                const date = interaction.options.getString('date');
                const name = interaction.options.getString('name');
                if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date).getTime())) {
                    return interaction.reply({ content: '日付の形式が不正です。YYYY-MM-DD形式で入力してください。', ephemeral: true });
                }
                const newTarget = configManager.addTarget(date, name);
                await interaction.reply(`新しい目標 **${newTarget.name}** (${newTarget.date}) を追加しました！`);
                break;
            }
            case 'remove': {
                const targetId = parseInt(interaction.options.getString('id'));
                if (isNaN(targetId)) {
                    return interaction.reply({ content: 'IDは有効な数値である必要があります。', ephemeral: true });
                }
                const success = configManager.removeTarget(targetId);
                if (success) {
                    await interaction.reply({ content: '目標を削除しました。', ephemeral: true });
                } else {
                    await interaction.reply({ content: '指定されたIDの目標が見つかりませんでした。', ephemeral: true });
                }
                break;
            }
        }
    }
};