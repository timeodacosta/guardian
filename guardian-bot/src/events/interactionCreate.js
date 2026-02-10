const {
    Events, ChannelType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle,
    EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
    UserSelectMenuBuilder, StringSelectMenuBuilder, ChannelSelectMenuBuilder, AttachmentBuilder, Colors
} = require('discord.js');
const prisma = require('../utils/prisma');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        // ====================================================
        // 1. GESTION DES COMMANDES SLASH (/)
        // ====================================================
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            try { await command.execute(interaction); } catch (e) { console.error(e); }
        }

        // ====================================================
        // 2. GESTION DES MENUS DE SÉLECTION
        // ====================================================
        else if (interaction.isAnySelectMenu()) {

            // --- SETUP TICKETS : CHOIX DU MODE (AUTO/MANUEL) ---
            if (interaction.customId === 'setup_mode_select') {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "❌ Admin requis.", ephemeral: true });

                const choice = interaction.values[0];

                // Helper pour récupérer la config existante ou les valeurs par défaut
                const getEmbedAndButton = async () => {
                    const dbConfig = await prisma.ticketConfig.findUnique({ where: { guildId: interaction.guild.id } });
                    
                    let embedData = dbConfig?.embedPayload || {
                        title: 'Support Ticket',
                        description: 'Cliquez sur le bouton ci-dessous pour contacter le staff.',
                        color: Colors.Blue,
                        footer: { text: 'Guardian System', icon_url: client.user.displayAvatarURL() }
                    };
                    // Conversion couleur (si stockée en hex string ou int)
                    if (embedData.color && typeof embedData.color === 'string') embedData.color = parseInt(embedData.color.replace('#', ''), 16);
                    
                    // Bouton
                    const btnLabel = dbConfig?.buttonLabel || 'Ouvrir un ticket';
                    const btnStyleStr = dbConfig?.buttonStyle || 'Primary';
                    const styleMap = { 'Primary': ButtonStyle.Primary, 'Secondary': ButtonStyle.Secondary, 'Success': ButtonStyle.Success, 'Danger': ButtonStyle.Danger };
                    const btnStyle = styleMap[btnStyleStr] || ButtonStyle.Primary;

                    return { embed: new EmbedBuilder(embedData), label: btnLabel, style: btnStyle };
                };

                // MODE AUTOMATIQUE
                if (choice === 'mode_auto') {
                    await interaction.reply({ content: "⏳ **Installation automatique en cours...**", ephemeral: true });

                    try {
                        const { embed, label, style } = await getEmbedAndButton();

                        const category = await interaction.guild.channels.create({
                            name: 'TICKETS',
                            type: ChannelType.GuildCategory
                        });

                        const channel = await interaction.guild.channels.create({
                            name: 'ouvrir-ticket',
                            type: ChannelType.GuildText,
                            parent: category.id,
                            permissionOverwrites: [
                                { id: interaction.guild.id, allow: [PermissionsBitField.Flags.ViewChannel], deny: [PermissionsBitField.Flags.SendMessages] },
                                { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                            ]
                        });

                        const row = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('create_ticket').setLabel(label).setStyle(style).setEmoji('📩')
                        );

                        await channel.send({ embeds: [embed], components: [row] });

                        // Sauvegarde DB
                        await prisma.ticketConfig.upsert({
                            where: { guildId: interaction.guild.id },
                            update: { embedPayload: embed.toJSON() },
                            create: { guildId: interaction.guild.id, embedPayload: embed.toJSON() }
                        });

                        await interaction.editReply(`✅ **Installation terminée !** Salon créé : ${channel}`);

                    } catch (error) {
                        console.error(error);
                        await interaction.editReply("❌ Erreur lors de l'installation automatique.");
                    }
                }
                // MODE MANUEL (Affiche le menu de sélection de catégorie)
                else if (choice === 'mode_manual') {
                    const row = new ActionRowBuilder().addComponents(
                        new ChannelSelectMenuBuilder()
                            .setCustomId('setup_category_select')
                            .setPlaceholder('Choisissez la catégorie où créer le salon')
                            .addChannelTypes(ChannelType.GuildCategory)
                    );
                    await interaction.reply({ content: "📂 **Choisissez la catégorie :**", components: [row], ephemeral: true });
                }
            }

            // --- SETUP TICKETS : SÉLECTION DE LA CATÉGORIE (MODE MANUEL) ---
            else if (interaction.customId === 'setup_category_select') {
                await interaction.deferReply({ ephemeral: true });
                const categoryId = interaction.values[0];

                try {
                    const dbConfig = await prisma.ticketConfig.findUnique({ where: { guildId: interaction.guild.id } });
                    
                    let embedData = dbConfig?.embedPayload || {
                        title: 'Support Ticket',
                        description: 'Cliquez sur le bouton ci-dessous pour contacter le staff.',
                        color: Colors.Blue,
                        footer: { text: 'Guardian System', icon_url: client.user.displayAvatarURL() }
                    };
                    if (embedData.color && typeof embedData.color === 'string') embedData.color = parseInt(embedData.color.replace('#', ''), 16);
                    
                    const btnLabel = dbConfig?.buttonLabel || 'Ouvrir un ticket';
                    const btnStyleStr = dbConfig?.buttonStyle || 'Primary';
                    const styleMap = { 'Primary': ButtonStyle.Primary, 'Secondary': ButtonStyle.Secondary, 'Success': ButtonStyle.Success, 'Danger': ButtonStyle.Danger };
                    const btnStyle = styleMap[btnStyleStr] || ButtonStyle.Primary;

                    const embed = new EmbedBuilder(embedData);

                    const channel = await interaction.guild.channels.create({
                        name: 'ouvrir-ticket',
                        type: ChannelType.GuildText,
                        parent: categoryId,
                        permissionOverwrites: [
                            { id: interaction.guild.id, allow: [PermissionsBitField.Flags.ViewChannel], deny: [PermissionsBitField.Flags.SendMessages] },
                            { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                        ]
                    });

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('create_ticket').setLabel(btnLabel).setStyle(btnStyle).setEmoji('📩')
                    );

                    await channel.send({ embeds: [embed], components: [row] });

                    await prisma.ticketConfig.upsert({
                        where: { guildId: interaction.guild.id },
                        update: { embedPayload: embed.toJSON() },
                        create: { guildId: interaction.guild.id, embedPayload: embed.toJSON() }
                    });

                    await interaction.editReply(`✅ **Installé avec succès !** Salon : ${channel}`);

                } catch (error) {
                    console.error(error);
                    await interaction.editReply("❌ Erreur lors de la création.");
                }
            }

            // --- GESTION MEMBRES TICKET (STAFF ONLY) ---
            else if (['action_add_user_select', 'action_remove_user_select'].includes(interaction.customId)) {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                    return interaction.reply({ content: "❌ Seul le staff peut gérer les membres.", ephemeral: true });
                }

                const userId = interaction.values[0];

                if (interaction.customId === 'action_add_user_select') {
                    await interaction.channel.permissionOverwrites.edit(userId, { ViewChannel: true, SendMessages: true });
                    const embed = new EmbedBuilder().setColor(Colors.Green).setDescription(`✅ <@${userId}> a été **ajouté** au ticket.`);
                    await interaction.update({ embeds: [embed], components: [], content: '' });
                }
                else if (interaction.customId === 'action_remove_user_select') {
                    await interaction.channel.permissionOverwrites.delete(userId);
                    const embed = new EmbedBuilder().setColor(Colors.Orange).setDescription(`👋 <@${userId}> a été **retiré** du ticket.`);
                    await interaction.update({ embeds: [embed], components: [], content: '' });
                }
            }
        }

        // ====================================================
        // 3. GESTION DES BOUTONS
        // ====================================================
        else if (interaction.isButton()) {

            // --- MODULE : ANTI-SPAM (TOGGLE) ---
            if (interaction.customId === 'antispam_toggle') {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "⛔ Admin requis.", ephemeral: true });

                // 1. Récupérer config
                const config = await prisma.antiSpamConfig.findUnique({ where: { guildId: interaction.guild.id } });
                const newState = !config.enabled; // Inverser l'état

                // 2. Mettre à jour DB
                await prisma.antiSpamConfig.update({ where: { guildId: interaction.guild.id }, data: { enabled: newState } });

                // 3. Mettre à jour l'Embed et le Bouton
                const newEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                    .setDescription(`État actuel : ${newState ? '✅ **Activé**' : '❌ **Désactivé**'}\n\nProtège le serveur contre le flood et les messages répétés.`)
                    .setColor(newState ? Colors.Green : Colors.Grey);

                const newBtn = new ButtonBuilder()
                    .setCustomId('antispam_toggle')
                    .setLabel(newState ? 'Désactiver' : 'Activer')
                    .setStyle(newState ? ButtonStyle.Danger : ButtonStyle.Success);

                await interaction.update({ embeds: [newEmbed], components: [new ActionRowBuilder().addComponents(newBtn)] });
            }

            // --- MODULE : ANTI-LINK (TOGGLE) ---
            else if (interaction.customId === 'antilink_toggle') {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "⛔ Admin requis.", ephemeral: true });

                const config = await prisma.antiLinkConfig.findUnique({ where: { guildId: interaction.guild.id } });
                const newState = !config.enabled;

                await prisma.antiLinkConfig.update({ where: { guildId: interaction.guild.id }, data: { enabled: newState } });

                const newEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                    .setDescription(`État actuel : ${newState ? '✅ **Activé**' : '❌ **Désactivé**'}\n\nSupprime automatiquement les liens postés par les membres non autorisés.`)
                    .setColor(newState ? Colors.Green : Colors.Grey);

                const newBtn = new ButtonBuilder()
                    .setCustomId('antilink_toggle')
                    .setLabel(newState ? 'Désactiver' : 'Activer')
                    .setStyle(newState ? ButtonStyle.Danger : ButtonStyle.Success);

                await interaction.update({ embeds: [newEmbed], components: [new ActionRowBuilder().addComponents(newBtn)] });
            }

            // --- MODULE : TICKETS (CRÉATION) ---
            else if (interaction.customId === 'create_ticket') {
                const modal = new ModalBuilder().setCustomId('ticket_modal_submit').setTitle('Ouvrir un ticket');
                const reasonInput = new TextInputBuilder().setCustomId('ticket_reason').setLabel("Motif de votre demande").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("Décrivez votre problème ici...");
                modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
                await interaction.showModal(modal);
                return;
            }

            // --- MODULE : TICKETS (GESTION STAFF) ---
            // Vérification Permission Staff pour toutes les actions ci-dessous
            else if (['ticket_close', 'ticket_reopen', 'ticket_delete', 'ticket_claim', 'ticket_transcript', 'ticket_add_user', 'ticket_remove_user', 'ticket_delete_confirm', 'ticket_delete_cancel'].includes(interaction.customId)) {
                
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                    return interaction.reply({ content: "⛔ **Action réservée au staff.**", ephemeral: true });
                }

                // FERMER
                if (interaction.customId === 'ticket_close') {
                    // Désactive les boutons
                    const newComponents = interaction.message.components.map(row => {
                        const newRow = ActionRowBuilder.from(row);
                        newRow.components.forEach(c => c.setDisabled(true));
                        return newRow;
                    });
                    await interaction.update({ components: newComponents });

                    try { await prisma.ticket.updateMany({ where: { channelId: interaction.channel.id }, data: { status: 'CLOSED' } }); } catch (e) { }

                    const closeEmbed = new EmbedBuilder()
                        .setTitle('🔒 Ticket Fermé')
                        .setColor(Colors.Orange)
                        .setDescription(`Fermé par **${interaction.user.username}**.`)
                        .addFields({ name: '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true })
                        .setFooter({ text: 'Guardian System', iconURL: client.user.displayAvatarURL() });

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('ticket_reopen').setLabel('Réouvrir').setStyle(ButtonStyle.Success).setEmoji('🔓'),
                        new ButtonBuilder().setCustomId('ticket_delete').setLabel('Supprimer').setStyle(ButtonStyle.Danger).setEmoji('⛔'),
                        new ButtonBuilder().setCustomId('ticket_transcript').setLabel('Transcript').setStyle(ButtonStyle.Secondary).setEmoji('📜')
                    );

                    await interaction.channel.send({ embeds: [closeEmbed], components: [row] });
                }

                // RÉOUVRIR
                else if (interaction.customId === 'ticket_reopen') {
                    await interaction.deferUpdate();
                    await interaction.message.delete().catch(() => { });
                    try { await prisma.ticket.updateMany({ where: { channelId: interaction.channel.id }, data: { status: 'OPEN' } }); } catch (e) { }

                    // Réactiver les boutons du premier message (si trouvé)
                    const messages = await interaction.channel.messages.fetch({ limit: 20 });
                    const welcomeMsg = messages.find(m => m.author.id === client.user.id && m.components.some(row => row.components.some(btn => btn.customId === 'ticket_close')));

                    if (welcomeMsg) {
                        const unlockedRows = welcomeMsg.components.map(row => {
                            const newRow = ActionRowBuilder.from(row);
                            newRow.components.forEach(c => c.setDisabled(false));
                            return newRow;
                        });
                        await welcomeMsg.edit({ components: unlockedRows });
                    }
                    await interaction.channel.send({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`🔓 **Ticket réouvert !**`)] });
                }

                // SUPPRIMER (DEMANDE CONFIRMATION)
                else if (interaction.customId === 'ticket_delete') {
                    const ticketData = await prisma.ticket.findFirst({ where: { channelId: interaction.channel.id } });
                    if (ticketData && ticketData.status === 'OPEN') {
                        return interaction.reply({ content: "⚠️ **Action impossible :** Fermez d'abord le ticket (🔒).", ephemeral: true });
                    }

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('ticket_delete_confirm').setLabel('Confirmer la suppression').setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('ticket_delete_cancel').setLabel('Annuler').setStyle(ButtonStyle.Secondary)
                    );

                    const warningEmbed = new EmbedBuilder()
                        .setTitle("⚠️ Suppression du Ticket")
                        .setColor(Colors.Red)
                        .setDescription(`Vous êtes sur le point de supprimer ce ticket **définitivement**.\n\n**Conséquences :**`)
                        .addFields(
                            { name: '📂 Salon', value: 'Sera supprimé instantanément', inline: true },
                            { name: '💾 Données', value: 'Toutes les archives seront effacées', inline: true }
                        )
                        .setFooter({ text: 'Cette action est irréversible.' });

                    await interaction.reply({ embeds: [warningEmbed], components: [row] });
                }

                // CONFIRMATION SUPPRESSION
                else if (interaction.customId === 'ticket_delete_confirm') {
                    // Animation de suppression
                    const deleteDB = prisma.ticket.deleteMany({ where: { channelId: interaction.channel.id } }).catch(() => { });

                    await interaction.update({
                        embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`**Suppression en cours...**\n\n💾 Base de données : \`[🟩⬜⬜]\`\n📂 Salon Discord : \`[⬜⬜⬜]\``)],
                        components: []
                    });
                    await wait(1000);

                    await interaction.editReply({
                        embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`**Suppression en cours...**\n\n💾 Base de données : \`[🟩🟩⬜]\`\n📂 Salon Discord : \`[⬜⬜⬜]\``)]
                    });
                    await wait(1000);

                    await deleteDB;
                    await interaction.editReply({
                        embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`**Suppression en cours...**\n\n💾 Base de données : \`[🟩🟩🟩]\` ✅\n📂 Salon Discord : \`[⬜⬜⬜]\``)]
                    });
                    await wait(800);

                    await interaction.editReply({
                        embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`**Suppression en cours...**\n\n💾 Base de données : \`[🟩🟩🟩]\` ✅\n📂 Salon Discord : \`[🟩🟩⬜]\``)]
                    });
                    await wait(1000);

                    await interaction.editReply({
                        embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`**Suppression en cours...**\n\n💾 Base de données : \`[🟩🟩🟩]\` ✅\n📂 Salon Discord : \`[🟩🟩🟩]\` 🚀`)]
                    });
                    await wait(800);

                    await interaction.channel.delete().catch(() => { });
                }

                // ANNULATION SUPPRESSION
                else if (interaction.customId === 'ticket_delete_cancel') {
                    await interaction.message.delete().catch(() => { });
                }

                // CLAIM
                else if (interaction.customId === 'ticket_claim') {
                    const claimEmbed = new EmbedBuilder()
                        .setColor(Colors.Blue)
                        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
                        .setDescription(`🙋‍♂️ **${interaction.user}** a pris en charge ce ticket.`);

                    await interaction.reply({ embeds: [claimEmbed] });

                    // Met à jour le bouton Claim pour le désactiver
                    const newRows = interaction.message.components.map(row => {
                        const newRow = ActionRowBuilder.from(row);
                        newRow.components.forEach(btn => {
                            if (btn.data.custom_id === 'ticket_claim') {
                                btn.setDisabled(true);
                                btn.setLabel(`Géré par ${interaction.user.username}`);
                                btn.setStyle(ButtonStyle.Secondary);
                            }
                        });
                        return newRow;
                    });
                    await interaction.message.edit({ components: newRows });
                }

                // TRANSCRIPT
                else if (interaction.customId === 'ticket_transcript') {
                    await interaction.deferReply({ ephemeral: true });
                    const msgs = await interaction.channel.messages.fetch({ limit: 100 });
                    const logs = msgs.reverse().map(m => `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content}`).join('\n');
                    await interaction.editReply({
                        embeds: [new EmbedBuilder().setColor(Colors.Blue).setTitle('📜 Transcript').setDescription('Fichier généré :')],
                        files: [new AttachmentBuilder(Buffer.from(logs), { name: `transcript-${interaction.channel.name}.txt` })]
                    });
                }

                // MENU AJOUT MEMBRE
                else if (interaction.customId === 'ticket_add_user') {
                    const row = new ActionRowBuilder().addComponents(new UserSelectMenuBuilder().setCustomId('action_add_user_select').setPlaceholder('Rechercher un membre...'));
                    await interaction.reply({ content: "👤 **Ajouter un membre :**", components: [row], ephemeral: true });
                }
                // MENU RETRAIT MEMBRE
                else if (interaction.customId === 'ticket_remove_user') {
                    const row = new ActionRowBuilder().addComponents(new UserSelectMenuBuilder().setCustomId('action_remove_user_select').setPlaceholder('Rechercher un membre...'));
                    await interaction.reply({ content: "👤 **Retirer un membre :**", components: [row], ephemeral: true });
                }
            }
        }

        // ====================================================
        // 4. GESTION DES MODALS (Création Ticket Finale)
        // ====================================================
        else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'ticket_modal_submit') {
                await interaction.deferReply({ ephemeral: true });
                try {
                    const reason = interaction.fields.getTextInputValue('ticket_reason');

                    // 1. Récupération Config
                    let config = await prisma.ticketConfig.findUnique({ where: { guildId: interaction.guild.id } });
                    
                    // Données par défaut si pas de config
                    let ticketData = config?.ticketEmbedPayload || {
                        title: "📨 Nouveau Ticket",
                        description: "Un membre du staff va prendre en charge votre demande rapidement.",
                        color: 0x3b82f6,
                        thumbnail: { url: interaction.guild.iconURL() },
                        footer: { text: "Support System", icon_url: client.user.displayAvatarURL() },
                        timestamp: true
                    };

                    // 2. Traitement Message hors embed
                    let rawContent = ticketData.content || "";
                    if (!rawContent.includes('{here}')) rawContent = rawContent ? rawContent + " {here}" : "{here}";

                    let adminMention = config?.adminRole ? `<@&${config.adminRole}>` : "";
                    
                    let messageContent = rawContent
                        .replace(/{user}/g, interaction.user.toString())
                        .replace(/{here}/g, '@here')
                        .replace(/{everyone}/g, '@everyone')
                        .replace(/{admin}/g, adminMention);

                    // 3. Création Salon
                    const channel = await interaction.guild.channels.create({
                        name: `ticket-${interaction.user.username}`,
                        type: ChannelType.GuildText,
                        parent: interaction.channel?.parentId || null,
                        permissionOverwrites: [
                            { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                            { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                            { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                        ],
                    });

                    // Permissions Admin (si configuré)
                    if (config?.adminRole) {
                        await channel.permissionOverwrites.create(config.adminRole, { ViewChannel: true, SendMessages: true });
                    }

                    // 4. Sauvegarde BDD
                    await prisma.ticket.create({
                        data: { guildId: interaction.guild.id, userId: interaction.user.id, channelId: channel.id, status: "OPEN", transcript: `Raison: ${reason}` }
                    });

                    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`✅ Votre ticket a été créé : ${channel}`)] });

                    // 5. Construction du Message de Bienvenue
                    const cleanEmbed = { ...ticketData };
                    delete cleanEmbed.content;
                    if (!cleanEmbed.description) cleanEmbed.description = "";
                    cleanEmbed.description += `\n\n📝 **Motif de la demande :**\n\`\`\`${reason}\`\`\``;
                    
                    if (cleanEmbed.color && typeof cleanEmbed.color === 'string') cleanEmbed.color = parseInt(cleanEmbed.color.replace('#', ''), 16);
                    if (cleanEmbed.timestamp === true) cleanEmbed.timestamp = new Date(); else delete cleanEmbed.timestamp;
                    
                    // Nettoyage champs inutiles pour l'embed builder
                    delete cleanEmbed.buttons; delete cleanEmbed.author; delete cleanEmbed.footer; delete cleanEmbed.image; delete cleanEmbed.thumbnail;

                    const embed = new EmbedBuilder(cleanEmbed);
                    if (ticketData.author?.name) embed.setAuthor({ name: ticketData.author.name, iconURL: ticketData.author.icon_url, url: ticketData.author.url });
                    if (ticketData.footer?.text) embed.setFooter({ text: ticketData.footer.text, iconURL: ticketData.footer.icon_url });
                    if (ticketData.thumbnail?.url) embed.setThumbnail(ticketData.thumbnail.url);
                    if (ticketData.image?.url) embed.setImage(ticketData.image.url);

                    // 6. Boutons du ticket (Selon config)
                    const btns = ticketData.buttons || {};
                    const showClaim = btns.claim ?? false;
                    const showTranscript = btns.transcript ?? false;
                    const showAddUser = btns.addUser ?? false;
                    const showRemoveUser = btns.removeUser ?? false;

                    const row1 = new ActionRowBuilder();
                    row1.addComponents(new ButtonBuilder().setCustomId('ticket_close').setLabel('Fermer').setStyle(ButtonStyle.Danger).setEmoji('🔒'));
                    if (showClaim) row1.addComponents(new ButtonBuilder().setCustomId('ticket_claim').setLabel('Claim').setStyle(ButtonStyle.Success).setEmoji('🙋‍♂️'));
                    if (showTranscript) row1.addComponents(new ButtonBuilder().setCustomId('ticket_transcript').setLabel('Transcript').setStyle(ButtonStyle.Secondary).setEmoji('📜'));

                    const row2 = new ActionRowBuilder();
                    if (showAddUser) row2.addComponents(new ButtonBuilder().setCustomId('ticket_add_user').setLabel('Ajouter').setStyle(ButtonStyle.Primary).setEmoji('➕'));
                    if (showRemoveUser) row2.addComponents(new ButtonBuilder().setCustomId('ticket_remove_user').setLabel('Retirer').setStyle(ButtonStyle.Primary).setEmoji('➖'));

                    const components = [row1];
                    if (row2.components.length > 0) components.push(row2);

                    const welcomeMsg = await channel.send({ content: messageContent, embeds: [embed], components: components });
                    await welcomeMsg.pin().catch(() => { });

                } catch (error) { console.error(error); await interaction.editReply("❌ Erreur création."); }
            }
        }
    }
};