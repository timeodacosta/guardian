const { Events, AttachmentBuilder } = require('discord.js');
const prisma = require('../utils/prisma');
const generateWelcomeImage = require('../utils/welcomeImage');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            // 1. Récupérer la config
            const config = await prisma.welcomeConfig.findUnique({
                where: { guildId: member.guild.id }
            });

            // Si pas activé ou pas de salon défini, on arrête
            if (!config || !config.enabled || !config.channelId) return;

            const channel = member.guild.channels.cache.get(config.channelId);
            if (!channel) return;

            // 2. Générer l'image avec Canvas
            const buffer = await generateWelcomeImage(member, config);
            const attachment = new AttachmentBuilder(buffer, { name: 'welcome-image.png' });

            // 3. Préparer le message texte (si défini)
            let content = config.message || `Bienvenue {user} sur **{server}** !`;

            // Remplacer les variables
            content = content
                .replace(/{user}/g, member.toString()) // Mention <@ID>
                .replace(/{server}/g, member.guild.name)
                .replace(/{count}/g, member.guild.memberCount);

            // 4. Envoyer
            await channel.send({
                content: content,
                files: [attachment]
            });

        } catch (error) {
            console.error("Erreur Event Welcome:", error);
        }
    },
};