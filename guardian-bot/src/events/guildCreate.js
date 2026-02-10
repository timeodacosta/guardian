const { Events } = require('discord.js');
const prisma = require('../utils/prisma');

module.exports = {
    name: Events.GuildCreate,
    async execute(guild) {
        console.log(`🤖 J'ai rejoint un nouveau serveur : ${guild.name} (${guild.id})`);

        try {
            await prisma.guild.upsert({
                where: { id: guild.id },
                update: { name: guild.name },
                create: {
                    id: guild.id,
                    name: guild.name
                }
            });
            console.log(`✅ Serveur "${guild.name}" enregistré en Base de Données !`);
        } catch (error) {
            console.error("❌ Erreur lors de l'enregistrement du serveur :", error);
        }
    },
};