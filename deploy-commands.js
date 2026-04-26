const { REST, Routes } = require('discord.js');
const fs = require('fs');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken('YOUR_BOT_TOKEN');

(async () => {
    try {
        console.log('Deploying commands...');

        await rest.put(
            Routes.applicationGuildCommands('YOUR_CLIENT_ID', 'YOUR_GUILD_ID'),
            { body: commands }
        );

        console.log('Commands deployed.');
    } catch (error) {
        console.error(error);
    }
})();
