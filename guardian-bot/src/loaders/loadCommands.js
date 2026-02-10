const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

module.exports = async (client) => {
    const commandsPath = path.join(__dirname, '../commands');
    const commandFolders = fs.readdirSync(commandsPath);
    const commandsArray = [];

    for (const folder of commandFolders) {
        const files = fs.readdirSync(`${commandsPath}/${folder}`).filter(file => file.endsWith('.js'));
        for (const file of files) {
            const command = require(`../commands/${folder}/${file}`);
            client.commands.set(command.data.name, command);
            commandsArray.push(command.data.toJSON());
            console.log(`✅ Commande chargée : /${command.data.name}`);
        }
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        console.log('🔄 Enregistrement des Slash Commands...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commandsArray },
        );
        console.log('✨ Slash Commands enregistrées !');
    } catch (error) {
        console.error(error);
    }
};