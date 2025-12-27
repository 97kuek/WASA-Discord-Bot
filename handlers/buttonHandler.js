const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } = require('discord.js');
const configManager = require('../utils/configManager');

async function getBasicSettingsPanel() {
    const config = configManager.getConfig();
    const notifyChannel = config.notifyChannelId ? `<#${config.notifyChannelId}>` : '未設定';
    const worklogChannel = config.workChannelId ? `<#${config.workChannelId}>` : '未設定';
    const logChannel = config.logChannelId ? `<#${config.logChannelId}>` : '未設定';

    const embed = new EmbedBuilder()
        .setTitle('📝 基本設定')
        .setDescription('通知、作業記録、ログ出力に使用するチャンネルを設定します。')
        .addFields(
            { name: 'ログ出力チャンネル', value: logChannel, inline: false },
            { name: '通知チャンネル', value: notifyChannel, inline: true },
            { name: '作業記録チャンネル', value: worklogChannel, inline: true }
        )
        .setColor(0x95A5A6);

    const buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('basic-settings-edit').setLabel('変更').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('settings-back-main').setLabel('戻る').setStyle(ButtonStyle.Secondary)
        );
    
    return { embeds: [embed], components: [buttons], ephemeral: true };
}

async function getCountdownManagementPanel() {
    const targets = configManager.getTargets();
    const description = targets.map(target => {
        const targetDate = new Date(target.date + 'T00:00:00+09:00');
        const now = new Date();
        const diffDays = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
        let countdownText;
        if (diffDays > 0) countdownText = `あと **${diffDays}** 日`;
        else if (diffDays === 0) countdownText = '**本日です！**';
        else countdownText = '終了しました';
        return `**${target.name}** (${target.date}) | ${countdownText}`;
    }).join('\n\n') || '現在、目標は設定されていません。';

    const embed = new EmbedBuilder()
        .setTitle('🎯 カウントダウン管理')
        .setDescription(description)
        .setColor(0x3498DB);

    const buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('countdown-add').setLabel('追加').setStyle(ButtonStyle.Success).setEmoji('➕'),
            new ButtonBuilder().setCustomId('countdown-remove').setLabel('削除').setStyle(ButtonStyle.Danger).setEmoji('🗑️'),
            new ButtonBuilder().setCustomId('settings-back-main').setLabel('戻る').setStyle(ButtonStyle.Secondary)
        );
    
    return { embeds: [embed], components: [buttons], ephemeral: true };
}

async function getRoleManagementPanel() {
    const roles = configManager.getRoles();
    const description = roles.map(r => `**${r.name}** (絵文字: ${r.emoji})`).join('\n') || '現在、ロールは設定されていません。';

    const embed = new EmbedBuilder()
        .setTitle('👥 公開ロール管理')
        .setDescription('ボタンで取得できるロールを管理します.\n\n' + description)
        .setColor(0x1ABC9C);

    const buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('roles-add').setLabel('追加').setStyle(ButtonStyle.Success).setEmoji('➕'),
            new ButtonBuilder().setCustomId('roles-remove').setLabel('削除').setStyle(ButtonStyle.Danger).setEmoji('🗑️'),
            new ButtonBuilder().setCustomId('roles-deploy').setLabel('パネル設置').setStyle(ButtonStyle.Primary).setEmoji('🚀'),
            new ButtonBuilder().setCustomId('settings-back-main').setLabel('戻る').setStyle(ButtonStyle.Secondary)
        );

    return { embeds: [embed], components: [buttons], ephemeral: true };
}

const { handleInteractionError } = require('../utils/errorHandler');

