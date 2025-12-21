const fs = require('fs');
const path = require('path');
const WORKLOG_FILE = path.join(__dirname, '../worklog.json');

const DEFAULT_DATA = {
    activeSession: null,
    sessions: []
};

function readLog() {
    try {
        if (!fs.existsSync(WORKLOG_FILE)) {
            fs.writeFileSync(WORKLOG_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
            return DEFAULT_DATA;
        }
        const data = fs.readFileSync(WORKLOG_FILE, 'utf8');
        return JSON.parse(data || JSON.stringify(DEFAULT_DATA));
    } catch (e) {
        console.error("【警告】作業ログの読み込みに失敗:", e);
        return DEFAULT_DATA;
    }
}

function writeLog(data) {
    try {
        fs.writeFileSync(WORKLOG_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("【警告】作業ログの書き込みに失敗:", e);
    }
}

module.exports = {
    startSession: (userId) => {
        const log = readLog();
        if (log.activeSession) {
            return { success: false, message: 'すでに作業セッションが開始されています。' };
        }
        log.activeSession = {
            startTime: new Date().toISOString(),
            user: userId
        };
        writeLog(log);
        return { success: true, message: '作業セッションを開始しました。' };
    },

    endSession: (userId) => {
        const log = readLog();
        if (!log.activeSession) {
            return { success: false, message: '開始されている作業セッションがありません。' };
        }
        
        const startTime = new Date(log.activeSession.startTime);
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();

        const newSession = {
            startTime: log.activeSession.startTime,
            endTime: endTime.toISOString(),
            duration,
            startUser: log.activeSession.user,
            endUser: userId
        };

        log.sessions.push(newSession);
        log.activeSession = null;
        writeLog(log);
        
        const durationHours = (duration / (1000 * 60 * 60)).toFixed(2);
        return { success: true, message: `作業セッションを終了しました。作業時間: ${durationHours}時間` };
    },

    getActiveSession: () => {
        return readLog().activeSession;
    },

    getAllSessions: () => {
        return readLog().sessions;
    }
};