const { Client, Collection, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const loadCommands = require('./src/loaders/loadCommands');
const loadEvents = require('./src/loaders/loadEvents');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const querystring = require('querystring');
const prisma = require('./src/utils/prisma');
require('dotenv').config();

// --- CLIENT DISCORD ---
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});
client.commands = new Collection();

// --- SERVEUR EXPRESS ---
const app = express();
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));

// 1. AUTH
app.get('/api/auth/login', (req, res) => {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20guilds`;
    res.redirect(authUrl);
});

app.get('/api/auth/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.send("Erreur: Pas de code.");
    try {
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token',
            querystring.stringify({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: process.env.DISCORD_REDIRECT_URI
            }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        const accessToken = tokenResponse.data.access_token;
        const userRes = await axios.get('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${accessToken}` } });
        const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `Bearer ${accessToken}` } });

        const validGuilds = guildsRes.data.filter(g => (BigInt(g.permissions) & 0x20n) === 0x20n).map(g => ({
            id: g.id, name: g.name, icon: g.icon, botInGuild: client.guilds.cache.has(g.id)
        }));

        const userData = JSON.stringify({ username: userRes.data.username, avatar: userRes.data.avatar, id: userRes.data.id, guilds: validGuilds });
        res.redirect(`${process.env.FRONTEND_URL}/?data=${encodeURIComponent(userData)}`);
    } catch (error) { console.error("OAuth Error:", error); res.status(500).send("Erreur connexion."); }
});

// 2. TICKETS, ROLES & WARNS
app.get('/api/tickets/:guildId', async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({ where: { guildId: req.params.guildId }, orderBy: { createdAt: 'desc' } });
        res.json(tickets);
    } catch (e) { res.status(500).json({ error: "Erreur BDD" }); }
});

app.get('/api/roles/:guildId', async (req, res) => {
    try {
        const guild = client.guilds.cache.get(req.params.guildId);
        if (!guild) return res.status(404).json({ error: "Serveur introuvable" });

        const roles = guild.roles.cache
            .filter(r => r.name !== '@everyone' && !r.managed)
            .sort((a, b) => b.position - a.position)
            .map(r => ({ id: r.id, name: r.name, color: r.hexColor }));

        res.json(roles);
    } catch (e) { res.status(500).json({ error: "Erreur rôles" }); }
});

app.get('/api/warns/:guildId', async (req, res) => {
    try {
        const guild = client.guilds.cache.get(req.params.guildId);
        const warns = await prisma.warn.findMany({
            where: { guildId: req.params.guildId },
            orderBy: { createdAt: 'desc' }
        });

        // On enrichit les données avec l'avatar réel de Discord
        const enrichedWarns = await Promise.all(warns.map(async (w) => {
            let avatar = null;
            if (guild) {
                const member = guild.members.cache.get(w.userId) || await guild.members.fetch(w.userId).catch(() => null);
                avatar = member ? member.user.displayAvatarURL({ extension: 'png' }) : null;
            }
            return { ...w, userAvatar: avatar };
        }));

        res.json(enrichedWarns);
    } catch (e) {
        res.status(500).json({ error: "Erreur récupération warns" });
    }
});

app.delete('/api/warns/:id', async (req, res) => {
    try {
        await prisma.warn.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Erreur suppression warn" }); }
});

app.delete('/api/tickets/:channelId', async (req, res) => {
    const { channelId } = req.params;
    try {
        await prisma.ticket.deleteMany({ where: { channelId: channelId } });
        try {
            const channel = await client.channels.fetch(channelId);
            if (channel) await channel.delete();
        } catch (discordErr) { }
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: "Erreur serveur" }); }
});

// --- NOUVEAU : CONFIGURATION WARN ---
app.get('/api/warn-config/:guildId', async (req, res) => {
    try {
        const config = await prisma.warnConfig.findUnique({ where: { guildId: req.params.guildId } });
        res.json(config || { dmUser: true, autoKickCount: 0, autoBanCount: 0, logChannelId: null });
    } catch (e) { res.status(500).json({ error: "Erreur config warn" }); }
});

