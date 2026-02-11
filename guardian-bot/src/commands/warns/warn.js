const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Pagination = require('../../utils/Pagination');
const prisma = require('../../utils/prisma');
const { checkAutoSanction } = require('../../utils/autoSanction'); // <--- IMPORT CRUCIAL

// URL du dashboard
const DASHBOARD_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Système d\'avertissement')
        .addSubcommand(subcommand =>
            subcommand.setName('ajouter').setDescription('Avertir un membre')
                .addUserOption(o => o.setName('membre').setDescription('Le membre').setRequired(true))
                .addStringOption(o => o.setName('raison').setDescription('La raison').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('retirer').setDescription('Retirer un warn via ID')
                .addStringOption(o => o.setName('id').setDescription('ID du warn').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('liste').setDescription('Voir les warns')
                .addUserOption(o => o.setName('membre').setDescription('Filtrer par membre pour voir le détail ici'))
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // ====================================================
        // ➕ SOUS-COMMANDE : AJOUTER
        // ====================================================
        if (subcommand === 'ajouter') {
            const targetUser = interaction.options.getUser('membre');
            const reason = interaction.options.getString('raison');
            
            if (targetUser.id === interaction.user.id) return interaction.reply({ content: "❌ Auto-avertissement interdit.", ephemeral: true });
            if (targetUser.bot) return interaction.reply({ content: "❌ Impossible d'avertir un bot.", ephemeral: true });

            try {
                // 1. Assurer que le serveur existe en BDD
                await prisma.guild.upsert({ where: { id: interaction.guild.id }, update: {}, create: { id: interaction.guild.id, name: interaction.guild.name } });
                
                // 2. Créer le Warn
                const warn = await prisma.warn.create({ 
                    data: { 
                        guildId: interaction.guild.id, 
                        userId: targetUser.id, 
                        userTag: targetUser.tag, 
                        modId: interaction.user.id, 
                        modTag: interaction.user.tag, 
                        reason 
                    } 
                });

                // 3. Récupérer la config pour les logs et DM
                const config = await prisma.warnConfig.findUnique({ where: { guildId: interaction.guild.id } });

                // A. Envoyer un MP au membre (si activé)
                if (!config || config.dmUser) {
                    await targetUser.send({
                        embeds: [new EmbedBuilder()
                            .setTitle(`⚠️ Sanction : ${interaction.guild.name}`)
                            .setColor(Colors.Red)
                            .setDescription(`Vous avez reçu un avertissement.\n\n**Raison :** ${reason}`)
                            .setFooter({ text: "Veuillez respecter le règlement." })]
                    }).catch(() => { /* MP fermé, pas grave */ });
                }

                // B. Logs dans un salon (si configuré)
                if (config?.logChannelId) {
                    const logChan = interaction.guild.channels.cache.get(config.logChannelId);
                    if (logChan) await logChan.send({
                        embeds: [new EmbedBuilder()
                            .setTitle('🛡️ Log : Avertissement')
                            .setColor(Colors.Orange)
                            .addFields(
                                { name: 'Membre', value: `${targetUser.tag}`, inline: true },
                                { name: 'Modérateur', value: `${interaction.user.tag}`, inline: true },
                                { name: 'Raison', value: reason }
                            )
                            .setTimestamp()]
                    });
                }

                // 4. VÉRIFICATION AUTO-SANCTION (Kick/Ban automatique)
                // On récupère le membre complet pour pouvoir le kick/ban
                const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
                if (targetMember) {
                    await checkAutoSanction(interaction.guild, targetMember, interaction.channel);
                }

                // 5. Réponse finale confirmant le warn
                const count = await prisma.warn.count({ where: { guildId: interaction.guild.id, userId: targetUser.id } });

                await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle('⚠️ Sanction Appliquée')
                        .setColor(Colors.Yellow)
                        .setDescription(`**Cible :** ${targetUser}\n**Raison :** ${reason}\n\n**Historique :** Cet utilisateur possède désormais \`${count}\` avertissement(s).`)
                        .setFooter({ text: `ID du warn : ${warn.id}` })]
                });

            } catch (e) { 
                console.error(e);
                interaction.reply({ content: "❌ Erreur base de données.", ephemeral: true }); 
            }
        }

        // ====================================================
        // ➖ SOUS-COMMANDE : RETIRER
        // ====================================================
        else if (subcommand === 'retirer') {
            const warnId = interaction.options.getString('id');
            try {
                const warn = await prisma.warn.findUnique({ where: { id: warnId } });
                
                if (!warn || warn.guildId !== interaction.guild.id) {
                    return interaction.reply({ content: "❌ Warn introuvable ou n'appartient pas à ce serveur.", ephemeral: true });
                }

                await prisma.warn.delete({ where: { id: warnId } });
                
                await interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor(Colors.Green)
                        .setDescription(`✅ Avertissement **${warnId}** supprimé avec succès.`)] 
                });
            } catch (e) { 
                console.error(e);
                interaction.reply({ content: "❌ Erreur lors de la suppression.", ephemeral: true }); 
            }
        }

        // ====================================================
        // 📋 SOUS-COMMANDE : LISTE
        // ====================================================
        else if (subcommand === 'liste') {
            const targetUser = interaction.options.getUser('membre');

            // CAS 1 : PAS DE MEMBRE -> DIRECTION DASHBOARD
            if (!targetUser) {
                const count = await prisma.warn.count({ where: { guildId: interaction.guild.id } });
                
                const embed = new EmbedBuilder()
                    .setTitle('📋 Base de données des Sanctions')
                    .setColor(0x2b2d31)
                    .setDescription(`Le serveur enregistre actuellement **${count}** avertissements au total.\n\nUtilisez le Dashboard pour consulter les dossiers individuels par utilisateur.`)
                    .setThumbnail(interaction.guild.iconURL());

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('Ouvrir le Dashboard')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`${DASHBOARD_URL}/dashboard/${interaction.guild.id}`)
                        .setEmoji('🌐')
                );
                return interaction.reply({ embeds: [embed], components: [row] });
            }

            // CAS 2 : MEMBRE SPÉCIFIÉ -> PAGINATION (MAX 5 + LIEN DASHBOARD)
            const totalCount = await prisma.warn.count({ where: { guildId: interaction.guild.id, userId: targetUser.id } });
            
            if (totalCount === 0) return interaction.reply({ content: `✅ Aucun avertissement pour **${targetUser.tag}**.`, ephemeral: true });

            const userWarns = await prisma.warn.findMany({
                where: { guildId: interaction.guild.id, userId: targetUser.id },
                orderBy: { createdAt: 'desc' },
                take: 5 // On ne prend que les 5 derniers
            });

            const pages = userWarns.map((w, i) => {
                return new EmbedBuilder()
                    .setAuthor({ name: `Dossier : ${targetUser.username}`, iconURL: targetUser.displayAvatarURL() })
                    .setTitle(`Détail de l'avertissement #${totalCount - i}`)
                    .setColor(0xFFA500)
                    .addFields(
                        { name: '🆔 ID Unique', value: `\`${w.id}\``, inline: true },
                        { name: '👤 Modérateur', value: `${w.modTag}`, inline: true },
                        { name: '📅 Date', value: `<t:${Math.floor(w.createdAt.getTime() / 1000)}:F>`, inline: false },
                        { name: '📝 Raison', value: `\`\`\`${w.reason}\`\`\`` }
                    )
                    .setFooter({ text: `Page ${i + 1} sur ${totalCount > 5 ? 6 : totalCount}` });
            });

            // Ajout de la page 6 (Lien Dashboard) si + de 5 warns
            if (totalCount > 5) {
                const morePage = new EmbedBuilder()
                    .setAuthor({ name: `Dossier : ${targetUser.username}`, iconURL: targetUser.displayAvatarURL() })
                    .setTitle("Plus d'avertissements ?")
                    .setColor(0x2b2d31)
                    .setDescription(`Cet utilisateur possède **${totalCount}** avertissements.\n\nLes 5 plus récents sont affichés ici.\n\n**Veuillez vous rendre sur le Dashboard pour consulter l'historique complet.**`)
                    .setFooter({ text: "Guardian System • Redirection" });

                pages.push(morePage);
            }

            const pagination = new Pagination(pages);
            await pagination.send(interaction);
        }
    },
};