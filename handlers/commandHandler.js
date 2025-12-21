const { handleInteractionError } = require('../utils/errorHandler');

module.exports = async (interaction, client) => {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching "${interaction.commandName}" was found.`);
        if (interaction.isChatInputCommand()) {
            await interaction.reply({ content: `エラー: コマンド "${interaction.commandName}" が見つかりません。`, ephemeral: true });
        }
        return;
    }

    try {
        if (interaction.isAutocomplete()) {
            if (command.autocomplete) await command.autocomplete(interaction);
        } else if (interaction.isChatInputCommand()) {
            await command.execute(interaction);
        }
    } catch (error) {
        handleInteractionError(error, interaction);
    }
};