app.post('/api/warn-config/:guildId', async (req, res) => {
    try {
        const { dmUser, autoKickCount, autoBanCount, logChannelId } = req.body;
        const config = await prisma.warnConfig.upsert({
            where: { guildId: req.params.guildId },
            update: { dmUser, autoKickCount: parseInt(autoKickCount), autoBanCount: parseInt(autoBanCount), logChannelId },
            create: { guildId: req.params.guildId, dmUser, autoKickCount: parseInt(autoKickCount), autoBanCount: parseInt(autoBanCount), logChannelId }
        });
        res.json(config);
    } catch (e) { res.status(500).json({ error: "Erreur sauvegarde config warn" }); }
});

// 3. SETTINGS & LIVE UPDATE
app.get('/api/settings/:guildId', async (req, res) => {
    try {
        let config = await prisma.ticketConfig.findUnique({ where: { guildId: req.params.guildId } });
        if (!config) config = { embedPayload: null, buttonLabel: "Ouvrir un ticket", buttonStyle: "Primary" };

        const responseData = {
            ...config,
            content: config.ticketEmbedPayload?.content || "",
            adminRole: config.adminRole
        };

        res.json(responseData);
    } catch (e) { res.status(500).json({ error: "Erreur config" }); }
});

app.post('/api/settings/:guildId', async (req, res) => {
    const { guildId } = req.params;
    const {
        embedPayload, buttonLabel, buttonStyle, showClaimBtn, showTranscriptBtn,
        ticketEmbedPayload, content, adminRole
    } = req.body;

    try {
        await prisma.guild.upsert({ where: { id: guildId }, update: {}, create: { id: guildId, name: 'Web-Created' } });

        const finalTicketPayload = { ...ticketEmbedPayload, content: content || "" };

        // 1. Sauvegarde BDD
        const config = await prisma.ticketConfig.upsert({
            where: { guildId },
            update: {
                embedPayload: embedPayload || {},
                ticketEmbedPayload: finalTicketPayload,
                buttonLabel: buttonLabel || "Ouvrir un ticket",
                buttonStyle: buttonStyle || "Primary",
                showClaimBtn: showClaimBtn ?? true,
                showTranscriptBtn: showTranscriptBtn ?? true,
                adminRole: adminRole || null
            },
            create: {
                guildId,
                embedPayload: embedPayload || {},
                ticketEmbedPayload: finalTicketPayload,
                buttonLabel: buttonLabel || "Ouvrir un ticket",
                buttonStyle: buttonStyle || "Primary",
                showClaimBtn: showClaimBtn ?? true,
                showTranscriptBtn: showTranscriptBtn ?? true,
                adminRole: adminRole || null
            }
        });

        // 2. LIVE UPDATE SUR DISCORD
        try {
            const guild = client.guilds.cache.get(guildId);
            if (guild) {
                const channel = guild.channels.cache.find(c => c.name === 'ouvrir-ticket' && c.type === 0);
                if (channel) {
                    const messages = await channel.messages.fetch({ limit: 10 });
                    const botMsg = messages.find(m => m.author.id === client.user.id && m.components.length > 0);

                    if (botMsg) {
                        const embedData = embedPayload || {};
                        if (embedData.color && typeof embedData.color === 'string') {
                            embedData.color = parseInt(embedData.color.replace('#', ''), 16);
                        }
                        const embed = new EmbedBuilder(embedData);
                        if (!embedData.footer) embed.setFooter({ text: 'Guardian System', iconURL: client.user.displayAvatarURL() });

                        const styleMap = { 'Primary': ButtonStyle.Primary, 'Secondary': ButtonStyle.Secondary, 'Success': ButtonStyle.Success, 'Danger': ButtonStyle.Danger };
                        const style = styleMap[buttonStyle] || ButtonStyle.Primary;

                        const row = new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('create_ticket')
                                .setLabel(buttonLabel || 'Ouvrir un ticket')
                                .setStyle(style)
                                .setEmoji('📩')
                        );

                        await botMsg.edit({ embeds: [embed], components: [row] });
                    }
                }
            }
        } catch (discordErr) {
            console.error("⚠️ Erreur Live Update Discord:", discordErr);
        }

        res.json({ success: true, config });
    } catch (e) {
        console.error("❌ ERREUR SAVE:", e);
        res.status(500).json({ error: e.message });
    }
});

// 4. SYNC & MESSAGES
app.post('/api/sync-bot-status', (req, res) => {
    const { guildIds } = req.body;
    if (!guildIds) return res.json({ botGuilds: [] });
    res.json({ botGuilds: guildIds.filter(id => client.guilds.cache.has(id)) });
});

