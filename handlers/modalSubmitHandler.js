const configManager = require('../utils/configManager');
const { getRoleManagementPanel, getCountdownManagementPanel, getBasicSettingsPanel } = require('./buttonHandler');
const { handleInteractionError } = require('../utils/errorHandler');

module.exports = async (interaction) => {
    const [type, ...args] = interaction.customId.split('-');
    try {
        if (type === 'modal' && args[0] === 'role' && args[1] === 'add') {
            const name = interaction.fields.getTextInputValue('role-name');
            const emoji = interaction.fields.getTextInputValue('role-emoji') || '▫️';
            await configManager.addRole({ name, emoji });
            await interaction.update(await getRoleManagementPanel());
        }
        if (type === 'modal' && args[0] === 'countdown' && args[1] === 'add') {
            const name = interaction.fields.getTextInputValue('countdown-name');
            const date = interaction.fields.getTextInputValue('countdown-date');
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date).getTime())) {
                await interaction.reply({ content: '日付の形式が不正です。YYYY-MM-DD形式で入力してください。', ephemeral: true });
                return;
            }
            await configManager.addTarget(date, name);
            await interaction.update(await getCountdownManagementPanel());
        }
        if (type === 'modal' && args[0] === 'basic' && args[1] === 'settings' && args[2] === 'edit') {
            const notifyChannelId = interaction.fields.getTextInputValue('notify-channel-id') || null;
            const workChannelId = interaction.fields.getTextInputValue('worklog-channel-id') || null;
            await configManager.update({ notifyChannelId, workChannelId });
            await interaction.update(await getBasicSettingsPanel());
        }
    } catch (error) {
        handleInteractionError(error, interaction);
    }
};