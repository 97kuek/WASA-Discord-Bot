const configManager = require('../utils/configManager');
const worklogManager = require('../utils/worklogManager');
const { handleMessageError } = require('../utils/errorHandler');

module.exports = async (message) => {
    if (message.author.bot || !message.inGuild()) return;

    const config = configManager.getConfig();
    if (message.channel.id !== config.workChannelId) return;

    const content = message.content.trim();

    try {
        if (content === 'あけた') {
            const result = worklogManager.startSession(message.author.id);
            await message.reply(result.message);
        } else if (content === 'しめた') {
            const result = worklogManager.endSession(message.author.id);
            await message.reply(result.message);
        }
    } catch (error) {
        handleMessageError(error, message);
    }
};