const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('ボットの各種設定を対話形式で行います。（管理者のみ）')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('⚙️ 総合設定パネル')
            .setDescription('ボットの各種設定をここから行えます。\n設定したい項目を下のボタンから選んでください。');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('settings-basic')
                    .setLabel('基本設定')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📝'),
                new ButtonBuilder()
                    .setCustomId('settings-countdown')
                    .setLabel('カウントダウン管理')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🎯'),
                new ButtonBuilder()
                    .setCustomId('settings-roles')
                    .setLabel('ロール管理')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('👥')
            );

        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true // 設定画面は実行者本人にしか見えないようにする
        });
    }
};