const configManager = require('./configManager');

module.exports = {
    getCountdownText: () => {
        const config = configManager.load();
        const target = new Date(config.targetDate + 'T00:00:00+09:00');
        const now = new Date();
        const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

        if (diffDays > 0) return `**${config.eventName}** まであと **${diffDays}日** です！`;
        if (diffDays === 0) return `ついに **${config.eventName}** 当日です！`;
        return `${config.eventName} は終了しました。`;
    }
};