const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const weatherUtil = require('../utils/weather');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('check_tf')
        .setDescription('富士川のTF判定（気象条件のみ）')
        .addStringOption(opt => opt.setName('when').setDescription('判定日').setRequired(true).addChoices({ name: '今日', value: '0' }, { name: '明日', value: '1' })),

    async execute(interaction) {
        await interaction.deferReply();
        const diff = parseInt(interaction.options.getString('when'));
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + diff);

        const result = await weatherUtil.checkFujikawa(targetDate, process.env.WEATHER_API_KEY);

        const embed = new EmbedBuilder()
            .setTitle(`富士川TF判定: ${targetDate.toLocaleDateString('ja-JP')}`)
            // .setDescription を削除
            .setColor(result.isOk ? 0x2ECC71 : 0xE74C3C)
            .addFields(
                { name: '判定', value: result.isOk ? '# ✅ 実施可能' : '# ❌ 中止推奨' },
                { name: '詳細（風向・風速・横風）', value: result.details }
            );

        await interaction.editReply({ embeds: [embed] });
    }
};