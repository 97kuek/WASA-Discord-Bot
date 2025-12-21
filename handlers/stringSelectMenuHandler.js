const configManager = require('../utils/configManager');
const { getRoleManagementPanel, getCountdownManagementPanel } = require('./buttonHandler');
const { handleInteractionError } = require('../utils/errorHandler');

module.exports = async (interaction) => {
    const [type, ...args] = interaction.customId.split('-');
    try {
        if (type === 'select' && args[0] === 'role' && args[1] === 'remove') {
            const roleIdToRemove = interaction.values[0];
            await configManager.removeRole(roleIdToRemove);
            await interaction.update(await getRoleManagementPanel());
        }
        if (type === 'select' && args[0] === 'countdown' && args[1] === 'remove') {
            const targetIdToRemove = parseInt(interaction.values[0]);
            await configManager.removeTarget(targetIdToRemove);
            await interaction.update(await getCountdownManagementPanel());
        }
    } catch (error) {
        handleInteractionError(error, interaction);
    }
};