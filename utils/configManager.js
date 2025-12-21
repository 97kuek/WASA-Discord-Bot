const fs = require('fs');
const path = require('path');
const CONFIG_FILE = path.join(__dirname, '../config.json');

// デフォルトの設定
const DEFAULT_CONFIG = {
    notifyChannelId: null,
    workChannelId: null,
    countdownTargets: [{ id: 1, name: '鳥人間コンテスト', date: '2026-07-25' }]
};

function loadConfig() {
    try {
        if (!fs.existsSync(CONFIG_FILE)) {
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
            return DEFAULT_CONFIG;
        }
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        const parsedData = JSON.parse(data || '{}');

        // 後方互換性: 古い形式のデータを新しい形式に変換
        if (parsedData.targetDate) {
            parsedData.countdownTargets = [{
                id: 1,
                name: parsedData.eventName || 'イベント',
                date: parsedData.targetDate
            }];
            delete parsedData.targetDate;
            delete parsedData.eventName;
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(parsedData, null, 2));
        }

        return { ...DEFAULT_CONFIG, ...parsedData };
    } catch (e) {
        console.error("【警告】設定ファイルの読み込み/書き込みに失敗。デフォルト値を使用します:", e);
        return DEFAULT_CONFIG;
    }
}

function saveConfig(newConfig) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
    } catch (e) {
        console.error("【警告】設定ファイルの保存に失敗しました:", e);
    }
}

module.exports = {
    load: loadConfig,
    update: (partialConfig) => {
        const currentConfig = loadConfig();
        const newConfig = { ...currentConfig, ...partialConfig };
        saveConfig(newConfig);
        return newConfig;
    },
    getTargets: () => {
        return loadConfig().countdownTargets || [];
    },
    addTarget: (date, name) => {
        const config = loadConfig();
        const newTarget = {
            id: Date.now(), // ユニークIDとしてタイムスタンプを利用
            name,
            date
        };
        config.countdownTargets = [...(config.countdownTargets || []), newTarget];
        saveConfig(config);
        return newTarget;
    },
    removeTarget: (id) => {
        const config = loadConfig();
        const originalLength = config.countdownTargets.length;
        config.countdownTargets = config.countdownTargets.filter(t => t.id !== id);
        if (config.countdownTargets.length < originalLength) {
            saveConfig(config);
            return true; // 削除成功
        }
        return false; // 削除対象が見つからなかった
    }
};