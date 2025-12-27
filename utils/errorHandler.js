const logger = require('./logger');

async function handleInteractionError(error, interaction) {
    const context = `インタラクション処理中のエラー: ${interaction.customId || interaction.commandName}`;
    console.error(context, error);
    
    // ログチャンネルにエラーを送信
    await logger.error(interaction.client, error, context);

    const errorMessage = { content: '処理中に予期せぬエラーが発生しました。管理者に通知しました。', ephemeral: true };
    
    try {
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    } catch (replyError) {
        console.error('エラーメッセージの返信に失敗しました:', replyError);
    }
}

async function handleMessageError(error, message) {
    const context = `メッセージ処理中のエラー: ${message.content}`;
    console.error(context, error);

    // ログチャンネルにエラーを送信
    await logger.error(message.client, error, context);

    try {
        await message.reply('処理中に予期せぬエラーが発生しました。管理者に通知しました。');
    } catch (replyError) {
        console.error('エラーメッセージの返信に失敗しました:', replyError);
    }
}

module.exports = {
    handleInteractionError,
    handleMessageError
};