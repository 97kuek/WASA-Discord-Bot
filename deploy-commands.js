require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// 各コマンドの data プロパティから JSON 表現を取得してデプロイ用に準備
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[警告] ${filePath} のコマンドには、必要な "data" または "execute" プロパティがありません。`);
    }
}

// RESTモジュールのインスタンスを作成
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// コマンドをデプロイ
(async () => {
    try {
        console.log(`${commands.length}個のアプリケーション (/) コマンドのリフレッシュを開始しました。`);

        // put メソッドで、全てのコマンドを現在のセットで完全にリフレッシュします。
        // グローバルコマンドとして登録する場合、Routes.applicationCommands を使用します。
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`${data.length}個のアプリケーション (/) コマンドのリロードに成功しました。`);
    } catch (error) {
        console.error(error);
    }
})();
