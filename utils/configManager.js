const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const CONFIG_FILE = path.join(__dirname, '../config.json');

// デフォルトの設定
const DEFAULT_CONFIG = {
    notifyChannelId: null,
    workChannelId: null,
    countdownTargets: [{ id: 1, name: '鳥人間コンテスト', date: '2026-07-25' }],
    assignableRoles: [
        { id: '1', name: '翼班', emoji: '✈️' },
        { id: '2', name: '駆動・フレーム班', emoji: '⚙️' },
        { id: '3', name: 'プロペラ班', emoji: '🔄' },
        { id: '4', name: 'フェアリング班', emoji: '🚀' },
        { id: '5', name: '電装班', emoji: '💡' }
    ]
};

// メモリキャッシュ用の変数
let configCache = null;

async function saveConfig(newConfig) {
    try {
        await fs.writeFile(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
        // ファイル保存に成功したら、キャッシュも更新
        configCache = newConfig;
    } catch (e) {
        console.error("【警告】設定ファイルの保存に失敗しました:", e);
    }
}

module.exports = {
    // 起動時に一度だけ呼び出す
    initialize: () => {
        if (configCache) {
            return;
        }
        try {
            if (!fsSync.existsSync(CONFIG_FILE)) {
                fsSync.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
                configCache = DEFAULT_CONFIG;
                return;
            }
            
            const data = fsSync.readFileSync(CONFIG_FILE, 'utf8');
            let parsedData = JSON.parse(data || '{}');

            // 後方互換性チェックとデータ移行
            let needsSave = false;
            if (parsedData.targetDate) {
                needsSave = true; // ファイルの保存が必要
                parsedData.countdownTargets = [{
                    id: 1,
                    name: parsedData.eventName || 'イベント',
                    date: parsedData.targetDate
                }];
                delete parsedData.targetDate;
                delete parsedData.eventName;
            }

            configCache = { ...DEFAULT_CONFIG, ...parsedData };

            if (needsSave) {
                fsSync.writeFileSync(CONFIG_FILE, JSON.stringify(configCache, null, 2));
            }

        } catch (e) {
            console.error("【警告】設定ファイルの読み込み/書き込みに失敗。デフォルト値を使用します:", e);
            configCache = DEFAULT_CONFIG;
        }
    },
    // 設定値の取得
    getConfig: () => {
        if (!configCache) {
            // 万が一初期化前に呼ばれた場合のフォールバック
            console.warn("警告: configManagerが初期化されていません。");
            module.exports.initialize();
        }
        return configCache;
    },
    update: async (partialConfig) => {
        const currentConfig = module.exports.getConfig();
        const newConfig = { ...currentConfig, ...partialConfig };
        await saveConfig(newConfig);
        return newConfig;
    },
    getTargets: () => {
        return module.exports.getConfig().countdownTargets || [];
    },
    addTarget: async (date, name) => {
        const config = module.exports.getConfig();
        const newTarget = {
            id: Date.now(),
            name,
            date
        };
        const newConfig = { ...config, countdownTargets: [...(config.countdownTargets || []), newTarget] };
        await saveConfig(newConfig);
        return newTarget;
    },
    removeTarget: async (id) => {
        const config = module.exports.getConfig();
        const targets = config.countdownTargets || [];
        const newTargets = targets.filter(t => t.id !== id);
        if (newTargets.length < targets.length) {
            await saveConfig({ ...config, countdownTargets: newTargets });
            return true;
        }
        return false;
    },
    getRoles: () => {
        return module.exports.getConfig().assignableRoles || [];
    },
    addRole: async ({ name, emoji }) => {
        const config = module.exports.getConfig();
        const newRole = {
            id: String(Date.now()),
            name,
            emoji
        };
        const newConfig = { ...config, assignableRoles: [...(config.assignableRoles || []), newRole] };
        await saveConfig(newConfig);
        return newRole;
    },
    removeRole: async (id) => {
        const config = module.exports.getConfig();
        const roles = config.assignableRoles || [];
        const newRoles = roles.filter(r => r.id !== id);
        if (newRoles.length < roles.length) {
            await saveConfig({ ...config, assignableRoles: newRoles });
            return true;
        }
        return false;
    }
};