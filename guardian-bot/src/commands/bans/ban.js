const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Pagination = require('../../utils/Pagination'); // Assure-toi que le chemin est bon
const prisma = require('../../utils/prisma'); // Assure-toi que le chemin est bon

const DASHBOARD_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Système de bannissement')
        .addSubcommand(subcommand =>
            subcommand.setName('add').setDescription('Bannir un utilisateur')
                .addUserOption(o => o.setName('membre').setDescription('Le membre à bannir').setRequired(true))
                .addStringOption(o => o.setName('raison').setDescription('La raison').setRequired(true))
                .addBooleanOption(o => o.setName('delete_messages').setDescription('Supprimer les messages des 7 derniers jours ?'))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('remove').setDescription('Débannir un utilisateur via ID')
                .addStringOption(o => o.setName('userid').setDescription('ID Discord de l\'utilisateur').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('liste').setDescription('Voir les bannissements enregistrés')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // --- BANNIR ---
        if (subcommand === 'add') {
            const target = interaction.options.getUser('membre');
            const reason = interaction.options.getString('raison');
            const deleteMsgs = interaction.options.getBoolean('delete_messages') || false;

            if (target.id === interaction.user.id) return interaction.reply({ content: "❌ Vous ne pouvez pas vous bannir vous-même.", ephemeral: true });

            await interaction.deferReply();

            try {
                // 1. Envoi MP (si possible)
                await target.send({
                    embeds: [new EmbedBuilder()
                        .setTitle(`⛔ Bannissement : ${interaction.guild.name}`)
                        .setColor(Colors.DarkRed)
                        .setDescription(`Vous avez été banni du serveur.\n\n**Raison :** ${reason}`)
                    ]
                }).catch(() => {});

                // 2. Bannissement Discord
                await interaction.guild.members.ban(target, { 
                    reason: `Par ${interaction.user.tag} : ${reason}`,
                    deleteMessageSeconds: deleteMsgs ? 604800 : 0 // 7 jours ou 0
                });

                // 3. Sauvegarde DB
                // On s'assure que la guilde existe
                await prisma.guild.upsert({ where: { id: interaction.guild.id }, update: {}, create: { id: interaction.guild.id, name: interaction.guild.name } });
                
                const banEntry = await prisma.ban.create({
                    data: {
                        guildId: interaction.guild.id,
                        userId: target.id,
                        userTag: target.tag,
                        userAvatar: target.displayAvatarURL(),
                        modId: interaction.user.id,
                        modTag: interaction.user.tag,
                        reason: reason
                    }
                });

                await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setTitle('⛔ Marteau du Bannissement')
                        .setColor(Colors.Red)
                        .setDescription(`**Cible :** ${target.tag}\n**Raison :** ${reason}\n\nL'utilisateur a été banni et enregistré dans la base de données.`)
                        .setFooter({ text: `ID Dossier : ${banEntry.id}` })]
                });

            } catch (error) {
                console.error(error);
                await interaction.editReply({ content: "❌ Impossible de bannir cet utilisateur (vérifiez mes permissions ou son rôle)." });
            }
        }

        // --- DÉBANNIR ---
        else if (subcommand === 'remove') {
            const targetId = interaction.options.getString('userid');
            await interaction.deferReply();

            try {
                // Déban Discord
                await interaction.guild.members.unban(targetId);
                
                // Nettoyage DB (Optionnel : on peut garder l'historique ou le supprimer, ici on supprime pour synchroniser)
                await prisma.ban.deleteMany({ where: { guildId: interaction.guild.id, userId: targetId } });

                await interaction.editReply({ content: `✅ L'utilisateur **${targetId}** a été débanni.` });
            } catch (error) {
                await interaction.editReply({ content: "❌ Impossible de débannir (ID invalide ou non banni)." });
            }
        }

        // --- LISTE ---
        else if (subcommand === 'liste') {
            const count = await prisma.ban.count({ where: { guildId: interaction.guild.id } });
            
            const embed = new EmbedBuilder()
                .setTitle('📋 Registre des Bannissements')
                .setColor(Colors.Red)
                .setDescription(`Il y a actuellement **${count}** bannissements enregistrés en base de données.\nPour consulter et gérer les bannissements en détail, utilisez le Dashboard.`)
                .setThumbnail(interaction.guild.iconURL());

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Accéder au Dashboard')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`${DASHBOARD_URL}/dashboard/${interaction.guild.id}`)
                    .setEmoji('🌐')
            );

            await interaction.reply({ embeds: [embed], components: [row] });
        }
    }
};