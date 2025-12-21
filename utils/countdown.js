const configManager = require('./configManager');

module.exports = {
    getCountdownText: () => {
        const targets = configManager.getTargets();
        if (targets.length === 0) {
            return '現在、目標は設定されていません。';
        }

        return targets.map(target => {
            const targetDate = new Date(target.date + 'T00:00:00+09:00');
            const now = new Date();
            const diffDays = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));

            if (diffDays > 0) return `**${target.name}** まであと **${diffDays}日** です！`;
            if (diffDays === 0) return `ついに **${target.name}** 当日です！`;
            return `**${target.name}** は終了しました。`;
        }).join('\n');
    }
};