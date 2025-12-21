const fs = require('fs');
const path = require('path');
const CONFIG_FILE = path.join(__dirname, '../config.json');

// デフォルトの設定
const DEFAULT_CONFIG = { targetDate: '2026-07-25', eventName: '鳥人間コンテスト' };

module.exports = {
    load: () => {
        try {
            // ファイルが存在しない、または中身が空の場合はデフォルトを返す
            if (!fs.existsSync(CONFIG_FILE)) return DEFAULT_CONFIG;

            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            if (!data || data.trim() === "") return DEFAULT_CONFIG;

            return JSON.parse(data);
        } catch (e) {
            console.error("【警告】設定ファイルの読み込みに失敗しました。デフォルト値を使用します。");
            return DEFAULT_CONFIG;
        }
    },
    save: (date, name) => {
        const config = { targetDate: date, eventName: name };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        return config;
    }
};