const { Events } = require('discord.js');
const prisma = require('../utils/prisma');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`✅ Connecté en tant que ${client.user.tag}`);

        console.log("🔄 Synchronisation des serveurs en cours...");
        
        const guilds = client.guilds.cache.map(guild => ({
            id: guild.id,
            name: guild.name
        }));

        let count = 0;
        for (const guild of guilds) {
            try {
                await prisma.guild.upsert({
                    where: { id: guild.id },
                    update: { name: guild.name },
                    create: { id: guild.id, name: guild.name }
                });
                count++;
            } catch (e) {
                console.error(`Erreur sync serveur ${guild.name}:`, e);
            }
        }

        console.log(`✅ ${count} serveurs synchronisés en Base de Données !`);
        console.log(`🌐 API Dashboard prête sur le port 3000.`);
    },
};