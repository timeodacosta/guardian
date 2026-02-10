const { Events, PermissionFlagsBits, EmbedBuilder, Colors } = require('discord.js');
const prisma = require('../utils/prisma');

// Map pour stocker les messages récents (Anti-Spam)
// Structure : userId => { msgCount, lastMessage, timer }
const spamMap = new Map();

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        // 1. Ignorer les bots et les messages hors serveur
        if (message.author.bot || !message.guild) return;

        // 2. Vérifier les permissions (Les admins bypass tout)
        // Le ?. permet d'éviter un crash si message.member est null (ex: webhook)
        const isAdmin = message.member?.permissions.has(PermissionFlagsBits.Administrator);

        // --- CHARGEMENT DES CONFIGURATIONS ---
        const [antiLinkConfig, antiSpamConfig] = await Promise.all([
            prisma.antiLinkConfig.findUnique({ where: { guildId: message.guild.id } }),
            prisma.antiSpamConfig.findUnique({ where: { guildId: message.guild.id } })
        ]);

        // ====================================================
        // 🔒 MODULE : ANTI-LINK
        // ====================================================
        if (antiLinkConfig && antiLinkConfig.enabled) {
            const linkRegex = /(https?:\/\/|www\.|discord\.(gg|io|me|li)|discordapp\.com\/invite)/i;

            if (linkRegex.test(message.content)) {
                try {
                    // 1. Supprimer le message
                    await message.delete().catch(() => { });

                    // 2. Envoyer un embed d'avertissement
                    const warningEmbed = new EmbedBuilder()
                        .setColor(Colors.Red)
                        .setAuthor({ name: "Anti-Link", iconURL: client.user.displayAvatarURL() })
                        .setDescription(`${message.author}, **les liens sont interdits** ici.\nUn avertissement a été ajouté à votre dossier.`);

                    const msg = await message.channel.send({ embeds: [warningEmbed] });
                    setTimeout(() => msg.delete().catch(() => { }), 5000);

                    // 3. AJOUTER LE WARN EN BDD
                    await prisma.warn.create({
                        data: {
                            guildId: message.guild.id,
                            userId: message.author.id,
                            userTag: message.author.tag,
                            modId: client.user.id,     // C'est le bot qui warn
                            modTag: client.user.tag,
                            reason: "Warn via antilink"
                        }
                    });

                    return; // Stop ici pour ne pas déclencher l'antispam sur un message supprimé
                } catch (err) {
                    console.error("Erreur Anti-Link:", err);
                }
            }
        }

        // ====================================================
        // 🛡️ MODULE : ANTI-SPAM (CONFIGURABLE)
        // ====================================================
        if (antiSpamConfig && antiSpamConfig.enabled && !isAdmin) {

            // 1. VÉRIFICATION WHITELIST (Salons & Rôles)
            const ignoredChannels = antiSpamConfig.ignoredChannelIds || [];
            const ignoredRoles = antiSpamConfig.ignoredRoleIds || [];

            if (ignoredChannels.includes(message.channel.id)) return; // Salon ignoré
            if (message.member.roles.cache.hasAny(...ignoredRoles)) return; // Rôle ignoré

            // 2. RÉCUPÉRATION DES PARAMÈTRES
            const LIMIT = antiSpamConfig.messageLimit || 5;
            const TIME = antiSpamConfig.timeWindow || 5000;

            if (spamMap.has(message.author.id)) {
                const userData = spamMap.get(message.author.id);
                const { timer } = userData;
                let msgCount = userData.msgCount;

                msgCount++;

                if (msgCount >= LIMIT) {
                    // --- DÉTECTION SPAM ---
                    clearTimeout(timer);
                    spamMap.delete(message.author.id);

                    try {
                        // Action : Timeout + Delete + Warn
                        await message.member.timeout(5 * 60 * 1000, 'Guardian Anti-Spam').catch(() => { });
                        await message.channel.bulkDelete(LIMIT, true).catch(() => { });

                        const muteEmbed = new EmbedBuilder()
                            .setColor(Colors.Red)
                            .setTitle('🛡️ Anti-Spam')
                            .setDescription(`**${message.author.tag}** a été mute (5 min) pour spam.\nUn avertissement a été enregistré.`);

                        const msg = await message.channel.send({ embeds: [muteEmbed] });
                        setTimeout(() => msg.delete().catch(() => { }), 10000);

                        // Enregistrement en BDD
                        await prisma.warn.create({
                            data: {
                                guildId: message.guild.id,
                                userId: message.author.id,
                                userTag: message.author.tag,
                                modId: client.user.id,
                                modTag: client.user.tag,
                                reason: "Auto-Warn : Spam détecté"
                            }
                        });

                    } catch (err) {
                        console.error("Erreur Anti-Spam:", err);
                    }
                } else {
                    userData.msgCount = msgCount;
                    spamMap.set(message.author.id, userData);
                }
            } else {
                // Premier message
                let fn = setTimeout(() => {
                    spamMap.delete(message.author.id);
                }, TIME);

                spamMap.set(message.author.id, {
                    msgCount: 1,
                    timer: fn
                });
            }
        }
    }
};