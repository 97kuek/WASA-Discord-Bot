const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const weatherUtil = require('../utils/weather');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tf')
        .setDescription('富士川の滑空場におけるTF実施判定')
        .addStringOption(opt => opt.setName('when').setDescription('判定日').setRequired(true).addChoices({ name: '今日', value: '0' }, { name: '明日', value: '1' })),

    async execute(interaction) {
        await interaction.deferReply();
        const diff = parseInt(interaction.options.getString('when'));
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + diff);

        const result = await weatherUtil.checkFujikawa(targetDate, process.env.WEATHER_API_KEY);

        const embed = new EmbedBuilder()
            .setTitle(`TF実施判断@富士川滑空場: ${targetDate.toLocaleDateString('ja-JP')}`)
            .setColor(result.isOk ? 0x2ECC71 : 0xE74C3C)
            .addFields(
                { name: '判定', value: result.isOk ? 'Go' : 'NoGo' },
                { name: '詳細（風向・風速・横風）', value: result.details }
            );

        await interaction.editReply({ embeds: [embed] });
    }
};