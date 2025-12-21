// TFの気象判定
// 機体組み立て時・TF時に雨が降らない，または許容範囲内
// 横風1m/s以下，風速2m/s以下

const axios = require('axios');

// 富士川滑空場の緯度・経度・ランウェイ方位
const LAT = 35.118;
const LON = 138.622;
const RUNWAY_ANGLE = 160;

// 風向の視覚化
function getWindDirection(deg) {
    const directions = [
        { label: '北', emoji: '⬇️' }, { label: '北北東', emoji: '↙️' }, { label: '北東', emoji: '↙️' }, { label: '東北東', emoji: '⬅️' },
        { label: '東', emoji: '⬅️' }, { label: '東南東', emoji: '⬅️' }, { label: '南東', emoji: '↖️' }, { label: '南南東', emoji: '↖️' },
        { label: '南', emoji: '⬆️' }, { label: '南南西', emoji: '↗️' }, { label: '南西', emoji: '↗️' }, { label: '西南西', emoji: '➡️' },
        { label: '西', emoji: '➡️' }, { label: '西北西', emoji: '➡️' }, { label: '北西', emoji: '↘️' }, { label: '北北西', emoji: '↘️' }
    ];
    return directions[Math.round(deg / 22.5) % 16];
}

// 横風の計算
function calculateCrosswind(speed, deg) {
    const rad = (deg - RUNWAY_ANGLE) * (Math.PI / 180); // 風向と滑走路の角度差をラジアンに変換
    return Math.abs(speed * Math.sin(rad)); // 風速 × sin(角度差)の絶対値を計算
}

module.exports = {
    checkFujikawa: async (targetDate, apiKey) => {
        // APIへのURL構築
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&units=metric&appid=${apiKey}`;
        // 通信(終わるまでawaitで待機)
        const res = await axios.get(url);
        // データのフィルタリング
        const forecasts = res.data.list.filter(f => {
            const date = new Date(f.dt * 1000);
            return date.toLocaleDateString('ja-JP') === targetDate.toLocaleDateString('ja-JP') && date.getHours() <= 9;
        });

        if (forecasts.length === 0) return { isOk: false, details: "予報データが範囲外です。" };

        let logs = [];
        let isOk = true;

        forecasts.forEach(f => {
            const hour = new Date(f.dt * 1000).getHours();
            const wind = f.wind.speed;
            const cross = calculateCrosswind(wind, f.wind.deg);
            const dir = getWindDirection(f.wind.deg);
            const rain = f.rain ? (f.rain['3h'] || 0) : 0;

            // 運用判定
            const timeOk = (wind <= 2.0 && cross <= 1.0 && rain <= 0.1);
            if (!timeOk) isOk = false;

            logs.push(`${timeOk ? '✅' : '⚠️'} **${hour}時**: ${dir.emoji} ${wind.toFixed(1)}m/s(${dir.label}) / 横風${cross.toFixed(1)}m/s`);
        });

        return { isOk, details: logs.join('\n') };
    }
};