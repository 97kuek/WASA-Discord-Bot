const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const countdownUtil = require('../utils/countdown');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('countdown')
        .setDescription('目標日までのカウントダウンを表示します'),

    async execute(interaction) {
        const text = countdownUtil.getCountdownText();
        const embed = new EmbedBuilder()
            .setTitle('🏁 チーム目標カウントダウン')
            .setDescription(text)
            .setColor(0x3498DB)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};