module.exports = {
    async handler(interaction) {
        const [type, ...args] = interaction.customId.split('-');

        try {
            // --- 公開ロール付与ボタンの処理 ---
            if (type === 'role' && args[0] === 'assign') {
                const roleName = args.slice(1).join('-');
                if (!roleName) return;

                await interaction.deferReply({ ephemeral: true });
                const { guild, member } = interaction;
                let role = guild.roles.cache.find(r => r.name === roleName);

                if (!role) {
                    role = await guild.roles.create({ name: roleName, mentionable: true, reason: '自動ロール付与機能による作成' });
                }

                if (member.roles.cache.has(role.id)) {
                    await member.roles.remove(role);
                    await interaction.editReply(`ロール **${role.name}** を解除しました。`);
                } else {
                    await member.roles.add(role);
                    await interaction.editReply(`ロール **${role.name}** を付与しました！`);
                }
                return;
            }

            // --- 設定パネルのボタン処理 ---
            if (type === 'settings') {
                const command = args[0];

                if (command === 'basic') {
                    await interaction.update(await getBasicSettingsPanel());
                }

                if (command === 'roles') {
                    await interaction.update(await getRoleManagementPanel());
                }

                if (command === 'countdown') {
                    await interaction.update(await getCountdownManagementPanel());
                }

                if (command === 'back' && args[1] === 'main') {
                    const mainEmbed = new EmbedBuilder()
                        .setColor(0x5865F2)
                        .setTitle('⚙️ 総合設定パネル')
                        .setDescription('ボットの各種設定をここから行えます。\n設定したい項目を下のボタンから選んでください。');
                    const mainRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId('settings-basic').setLabel('基本設定').setStyle(ButtonStyle.Secondary).setEmoji('📝'),
                            new ButtonBuilder().setCustomId('settings-countdown').setLabel('カウントダウン管理').setStyle(ButtonStyle.Secondary).setEmoji('🎯'),
                            new ButtonBuilder().setCustomId('settings-roles').setLabel('ロール管理').setStyle(ButtonStyle.Secondary).setEmoji('👥')
                        );
                    await interaction.update({ embeds: [mainEmbed], components: [mainRow] });
                }
            }

            // --- ロール管理パネルのボタン処理 ---
            if (type === 'roles') {
                const command = args[0];
                if (command === 'add') {
                    const modal = new ModalBuilder().setCustomId('modal-role-add').setTitle('新しいロールを追加');
                    const nameInput = new TextInputBuilder().setCustomId('role-name').setLabel("ロール名（班の名前など）").setStyle(TextInputStyle.Short).setRequired(true);
                    const emojiInput = new TextInputBuilder().setCustomId('role-emoji').setLabel("ロールの絵文字（任意）").setStyle(TextInputStyle.Short).setRequired(false);
                    modal.addComponents(new ActionRowBuilder().addComponents(nameInput), new ActionRowBuilder().addComponents(emojiInput));
                    await interaction.showModal(modal);
                }
                if (command === 'remove') {
                    const roles = configManager.getRoles();
                    if (roles.length === 0) {
                        await interaction.reply({ content: '削除できるロールが設定されていません。', ephemeral: true });
                        return;
                    }
                    const selectMenu = new StringSelectMenuBuilder().setCustomId('select-role-remove').setPlaceholder('削除するロールを選択してください')
                        .addOptions(roles.map(r => ({ label: r.name, description: `絵文字: ${r.emoji}`, value: r.id, })));
                    await interaction.update({ components: [new ActionRowBuilder().addComponents(selectMenu)] });
                }
                if (command === 'deploy') {
                    const roles = configManager.getRoles();
                    if (roles.length === 0) {
                        await interaction.reply({ content: 'パネルに設置するロールが1つも設定されていません。', ephemeral: true });
                        return;
                    }
                    const embed = new EmbedBuilder().setTitle('🚀 ロールを選択').setDescription('下のボタンを押して、所属する班のロールを取得・解除してください。').setColor(0x5865F2);
                    const MAX_BUTTONS_PER_ROW = 5;
                    const rows = [];
                    for (let i = 0; i < roles.length; i += MAX_BUTTONS_PER_ROW) {
                        const row = new ActionRowBuilder();
                        const batch = roles.slice(i, i + MAX_BUTTONS_PER_ROW);
                        batch.forEach(role => {
                            row.addComponents(new ButtonBuilder().setCustomId(`role-assign-${role.name}`).setLabel(role.name).setStyle(ButtonStyle.Secondary).setEmoji(role.emoji));
                        });
                        rows.push(row);
                    }
                    await interaction.channel.send({ embeds: [embed], components: rows });
                    await interaction.update({ content: '✅ ロールパネルをこのチャンネルに設置しました！', embeds: [], components: [] });
                }
            }

            // --- カウントダウン管理パネルのボタン処理 ---
            if (type === 'countdown') {
                const command = args[0];
                if (command === 'add') {
                    const modal = new ModalBuilder().setCustomId('modal-countdown-add').setTitle('新しいカウントダウン目標を追加');
                    const nameInput = new TextInputBuilder().setCustomId('countdown-name').setLabel("イベント名").setStyle(TextInputStyle.Short).setRequired(true);
                    const dateInput = new TextInputBuilder().setCustomId('countdown-date').setLabel("日付 (YYYY-MM-DD)").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('例: 2025-08-15');
                    modal.addComponents(new ActionRowBuilder().addComponents(nameInput), new ActionRowBuilder().addComponents(dateInput));
                    await interaction.showModal(modal);
                }
                if (command === 'remove') {
                    const targets = configManager.getTargets();
                    if (targets.length === 0) {
                        await interaction.reply({ content: '削除できる目標が設定されていません。', ephemeral: true });
                        return;
                    }
                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId('select-countdown-remove')
                        .setPlaceholder('削除する目標を選択してください')
                        .addOptions(targets.map(t => ({ label: t.name, description: `目標日: ${t.date}`, value: String(t.id), })));
                    await interaction.update({ components: [new ActionRowBuilder().addComponents(selectMenu)] });
                }
            }

            // --- 基本設定パネルのボタン処理 ---
            if (type === 'basic' && args[0] === 'settings' && args[1] === 'edit') {
                 const config = configManager.getConfig();
                 const modal = new ModalBuilder().setCustomId('modal-basic-settings-edit').setTitle('基本設定の変更');
                 const logInput = new TextInputBuilder().setCustomId('log-channel-id').setLabel("ログ出力チャンネルID").setStyle(TextInputStyle.Short).setRequired(false).setValue(config.logChannelId || '');
                 const notifyInput = new TextInputBuilder().setCustomId('notify-channel-id').setLabel("通知チャンネルID").setStyle(TextInputStyle.Short).setRequired(false).setValue(config.notifyChannelId || '');
                 const worklogInput = new TextInputBuilder().setCustomId('worklog-channel-id').setLabel("作業記録チャンネルID").setStyle(TextInputStyle.Short).setRequired(false).setValue(config.workChannelId || '');
                 modal.addComponents(
                    new ActionRowBuilder().addComponents(logInput),
                    new ActionRowBuilder().addComponents(notifyInput),
                    new ActionRowBuilder().addComponents(worklogInput)
                );
                 await interaction.showModal(modal);
            }

        } catch (error) {
            handleInteractionError(error, interaction);
        }
    },
    getBasicSettingsPanel,
    getCountdownManagementPanel,
    getRoleManagementPanel
};
