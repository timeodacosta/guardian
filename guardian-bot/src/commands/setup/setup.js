const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, MessageFlags, Colors } = require('discord.js');
const prisma = require('../../utils/prisma');

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
                .setDescription('```diff\n- /!\\ Rendez-vous sur le dashboard pour configurer le système de ticket de manière plus détaillée.```\nComment souhaitez-vous installer le système de tickets ?')
                .setColor('Orange');

            const select = new StringSelectMenuBuilder()
                .setCustomId('setup_mode_select')
                .setPlaceholder('Faites un choix...')
                .addOptions(
                    new StringSelectMenuOptionBuilder().setLabel('Installation Automatique').setValue('mode_auto').setEmoji('🤖'),
                    new StringSelectMenuOptionBuilder().setLabel('Choisir une catégorie').setValue('mode_manual').setEmoji('📂'),
                );

            const dashboardLink = new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel("Ouvrir le dashboard")
                .setURL(process.env.FRONTEND_URL)

            const rowSelect = new ActionRowBuilder().addComponents(select);
            const rowButton = new ActionRowBuilder().addComponents(dashboardLink);

            await interaction.reply({ 
                embeds: [embed], 
                components: [rowSelect, rowButton],
                flags: MessageFlags.Ephemeral 
            });
        }

        // --- ANTI-SPAM ---
        else if (subCmd === 'antispam') {
            // On s'assure que la config existe
            let config = await prisma.antiSpamConfig.findUnique({ where: { guildId } });
            if (!config) config = await prisma.antiSpamConfig.create({ data: { guildId } });

            const embed = new EmbedBuilder()
                .setTitle('🛡️ Anti-Spam')
                .setDescription(`\`\`\`diff\n- /!\\ Rendez-vous sur le dashboard pour configurer le système d'antispam de manière plus détaillée.\`\`\`\nÉtat actuel : ${config.enabled ? '✅ **Activé**' : '❌ **Désactivé**'}\n\nProtège le serveur contre le flood et les messages répétés.`)
                .setColor(config.enabled ? Colors.Green : Colors.Grey);

            const btn = new ButtonBuilder()
                .setCustomId('antispam_toggle')
                .setLabel(config.enabled ? 'Désactiver' : 'Activer')
                .setStyle(config.enabled ? ButtonStyle.Danger : ButtonStyle.Success);

            const btnDashboard = new ButtonBuilder()
                .setLabel('Ouvrir le dashboard')
                .setStyle(ButtonStyle.Link)
                .setURL(process.env.FRONTEND_URL)

            await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(btn), new ActionRowBuilder().addComponents(btnDashboard)], flags: MessageFlags.Ephemeral });
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