app.get('/api/ticket-messages/:channelId', async (req, res) => {
    try {
        const channel = client.channels.cache.get(req.params.channelId);
        if (!channel) return res.status(404).json({ error: "Salon introuvable" });
        const messages = await channel.messages.fetch({ limit: 100 });
        const fmt = messages.reverse().map(m => ({
            id: m.id, content: m.content, timestamp: m.createdAt,
            author: { username: m.author.username, avatar: m.author.displayAvatarURL({ extension: 'png' }), bot: m.author.bot },
            attachments: m.attachments.map(a => a.url),
            embeds: m.embeds, components: m.components
        }));
        res.json(fmt);
    } catch (e) { res.status(500).json({ error: "Erreur lecture" }); }
});

app.get('/api/channels/:guildId', async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) return res.status(404).json([]);
    const channels = guild.channels.cache
        .filter(c => c.type === 0)
        .map(c => ({ id: c.id, name: c.name }));
    res.json(channels);
});

app.get('/api/guild-info/:guildId', async (req, res) => {
    try {
        const guild = client.guilds.cache.get(req.params.guildId) || await client.guilds.fetch(req.params.guildId);
        if (!guild) return res.status(404).json({ error: "Serveur introuvable ou bot non présent" });

        const owner = await client.users.fetch(guild.ownerId);
        let logs = [];
        try {
            const auditLogs = await guild.fetchAuditLogs({ limit: 10 });
            logs = auditLogs.entries.map(entry => ({
                id: entry.id, action: entry.actionType, executor: entry.executor?.username || 'Inconnu',
                executorAvatar: entry.executor?.displayAvatarURL(), target: entry.target?.username || entry.target?.tag || 'Système',
                reason: entry.reason || 'Aucune raison', createdAt: entry.createdAt
            }));
        } catch (e) { console.log("Manque permission Audit Logs"); }

        res.json({
            memberCount: guild.memberCount,
            owner: { username: owner.username, avatar: owner.displayAvatarURL(), id: owner.id },
            createdAt: guild.createdAt,
            logs: logs
        });
    } catch (e) { console.error(e); res.status(500).json({ error: "Erreur récupération infos" }); }
});

app.get('/api/commands', (req, res) => {
    try {
        const commandsList = client.commands.map(cmd => {
            const options = cmd.data.options || [];
            const formatOption = (opt) => ({
                name: opt.name,
                description: opt.description,
                required: opt.required || false,
                choices: opt.choices || []
            });
            const subcommands = options
                .filter(opt => opt.type === 1 || opt.type === 2 || opt.constructor?.name === 'SlashCommandSubcommandBuilder')
                .map(sub => ({
                    name: sub.name,
                    description: sub.description,
                    options: (sub.options || []).map(formatOption)
                }));
            const args = options
                .filter(opt => opt.type !== 1 && opt.type !== 2 && opt.constructor?.name !== 'SlashCommandSubcommandBuilder')
                .map(formatOption);

            return {
                name: cmd.data.name,
                description: cmd.data.description,
                subcommands: subcommands,
                options: args
            };
        });
        res.json(commandsList);
    } catch (e) {
        console.error("Erreur récupération commandes:", e);
        res.status(500).json({ error: "Impossible de récupérer les commandes" });
    }
});

