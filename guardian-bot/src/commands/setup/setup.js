const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, MessageFlags, Colors } = require('discord.js');
const prisma = require('../../utils/prisma'); // N'oublie pas d'importer prisma !

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Configuration générale du bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        // Tickets
        .addSubcommand(subcommand =>
            subcommand.setName('ticket').setDescription('Lance l\'assistant de configuration des tickets')
        )
        // Anti-Spam (Plus d'option "state", on gère ça au bouton)
        .addSubcommand(subcommand =>
            subcommand.setName('antispam').setDescription('Configure la protection anti-spam')
        )
        // Anti-Link (Idem)
        .addSubcommand(subcommand =>
            subcommand.setName('antilink').setDescription('Configure le blocage de liens')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('welcome').setDescription('Configuration du système de bienvenue').addChannelOption(o => o.setName('channel').setDescription('Salon de bienvenue').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('logs').setDescription('Configuration des logs')
        ),

    async execute(interaction) {
        const subCmd = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        // --- TICKET ---
        if (subCmd === 'ticket') {
            const embed = new EmbedBuilder()
                .setTitle('🛠️ Configuration des Tickets')
                .setDescription('Comment souhaitez-vous installer le système de tickets ?')
                .setColor('Orange');

            const select = new StringSelectMenuBuilder()
                .setCustomId('setup_mode_select')
                .setPlaceholder('Faites un choix...')
                .addOptions(
                    new StringSelectMenuOptionBuilder().setLabel('Installation Automatique').setValue('mode_auto').setEmoji('🤖'),
                    new StringSelectMenuOptionBuilder().setLabel('Choisir une catégorie').setValue('mode_manual').setEmoji('📂'),
                );

            await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)], flags: MessageFlags.Ephemeral });
        }

        // --- ANTI-SPAM ---
        else if (subCmd === 'antispam') {
            // On s'assure que la config existe
            let config = await prisma.antiSpamConfig.findUnique({ where: { guildId } });
            if (!config) config = await prisma.antiSpamConfig.create({ data: { guildId } });

            const embed = new EmbedBuilder()
                .setTitle('🛡️ Anti-Spam')
                .setDescription(`État actuel : ${config.enabled ? '✅ **Activé**' : '❌ **Désactivé**'}\n\nProtège le serveur contre le flood et les messages répétés.`)
                .setColor(config.enabled ? Colors.Green : Colors.Grey);

            const btn = new ButtonBuilder()
                .setCustomId('antispam_toggle')
                .setLabel(config.enabled ? 'Désactiver' : 'Activer')
                .setStyle(config.enabled ? ButtonStyle.Danger : ButtonStyle.Success);

            await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(btn)], flags: MessageFlags.Ephemeral });
        }

        // --- ANTI-LINK ---
        else if (subCmd === 'antilink') {
            let config = await prisma.antiLinkConfig.findUnique({ where: { guildId } });
            if (!config) config = await prisma.antiLinkConfig.create({ data: { guildId } });

            const embed = new EmbedBuilder()
                .setTitle('🔗 Anti-Link')
                .setDescription(`État actuel : ${config.enabled ? '✅ **Activé**' : '❌ **Désactivé**'}\n\nSupprime automatiquement les liens postés par les membres non autorisés.`)
                .setColor(config.enabled ? Colors.Green : Colors.Grey);

            const btn = new ButtonBuilder()
                .setCustomId('antilink_toggle')
                .setLabel(config.enabled ? 'Désactiver' : 'Activer')
                .setStyle(config.enabled ? ButtonStyle.Danger : ButtonStyle.Success);

            await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(btn)], flags: MessageFlags.Ephemeral });
        }
    },
};