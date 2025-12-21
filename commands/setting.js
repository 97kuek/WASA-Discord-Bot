const { SlashCommandBuilder, PermissionsBitField, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const configManager = require('../utils/configManager');

const ROLES = [
    { name: '翼班', style: ButtonStyle.Primary, emoji: '✈️' },
    { name: '駆動・フレーム班', style: ButtonStyle.Secondary, emoji: '⚙️' },
    { name: 'プロペラ班', style: ButtonStyle.Primary, emoji: '🔄' },
    { name: 'フェアリング班', style: ButtonStyle.Secondary, emoji: '🚀' },
    { name: '電装班', style: ButtonStyle.Primary, emoji: '💡' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setting')
        .setDescription('ボットの各種設定を行います。（管理者のみ）')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(sub => sub.setName('notifications').setDescription('通知を送信するチャンネルを設定します。')
            .addChannelOption(option => option.setName('channel').setDescription('通知チャンネル').setRequired(true).addChannelTypes(ChannelType.GuildText)))
        .addSubcommand(sub => sub.setName('worklog_channel').setDescription('作業記録を監視するチャンネルを設定します。')
            .addChannelOption(option => option.setName('channel').setDescription('作業記録チャンネル').setRequired(true).addChannelTypes(ChannelType.GuildText)))
        .addSubcommand(sub => sub.setName('roles_panel').setDescription('ロール付与用のパネルをこのチャンネルに設置します。')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'notifications': {
                const channel = interaction.options.getChannel('channel');
                configManager.update({ notifyChannelId: channel.id });
                await interaction.reply({
                    content: `通知チャンネルを <#${channel.id}> に設定しました。`,
                    ephemeral: true
                });
                break;
            }
            case 'worklog_channel': {
                const channel = interaction.options.getChannel('channel');
                configManager.update({ workChannelId: channel.id });
                await interaction.reply({
                    content: `作業記録チャンネルを <#${channel.id}> に設定しました。`,
                    ephemeral: true
                });
                break;
            }
            case 'roles_panel': {
                const embed = new EmbedBuilder()
                    .setTitle('🚀 ロールを選択')
                    .setDescription('下のボタンを押して、所属する班のロールを取得してください。')
                    .setColor(0x5865F2);

                const row = new ActionRowBuilder();
                ROLES.forEach(role => {
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`role-assign-${role.name}`)
                            .setLabel(role.name)
                            .setStyle(role.style)
                            .setEmoji(role.emoji)
                    );
                });
                
                const channel = await interaction.client.channels.fetch(interaction.channelId);
                await channel.send({ embeds: [embed], components: [row] });

                await interaction.reply({ content: 'ロールパネルを設置しました。', ephemeral: true });
                break;
            }
        }
    }
};