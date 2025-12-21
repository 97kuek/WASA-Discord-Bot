const { SlashCommandBuilder } = require('discord.js');
const configManager = require('../utils/configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set_target')
        .setDescription('カウントダウン目標を設定')
        .addStringOption(o => o.setName('date').setDescription('YYYY-MM-DD').setRequired(true))
        .addStringOption(o => o.setName('name').setDescription('イベント名').setRequired(true)),

    async execute(interaction) {
        const date = interaction.options.getString('date');
        const name = interaction.options.getString('name');

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date).getTime())) {
            return interaction.reply({ content: '❌ 日付形式が不正です。', ephemeral: true });
        }

        configManager.save(date, name);
        await interaction.reply(`✅ 目標を **${name}** (${date}) に設定しました。`);
    }
};