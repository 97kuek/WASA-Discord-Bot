async function handleInteractionError(error, interaction) {
    console.error(`インタラクション処理中にエラーが発生しました: ${interaction.customId || interaction.commandName}`, error);
    const errorMessage = { content: '処理中にエラーが発生しました！', ephemeral: true };
    
    if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
    } else {
        await interaction.reply(errorMessage);
    }
}

async function handleMessageError(error, message) {
    console.error(`メッセージ処理中にエラーが発生しました: ${message.content}`, error);
    await message.reply('処理中にエラーが発生しました。');
}

module.exports = {
    handleInteractionError,
    handleMessageError
};