app.get('/api/bans/:guildId', async (req, res) => {
    try {
        const bans = await prisma.ban.findMany({
            where: { guildId: req.params.guildId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(bans);
    } catch (e) {
        res.status(500).json({ error: "Erreur récupération bans" });
    }
});

// Supprimer un ban (DB + Discord Unban)
app.delete('/api/bans/:id', async (req, res) => {
    try {
        // 1. Trouver le ban en DB pour avoir l'ID utilisateur
        const banRecord = await prisma.ban.findUnique({ where: { id: req.params.id } });
        if (!banRecord) return res.status(404).json({ error: "Ban introuvable" });

        // 2. Débannir sur Discord
        const guild = client.guilds.cache.get(banRecord.guildId);
        if (guild) {
            try {
                await guild.members.unban(banRecord.userId, "Débanni via le Dashboard Guardian.");
            } catch (discordErr) {
                console.log("Utilisateur déjà débanni ou introuvable sur Discord");
            }
        }

        // 3. Supprimer de la DB
        await prisma.ban.delete({ where: { id: req.params.id } });
        res.json({ success: true });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Erreur suppression ban" });
    }
});

app.get('/api/guilds/:guildId/modules', async (req, res) => {
    const { guildId } = req.params;
    try {
        const [ticket, antispam, antilink, welcome, logs] = await Promise.all([
            prisma.ticketConfig.findUnique({ where: { guildId } }),
            prisma.antiSpamConfig.findUnique({ where: { guildId } }),
            prisma.antiLinkConfig.findUnique({ where: { guildId } }),
            prisma.welcomeConfig.findUnique({ where: { guildId } }),
            prisma.logsConfig.findUnique({ where: { guildId } })
        ]);

        res.json({
            ticket: { enabled: !!ticket },
            antispam: {
                enabled: antispam?.enabled || false,
                ignoredChannelIds: antispam?.ignoredChannelIds || [],
                ignoredRoleIds: antispam?.ignoredRoleIds || [],
                messageLimit: antispam?.messageLimit || 5,
                timeWindow: antispam?.timeWindow || 5000
            },
            antilink: { enabled: antilink?.enabled || false },
            welcome: { enabled: welcome?.enabled || false, channelId: welcome?.channelId || null },
            logs: { enabled: logs?.enabled || false, channelId: logs?.channelId || null }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

app.post('/api/guilds/:guildId/modules/:moduleName', async (req, res) => {
    const { guildId, moduleName } = req.params;
    const { enabled, channelId, ignoredChannelIds, ignoredRoleIds, messageLimit, timeWindow } = req.body;

    try {
        const modulesMap = {
            'antispam': prisma.antiSpamConfig,
            'antilink': prisma.antiLinkConfig,
            'welcome': prisma.welcomeConfig,
            'logs': prisma.logsConfig
        };
        const model = modulesMap[moduleName];
        if (!model) return res.status(400).json({ error: "Module inconnu" });

        const data = {};
        if (enabled !== undefined) data.enabled = enabled;
        if (channelId !== undefined) data.channelId = channelId;
        if (ignoredChannelIds !== undefined) data.ignoredChannelIds = ignoredChannelIds;
        if (ignoredRoleIds !== undefined) data.ignoredRoleIds = ignoredRoleIds;
        if (messageLimit !== undefined) data.messageLimit = parseInt(messageLimit);
        if (timeWindow !== undefined) data.timeWindow = parseInt(timeWindow);

        await model.upsert({
            where: { guildId },
            update: data,
            create: { guildId, enabled: enabled || false, ...data }
        });

        res.json({ success: true, ...data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Impossible de modifier le module" });
    }
});

app.post('/api/bans/sync/:guildId', async (req, res) => {
    const { guildId } = req.params;
    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return res.status(404).json({ error: "Bot non présent sur ce serveur." });

        // 1. Récupérer la liste officielle depuis Discord
        const bans = await guild.bans.fetch();
        let addedCount = 0;

        // 2. Parcourir et ajouter en DB si inexistant
        for (const [id, banInfo] of bans) {
            const exists = await prisma.ban.findFirst({ where: { guildId, userId: banInfo.user.id } });
            
            if (!exists) {
                await prisma.ban.create({
                    data: {
                        guildId,
                        userId: banInfo.user.id,
                        userTag: banInfo.user.tag,
                        userAvatar: banInfo.user.displayAvatarURL(),
                        modId: client.user.id, // On met le bot par défaut car on ne peut pas deviner qui a banni il y a 3 mois
                        modTag: "Importé depuis Discord",
                        reason: banInfo.reason || "Aucune raison (Import)"
                    }
                });
                addedCount++;
            }
        }

        // 3. Renvoyer la liste mise à jour
        const updatedBans = await prisma.ban.findMany({
            where: { guildId },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, count: addedCount, bans: updatedBans });

    } catch (e) {
        console.error("Erreur Sync Bans:", e);
        res.status(500).json({ error: "Erreur lors de la synchronisation avec Discord." });
    }
});

const PORT = 3000;
app.listen(PORT, () => { console.log(`🌐 API Dashboard sur http://localhost:${PORT}`); });

(async () => {
    client.login(process.env.DISCORD_TOKEN).then(() => {
        loadEvents(client);
        loadCommands(client);
        console.log(`✅ Bot connecté.`);
    });
})();