const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Pagination = require('../../utils/Pagination');
const prisma = require('../../utils/prisma');

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

        // --- AJOUTER ---
        if (subcommand === 'ajouter') {
            const target = interaction.options.getUser('membre');
            const reason = interaction.options.getString('raison');
            if (target.id === interaction.user.id) return interaction.reply({ content: "❌ Auto-avertissement interdit.", ephemeral: true });

            try {
                await prisma.guild.upsert({ where: { id: interaction.guild.id }, update: {}, create: { id: interaction.guild.id, name: interaction.guild.name } });
                const warn = await prisma.warn.create({ data: { guildId: interaction.guild.id, userId: target.id, userTag: target.tag, modId: interaction.user.id, modTag: interaction.user.tag, reason } });

                const config = await prisma.warnConfig.findUnique({ where: { guildId: interaction.guild.id } });

                if (!config || config.dmUser) {
                    await target.send({
                        embeds: [new EmbedBuilder()
                            .setTitle(`⚠️ Sanction : ${interaction.guild.name}`)
                            .setColor(Colors.Red)
                            .setDescription(`Vous avez reçu un avertissement.\n\n**Raison :** ${reason}`)
                            .setFooter({ text: "Veuillez respecter le règlement." })]
                    }).catch(() => { });
                }

                if (config?.logChannelId) {
                    const logChan = interaction.guild.channels.cache.get(config.logChannelId);
                    if (logChan) await logChan.send({
                        embeds: [new EmbedBuilder()
                            .setTitle('🛡️ Log : Avertissement')
                            .setColor(Colors.Orange)
                            .addFields(
                                { name: 'Membre', value: `${target.tag}`, inline: true },
                                { name: 'Modérateur', value: `${interaction.user.tag}`, inline: true },
                                { name: 'Raison', value: reason }
                            )
                            .setTimestamp()]
                    });
                }

                const count = await prisma.warn.count({ where: { guildId: interaction.guild.id, userId: target.id } });
                let msg = "";
                if (config?.autoBanCount > 0 && count >= config.autoBanCount) {
                    const m = await interaction.guild.members.fetch(target.id).catch(() => null);
                    if (m?.bannable) { await m.ban({ reason: `Auto-Ban : ${count} warns.` }); msg = "\n⛔ **Membre banni automatiquement.**"; }
                } else if (config?.autoKickCount > 0 && count >= config.autoKickCount) {
                    const m = await interaction.guild.members.fetch(target.id).catch(() => null);
                    if (m?.kickable) { await m.kick(`Auto-Kick : ${count} warns.`); msg = "\n👢 **Membre expulsé automatiquement.**"; }
                }

                await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle('⚠️ Sanction Appliquée')
                        .setColor(Colors.Yellow)
                        .setDescription(`**Cible :** ${target}\n**Raison :** ${reason}\n\n**Historique :** Cet utilisateur possède désormais \`${count}\` avertissement(s).${msg}`)
                        .setFooter({ text: `ID du warn : ${warn.id}` })]
                });
            } catch (e) { interaction.reply({ content: "❌ Erreur BDD.", ephemeral: true }); }
        }

        // --- RETIRER ---
        else if (subcommand === 'retirer') {
            const warnId = interaction.options.getString('id');
            try {
                const warn = await prisma.warn.findUnique({ where: { id: warnId } });
                if (!warn || warn.guildId !== interaction.guild.id) return interaction.reply({ content: "❌ Warn introuvable.", ephemeral: true });
                await prisma.warn.delete({ where: { id: warnId } });
                await interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`✅ Avertissement **${warnId}** supprimé avec succès.`)] });
            } catch (e) { interaction.reply({ content: "❌ Erreur suppression.", ephemeral: true }); }
        }

        // --- LISTE (NOUVELLE PRÉSENTATION) ---
        else if (subcommand === 'liste') {
            const target = interaction.options.getUser('membre');

            // CAS 1 : PAS DE MEMBRE -> DIRECTION DASHBOARD
            if (!target) {
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

            // CAS 2 : MEMBRE SPÉCIFIÉ -> PAGINATION (MAX 5 + 1 DASHBOARD)
            const totalCount = await prisma.warn.count({ where: { guildId: interaction.guild.id, userId: target.id } });
            if (totalCount === 0) return interaction.reply({ content: `✅ Aucun avertissement pour **${target.tag}**.`, ephemeral: true });

            const userWarns = await prisma.warn.findMany({
                where: { guildId: interaction.guild.id, userId: target.id },
                orderBy: { createdAt: 'desc' },
                take: 5 // On ne prend que les 5 derniers
            });

            const pages = userWarns.map((w, i) => {
                return new EmbedBuilder()
                    .setAuthor({ name: `Dossier : ${target.username}`, iconURL: target.displayAvatarURL() })
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

            // Ajout de la page 6 (Dashboard) si nécessaire
            if (totalCount > 5) {
                const morePage = new EmbedBuilder()
                    .setAuthor({ name: `Dossier : ${target.username}`, iconURL: target.displayAvatarURL() })
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