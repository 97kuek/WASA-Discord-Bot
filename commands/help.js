const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('利用可能なすべてのコマンドを表示します。'),

    async execute(interaction) {
        const { commands } = interaction.client;
        const embed = new EmbedBuilder()
            .setTitle('🤖 Bot コマンドヘルプ')
            .setColor(0x5865F2)
            .setDescription('このBotで利用できるスラッシュコマンドの一覧です。');

        const commandList = commands
            .map(cmd => {
                return {
                    name: `\`/${cmd.data.name}\``,
                    value: cmd.data.description || '説明がありません。',
                    inline: false,
                };
            });

        embed.addFields(commandList)
             .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};