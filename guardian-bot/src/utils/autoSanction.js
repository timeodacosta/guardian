// src/utils/autoSanction.js
const prisma = require('./prisma');
const { EmbedBuilder, Colors } = require('discord.js');

/**
 * Vérifie et applique les sanctions automatiques
 * @param {Object} guild - L'objet Guild Discord
 * @param {Object} member - L'objet Member Discord (la cible)
 * @param {Object} channel - Le salon où envoyer la notification (optionnel)
 */
async function checkAutoSanction(guild, member, channel = null) {
    try {
        // 1. Récupérer la configuration
        const config = await prisma.warnConfig.findUnique({ where: { guildId: guild.id } });
        if (!config) return; // Pas de config, on arrête

        // 2. Compter les warns
        const count = await prisma.warn.count({ where: { guildId: guild.id, userId: member.id } });

        let actionTaken = null;

        // 3. Vérifier Auto-BAN (Priorité haute)
        if (config.autoBanCount > 0 && count >= config.autoBanCount) {
            if (member.bannable) {
                await member.ban({ reason: `Auto-Ban : ${count} avertissements atteints.` });
                actionTaken = "⛔ **Membre banni automatiquement** (Limite de warns atteinte).";
            } else {
                actionTaken = "⚠️ Le bot a essayé de bannir le membre mais n'a pas les permissions.";
            }
        } 
        // 4. Vérifier Auto-KICK (Si pas banni)
        else if (config.autoKickCount > 0 && count >= config.autoKickCount) {
            if (member.kickable) {
                await member.kick(`Auto-Kick : ${count} avertissements atteints.`);
                actionTaken = "👢 **Membre expulsé automatiquement** (Limite de warns atteinte).";
            } else {
                actionTaken = "⚠️ Le bot a essayé d'expulser le membre mais n'a pas les permissions.";
            }
        }

        // 5. Notifier dans le salon si une action a eu lieu
        if (actionTaken && channel) {
            const embed = new EmbedBuilder()
                .setColor(Colors.Red)
                .setDescription(`${actionTaken}\n👤 **Membre :** ${member.user.tag}\n📉 **Total Warns :** ${count}`);
            
            await channel.send({ embeds: [embed] });
        }

    } catch (error) {
        console.error("Erreur Auto-Sanction :", error);
    }
}

module.exports = { checkAutoSanction };