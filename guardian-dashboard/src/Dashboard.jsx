import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Ticket, Settings, LogOut, Eye, Shield, List, Users,
    Clock, Crown, Link as LinkIcon, UserPlus,
    Hash, MessageSquare, Image as ImageIcon, ChevronDown,
    Ban, UserX, TriangleAlert, ArrowLeft, Activity, Trash2, Pencil, CheckCircle2, Loader2,
    Gavel, FileText, Book, SquareArrowOutUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TranscriptModal from './TranscriptModal';

// IMPORTS DES COMPOSANTS (Assure-toi que les chemins sont bons)
import {
    dashboardStyles, NavButton, TabPill, Toggle,
    CustomRoleSelect, CustomChannelSelect, ModCard,
    ModuleCard, ModuleEditor
} from './components/dashboard/DashboardUI';

import ModerationView from './components/dashboard/ModerationView';
import { API_URL } from './config';

function Dashboard({ user }) {
    const { guildId } = useParams();
    const navigate = useNavigate();

    // --- STATES ---
    const [activeTab, setActiveTab] = useState('overview');
    const [subTab, setSubTab] = useState('list');
    const [modView, setModView] = useState('overview');
    const [modSubTab, setModSubTab] = useState('history');

    const [tickets, setTickets] = useState([]);
    const [warns, setWarns] = useState([]);
    const [bans, setBans] = useState([]);
    const [kicks, setKicks] = useState([]);
    const [roles, setRoles] = useState([]);
    const [channels, setChannels] = useState([]);
    const [adminRole, setAdminRole] = useState("");
    const [guildStats, setGuildStats] = useState(null);

    const [modulesConfig, setModulesConfig] = useState({
        ticket: { enabled: false }, antispam: { enabled: false }, antilink: { enabled: false },
        welcome: { enabled: false, channelId: null }, logs: { enabled: false, channelId: null }
    });

    const [warnConfig, setWarnConfig] = useState({ dmUser: true, autoKickCount: 0, autoBanCount: 0, logChannelId: null });

    const [togglingModule, setTogglingModule] = useState(null);
    const [configuringModule, setConfiguringModule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [selectedUserWarns, setSelectedUserWarns] = useState(null);

    // CONFIG STATES (Tickets)
    const [editorMode, setEditorMode] = useState('panel');
    const [panelContent, setPanelContent] = useState("{here}");
    const defaultPanelText = { title: "Ouvrir un ticket", desc: "Cliquez sur le bouton ci-dessous pour contacter le staff." };
    const defaultTicketText = { title: "Support Ticket", desc: "Un membre du staff va vous répondre rapidement." };
    const [panelEmbed, setPanelEmbed] = useState(defaultEmbedState(defaultPanelText.title, defaultPanelText.desc));
    const [panelBtn, setPanelBtn] = useState({ label: 'Ouvrir un ticket', style: 'Primary' });
    const [ticketEmbed, setTicketEmbed] = useState(defaultEmbedState(defaultTicketText.title, defaultTicketText.desc));
    const [ticketButtons, setTicketButtons] = useState({ claim: false, transcript: false, addUser: false, removeUser: false });

    // ETATS DE SAUVEGARDE
    const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error

    // Permet de savoir si c'est le premier chargement pour éviter de sauvegarder à l'initialisation
    const isFirstRender = useRef(true);

    const currentGuild = user.guilds.find(g => g.id === guildId);
    const otherGuilds = user.guilds.filter(g => g.id !== guildId);

    const btnColors = { 'Primary': 'bg-[#5865F2] hover:bg-[#4752C4]', 'Secondary': 'bg-[#4e5058] hover:bg-[#3c3e44]', 'Success': 'bg-[#248046] hover:bg-[#1a6334]', 'Danger': 'bg-[#DA373C] hover:bg-[#a1282c]' };
    const ensureHexColor = (color) => typeof color === 'number' ? '#' + color.toString(16).padStart(6, '0') : color || '#5865F2';

    const safeFetch = (url) => fetch(url).then(r => r.ok ? r.json() : null).catch(() => null);

    // --- 1. CHARGEMENT INITIAL ---
    useEffect(() => {
        setLoading(true);
        Promise.all([
            safeFetch(`${API_URL}/api/tickets/${guildId}`), safeFetch(`${API_URL}/api/settings/${guildId}`),
            safeFetch(`${API_URL}/api/roles/${guildId}`), safeFetch(`${API_URL}/api/channels/${guildId}`),
            safeFetch(`${API_URL}/api/warns/${guildId}`), safeFetch(`${API_URL}/api/bans/${guildId}`),
            safeFetch(`${API_URL}/api/guild-info/${guildId}`),
            safeFetch(`${API_URL}/api/guilds/${guildId}/modules`), safeFetch(`${API_URL}/api/warn-config/${guildId}`)
        ]).then(([tData, cData, rData, chData, wData, bData, gData, mData, warnConf]) => {
            setTickets(tData || []); setRoles(rData || []); setChannels(chData || []); setWarns(wData || []); setBans(bData || []); setGuildStats(gData); setModulesConfig(prev => ({ ...prev, ...mData }));
            if (warnConf) setWarnConfig(warnConf);

            let processedConfig = { content: "{here}", embedPayload: defaultEmbedState(defaultPanelText.title, defaultPanelText.desc), buttonLabel: 'Ouvrir un ticket', buttonStyle: 'Primary', ticketEmbedPayload: defaultEmbedState(defaultTicketText.title, defaultTicketText.desc), ticketButtons: { claim: false, transcript: false, addUser: false, removeUser: false }, adminRole: "" };
            if (cData) {
                processedConfig.content = cData.content || "{here}"; processedConfig.adminRole = cData.adminRole || "";
                const rawPanel = cData.embedPayload || {};
                processedConfig.embedPayload = { ...defaultEmbedState(defaultPanelText.title, defaultPanelText.desc), ...rawPanel, title: rawPanel.title || defaultPanelText.title, description: rawPanel.description || defaultPanelText.desc, color: ensureHexColor(rawPanel.color) };
                processedConfig.buttonLabel = cData.buttonLabel || 'Ouvrir un ticket'; processedConfig.buttonStyle = cData.buttonStyle || 'Primary';
                const rawTicket = cData.ticketEmbedPayload || {};
                processedConfig.ticketEmbedPayload = { ...defaultEmbedState(defaultTicketText.title, defaultTicketText.desc), ...rawTicket, title: rawTicket.title || defaultTicketText.title, description: rawTicket.description || defaultTicketText.desc, color: ensureHexColor(rawTicket.color) };
                if (rawTicket.buttons) processedConfig.ticketButtons = { claim: rawTicket.buttons.claim ?? false, transcript: rawTicket.buttons.transcript ?? false, addUser: rawTicket.buttons.addUser ?? false, removeUser: rawTicket.buttons.removeUser ?? false };
            }
            setPanelContent(processedConfig.content); setAdminRole(processedConfig.adminRole); setPanelEmbed(processedConfig.embedPayload); setPanelBtn({ label: processedConfig.buttonLabel, style: processedConfig.buttonStyle }); setTicketEmbed(processedConfig.ticketEmbedPayload); setTicketButtons(processedConfig.ticketButtons);

            setLoading(false);
            // On laisse une petite pause pour ne pas déclencher l'auto-save tout de suite
            setTimeout(() => { isFirstRender.current = false; }, 1000);
        });
    }, [guildId]);


    // --- 2. AUTO-SAVE LOGIC (Debounce) ---

    // Fonction générique pour l'effet visuel de sauvegarde
    const handleAutoSave = async (saveFunction) => {
        setSaveStatus('saving');
        try {
            await saveFunction();
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (e) {
            console.error(e);
            setSaveStatus('error');
        }
    };

    // A. Sauvegarde Warn Config
    useEffect(() => {
        if (isFirstRender.current || loading) return;

        const timer = setTimeout(() => {
            handleAutoSave(async () => {
                await fetch(`${API_URL}/api/warn-config/${guildId}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(warnConfig)
                });
            });
        }, 1000); // Délai d'1 seconde après la dernière frappe

        return () => clearTimeout(timer);
    }, [warnConfig, guildId]);

    // B. Sauvegarde Global Settings (Tickets, Panels...)
    useEffect(() => {
        if (isFirstRender.current || loading) return;

        const timer = setTimeout(() => {
            handleAutoSave(async () => {
                const finalBody = {
                    embedPayload: panelEmbed, buttonLabel: panelBtn.label, buttonStyle: panelBtn.style,
                    content: panelContent, adminRole: adminRole,
                    ticketEmbedPayload: { ...ticketEmbed, buttons: ticketButtons },
                    showClaimBtn: ticketButtons.claim, showTranscriptBtn: ticketButtons.transcript
                };
                await fetch(`${API_URL}/api/settings/${guildId}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(finalBody)
                });
            });
        }, 1000);

        return () => clearTimeout(timer);
    }, [panelEmbed, panelBtn, panelContent, adminRole, ticketEmbed, ticketButtons, guildId]);


    // --- HANDLERS MODULES (Direct Save) ---
    const handleToggleModule = async (moduleName) => {
        if (moduleName === 'ticket') return;
        setTogglingModule(moduleName);
        const newState = !modulesConfig[moduleName].enabled;
        try {
            await fetch(`${API_URL}/api/guilds/${guildId}/modules/${moduleName}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: newState }) });
            setModulesConfig(prev => ({ ...prev, [moduleName]: { ...prev[moduleName], enabled: newState } }));
        } catch (error) { console.error(error); } finally { setTogglingModule(null); }
    };

    // Nouvelle fonction pour l'éditeur de module (Auto-save instantané ou debounce interne au composant)
    const handleUpdateModuleConfig = async (moduleName, data) => {
        // Mise à jour locale immédiate
        setModulesConfig(prev => ({ ...prev, [moduleName]: { ...prev[moduleName], ...data } }));

        // Sauvegarde silencieuse
        try {
            await fetch(`${API_URL}/api/guilds/${guildId}/modules/${moduleName}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (error) { console.error("Erreur save module", error); }
    };

    const handleWarnConfigChange = (key, value) => {
        const newValue = parseInt(value) || 0;
        const newConfig = { ...warnConfig, [key]: newValue };

        // RÈGLE : Ban > Kick (si les deux sont actifs)
        if (newConfig.autoBanCount > 0 && newConfig.autoKickCount > 0) {

            // Cas 1 : On modifie le Kick, et il devient >= au Ban
            if (key === 'autoKickCount' && newValue >= newConfig.autoBanCount) {
                alert("L'auto-kick doit être inférieur à l'auto-ban !");
                return; // On annule le changement
            }

            // Cas 2 : On modifie le Ban, et il devient <= au Kick
            if (key === 'autoBanCount' && newValue <= newConfig.autoKickCount) {
                alert("L'auto-ban doit être supérieur à l'auto-kick !");
                return; // On annule le changement
            }
        }

        // Si tout est bon, on met à jour
        setWarnConfig(newConfig);
    };

    const handleDeleteWarn = async (id) => { if (!window.confirm('Supprimer cet avertissement ?')) return; await fetch(`${API_URL}/api/warns/${id}`, { method: 'DELETE' }); setWarns(warns.filter(w => w.id !== id)); };
    const handleDeleteBan = async (id) => { if (!window.confirm('Révoquer ce bannissement ?')) return; await fetch(`${API_URL}/api/bans/${id}`, { method: 'DELETE' }); setBans(bans.filter(b => b.id !== id)); };
    const handleDeleteTicket = async (id) => { if (!window.confirm('Supprimer ce ticket ?')) return; await fetch(`${API_URL}/api/tickets/${id}`, { method: 'DELETE' }); setTickets(tickets.filter(t => t.channelId !== id)); };
    const handleSyncBans = async () => {
        const btn = document.getElementById('sync-btn-icon');
        if (btn) btn.classList.add('animate-spin'); // Petit effet visuel manuel

        try {
            const res = await fetch(`${API_URL}/api/bans/sync/${guildId}`, { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                setBans(data.bans);
                alert(`Synchronisation réussie ! ${data.count} bannissements importés.`);
            } else {
                alert("Erreur : " + data.error);
            }
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la connexion au serveur.");
        } finally {
            if (btn) btn.classList.remove('animate-spin');
        }
    };

    if (loading) return (<div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-4"><div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div><div className="text-xs font-mono tracking-widest uppercase animate-pulse">Chargement...</div></div>);

    return (
        <>
            <style>{dashboardStyles}</style>
            <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20 overflow-hidden relative flex">
                <aside className="w-[280px] h-screen bg-[#050505] border-r border-[#1f1f1f] flex flex-col fixed z-20">
                    <div className="p-6 border-b border-[#1f1f1f]">
                        <div className="flex items-center gap-3 mb-6 cursor-pointer" onClick={() => navigate('/')}><div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-bold"><Shield size={16} fill="currentColor" /></div><div className="font-bold text-lg tracking-tight">Guardian.</div></div>
                        <div className="relative">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-full flex items-center gap-3 p-2 rounded-lg bg-[#111] hover:bg-[#1a1a1a] transition-all border border-[#1f1f1f] group">{currentGuild?.icon ? <img src={`https://cdn.discordapp.com/icons/${currentGuild.id}/${currentGuild.icon}.png`} className="w-8 h-8 rounded-md object-cover" /> : <div className="w-8 h-8 bg-[#222] rounded-md flex items-center justify-center font-bold text-white">{currentGuild?.name.charAt(0)}</div>}<div className="flex-1 min-w-0 text-left"><div className="text-[10px] text-neutral-500 font-bold uppercase">Serveur</div><div className="text-sm font-bold text-white truncate">{currentGuild?.name}</div></div><ChevronDown size={14} className={`text-neutral-500 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} /></button>
                            <AnimatePresence>{isMenuOpen && (<motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-1 z-50 shadow-xl">{otherGuilds.map(g => (<div key={g.id} onClick={() => { if (g.botInGuild) { setLoading(true); window.location.href = `/dashboard/${g.id}`; } }} className={`flex items-center gap-3 p-2 rounded cursor-pointer ${g.botInGuild ? 'hover:bg-[#1f1f1f]' : 'opacity-30 grayscale'}`}>{g.icon ? <img src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`} className="w-6 h-6 rounded" /> : <div className="w-6 h-6 bg-[#222] rounded"></div>}<span className="text-xs font-medium truncate text-white">{g.name}</span></div>))}</motion.div>)}</AnimatePresence>
                        </div>
                    </div>
                    <div className="p-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">

                        {/* SECTION GESTION */}
                        <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest pl-3 mb-3 mt-2">Gestion</div>

                        <NavButton icon={<Activity size={18} />} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                        <NavButton icon={<Settings size={18} />} label="Configuration" active={activeTab === 'setup'} onClick={() => { setActiveTab('setup'); setConfiguringModule(null); }} />
                        <NavButton icon={<Ticket size={18} />} label="Tickets" active={activeTab === 'tickets'} onClick={() => setActiveTab('tickets')} />
                        <NavButton icon={<Gavel size={18} />} label="Modération" active={activeTab === 'moderation'} onClick={() => { setActiveTab('moderation'); setModView('overview'); setSelectedUserWarns(null); }} />

                        {/* NOUVELLE SECTION : AIDE */}
                        <div className="mt-8">
                            <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest pl-3 mb-3">Aide</div>
                            <NavButton
                                icon={<Book size={18} />}
                                label={
                                    <div className="flex items-center gap-2">
                                        Documentation
                                        <SquareArrowOutUpRight size={12} className="opacity-50" />
                                    </div>
                                }
                                active={false}
                                onClick={() => window.open('/documentation', '_blank')} // Ouvre dans un nouvel onglet pour ne pas perdre le dashboard
                            />
                        </div>

                    </div>
                    <div className="p-4 border-t border-[#1f1f1f]"><div className="flex items-center gap-3"><img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} className="w-8 h-8 rounded-full border border-[#333]" alt="User" /><div className="flex-1 min-w-0"><div className="text-sm font-bold text-white truncate">{user.username}</div></div><button onClick={() => { localStorage.removeItem('discord_user'); window.location.href = '/'; }} className="text-neutral-500 hover:text-white transition-colors"><LogOut size={16} /></button></div></div>
                </aside>

                <main className="flex-1 ml-[280px] p-10 h-screen overflow-y-auto bg-black relative z-10">
                    <header className="flex flex-col gap-2 mb-10">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4 items-center">
                                {activeTab === 'setup' && configuringModule && (<button onClick={() => setConfiguringModule(null)} className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest group"><ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Retour</button>)}
                                {activeTab === 'moderation' && modView !== 'overview' && (<button onClick={() => setModView('overview')} className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest group"><ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Retour</button>)}
                            </div>

                            {/* INDICATEUR DE SAUVEGARDE AUTO */}
                            <div className="h-6 flex items-center justify-end">
                                <AnimatePresence>
                                    {saveStatus === 'saving' && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-xs font-bold text-neutral-500"><Loader2 size={12} className="animate-spin" /> Sauvegarde...</motion.div>}
                                    {saveStatus === 'saved' && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-xs font-bold text-emerald-500"><CheckCircle2 size={12} /> Enregistré</motion.div>}
                                    {saveStatus === 'error' && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-xs font-bold text-red-500"><TriangleAlert size={12} /> Erreur</motion.div>}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="flex justify-between items-end mt-2">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                                    {activeTab === 'overview' && <>Vue d'ensemble</>}
                                    {activeTab === 'setup' && (configuringModule ? `Configuration : ${configuringModule.charAt(0).toUpperCase() + configuringModule.slice(1)}` : 'Configuration Modules')}
                                    {activeTab === 'tickets' && <>Système de Tickets</>}
                                    {activeTab === 'moderation' && (modView === 'overview' ? 'Centre de Modération' : (modView === 'warns' ? 'Gestion des Avertissements' : modView === 'bans' ? 'Gestion des Bannissements' : 'Gestion des Expulsions'))}
                                </h2>
                                <p className="text-neutral-500 text-sm">
                                    {activeTab === 'overview' && 'Statistiques et activités récentes du serveur.'}
                                    {activeTab === 'setup' && !configuringModule && 'Activez ou désactivez les fonctionnalités du bot.'}
                                    {activeTab === 'setup' && configuringModule && 'Ajustez les paramètres spécifiques de ce module.'}
                                    {activeTab === 'tickets' && 'Configurez vos panels et gérez le support.'}
                                    {activeTab === 'moderation' && (modView === 'overview' ? 'Vue d\'ensemble des sanctions.' : 'Consultez l\'historique et configurez la commande.')}
                                </p>
                            </div>
                            {activeTab === 'tickets' && (<div className="bg-[#0a0a0a] border border-[#1f1f1f] p-1 rounded-lg flex gap-1"><TabPill label="Vue d'ensemble" active={subTab === 'list'} onClick={() => setSubTab('list')} /><TabPill label="Configuration" active={subTab === 'settings'} onClick={() => setSubTab('settings')} /></div>)}
                            {activeTab === 'moderation' && modView !== 'overview' && !selectedUserWarns && (<div className="bg-[#0a0a0a] border border-[#1f1f1f] p-1 rounded-lg flex gap-1"><TabPill label="Historique" active={modSubTab === 'history'} onClick={() => setModSubTab('history')} /><TabPill label="Configuration" active={modSubTab === 'config'} onClick={() => setModSubTab('config')} /></div>)}
                        </div>
                    </header>

                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                                {!guildStats ? (<div className="p-10 text-center text-neutral-500 border border-dashed border-[#1f1f1f] rounded-xl">Impossible de charger les statistiques (API).</div>) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-6 relative overflow-hidden group"><div className="relative z-10"><div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Users size={12} /> Membres</div><div className="text-4xl font-bold text-white">{guildStats.memberCount}</div></div><Users className="absolute right-4 bottom-4 text-[#111] group-hover:text-[#1a1a1a] transition-colors" size={64} /></div>
                                            <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-6 relative overflow-hidden group"><div className="relative z-10"><div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Crown size={12} /> Propriétaire</div><div className="flex items-center gap-3">{guildStats.owner.avatar ? <img src={guildStats.owner.avatar} className="w-10 h-10 rounded-full border border-[#222]" /> : <div className="w-10 h-10 bg-[#222] rounded-full"></div>}<div><div className="text-lg font-bold text-white">{guildStats.owner.username}</div><div className="text-[10px] text-neutral-600 font-mono">ID: {guildStats.owner.id}</div></div></div></div></div>
                                            <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-6 relative overflow-hidden group"><div className="relative z-10"><div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Clock size={12} /> Création</div><div className="text-xl font-bold text-white">{new Date(guildStats.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div><div className="text-[10px] text-neutral-600 mt-1">Il y a {Math.floor((new Date() - new Date(guildStats.createdAt)) / (1000 * 60 * 60 * 24))} jours</div></div><Clock className="absolute right-4 bottom-4 text-[#111] group-hover:text-[#1a1a1a] transition-colors" size={64} /></div>
                                        </div>
                                        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl overflow-hidden"><div className="px-6 py-4 border-b border-[#1f1f1f] flex items-center gap-2"><List size={16} className="text-white" /><h3 className="text-sm font-bold text-white">Derniers Logs (Audit)</h3></div><div className="divide-y divide-[#1f1f1f]">{guildStats.logs && guildStats.logs.length === 0 ? (<div className="p-8 text-center text-neutral-500 text-sm">Aucun log récent ou permission manquante.</div>) : (guildStats.logs?.map((log) => (<div key={log.id} className="p-4 flex items-center justify-between hover:bg-[#111] transition-colors"><div className="flex items-center gap-4"><div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-xs font-bold text-neutral-400">{log.executor.charAt(0)}</div><div><div className="text-sm text-white"><span className="font-bold">{log.executor}</span> a effectué <span className="font-bold text-neutral-400">{log.action}</span> sur <span className="font-bold text-white">{log.target}</span></div><div className="text-[10px] text-neutral-600 font-mono mt-0.5">{new Date(log.createdAt).toLocaleString('fr-FR')} • {log.reason || 'Aucune raison'}</div></div></div></div>)))}</div></div>
                                    </>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'setup' && (
                            <AnimatePresence mode="wait">
                                {!configuringModule ? (
                                    <motion.div key="setup-grid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <ModuleCard
                                            title="Anti-Spam"
                                            desc="Protection automatique contre le flood et les répétitions."
                                            icon={<Shield size={24} />}
                                            active={modulesConfig.antispam.enabled}
                                            loading={togglingModule === 'antispam'}
                                            onToggle={() => handleToggleModule('antispam')}
                                            onConfigure={() => setConfiguringModule('antispam')}
                                            color="emerald"
                                        />
                                        <ModuleCard
                                            title="Anti-Link"
                                            desc="Bloque les liens (Discord, HTTP) des membres non-admins."
                                            icon={<LinkIcon size={24} />} active={modulesConfig.antilink.enabled}
                                            loading={togglingModule === 'antilink'}
                                            onToggle={() => handleToggleModule('antilink')}
                                            color="blue"
                                        />
                                        <ModuleCard
                                            title="Bienvenue"
                                            desc="Message et image personnalisés à l'arrivée d'un membre."
                                            icon={<UserPlus size={24} />}
                                            active={modulesConfig.welcome.enabled}
                                            loading={togglingModule === 'welcome'}
                                            onToggle={() => handleToggleModule('welcome')}
                                            onConfigure={() => setConfiguringModule('welcome')}
                                            color="purple"
                                        />
                                        <ModuleCard
                                            title="Logs Serveur"
                                            desc="Trace écrite des actions (suppression, modification...)."
                                            icon={<FileText size={24} />} active={modulesConfig.logs.enabled}
                                            loading={togglingModule === 'logs'} onToggle={() => handleToggleModule('logs')}
                                            onConfigure={() => setConfiguringModule('logs')}
                                            color="orange"
                                        />
                                        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-6 opacity-80 relative overflow-hidden"><div className="flex justify-between items-start mb-4"><div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500"><MessageSquare size={24} /></div><div className="px-2 py-1 bg-neutral-900 rounded text-[10px] uppercase font-bold text-neutral-500 border border-neutral-800">Permanent</div></div><h3 className="font-bold text-xl mb-2 text-white">Système Tickets</h3><p className="text-sm text-neutral-400 mb-4 leading-relaxed">Ce module est activé en permanence. Gérez les panels dans l'onglet dédié.</p><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-500"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> Module Actif</div></div>
                                    </motion.div>
                                ) : (
                                    <ModuleEditor
                                        key="setup-editor"
                                        module={configuringModule}
                                        config={modulesConfig[configuringModule]}
                                        channels={channels}
                                        roles={roles}
                                        onSave={handleUpdateModuleConfig} // Modifié pour l'auto-save
                                    />
                                )}
                            </AnimatePresence>
                        )}

                        {activeTab === 'tickets' && subTab === 'list' && (
                            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                <div className="border border-[#1f1f1f] rounded-xl overflow-hidden bg-[#0a0a0a]"><table className="w-full text-left"><thead className="text-[10px] uppercase text-neutral-500 font-bold bg-[#111] border-b border-[#1f1f1f]"><tr><th className="p-4 pl-6">ID User</th><th className="p-4">Sujet</th><th className="p-4">Statut</th><th className="p-4 text-right pr-6">Action</th></tr></thead><tbody className="text-sm">{tickets.length === 0 ? <tr><td colSpan="4" className="p-12 text-center text-neutral-500">Aucun ticket ouvert.</td></tr> : tickets.map(t => (<tr key={t.id} className="border-b border-[#1f1f1f] last:border-0 hover:bg-[#111] transition-colors"><td className="p-4 pl-6 font-mono text-neutral-400">{t.userId}</td><td className="p-4 text-white font-medium truncate max-w-xs">{t.transcript}</td><td className="p-4"><span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${t.status === 'OPEN' ? 'bg-emerald-900/20 text-emerald-500 border-emerald-900/50' : 'bg-red-900/20 text-red-500 border-red-900/50'}`}>{t.status}</span></td><td className="p-4 text-right pr-6 flex justify-end gap-2"><button onClick={() => setSelectedTicketId(t.channelId)} className="p-1.5 rounded hover:bg-[#222] text-neutral-400 hover:text-white transition-colors"><Eye size={16} /></button><button onClick={() => handleDeleteTicket(t.channelId)} className="p-1.5 rounded hover:bg-[#222] text-neutral-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button></td></tr>))}</tbody></table></div>
                            </motion.div>
                        )}

                        {activeTab === 'tickets' && subTab === 'settings' && (
                            <motion.div key="settings" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.99 }} className="flex gap-8 items-start">
                                <div className="flex-1 space-y-6">
                                    <div className="flex gap-4 border-b border-[#1f1f1f] pb-4">
                                        <button onClick={() => setEditorMode('panel')} className={`text-sm font-bold pb-4 -mb-4 transition-all ${editorMode === 'panel' ? 'text-white border-b-2 border-white' : 'text-neutral-500 hover:text-white'}`}>Message du Panel</button>
                                        <button onClick={() => setEditorMode('ticket')} className={`text-sm font-bold pb-4 -mb-4 transition-all ${editorMode === 'ticket' ? 'text-white border-b-2 border-white' : 'text-neutral-500 hover:text-white'}`}>Message de Bienvenue</button>
                                    </div>

                                    <div className="bg-[#0a0a0a] rounded-xl shadow-2xl overflow-hidden border border-[#1f1f1f] relative">
                                        <div className="absolute inset-0 bg-grid-preview opacity-30 pointer-events-none"></div>

                                        <div className="h-10 bg-[#111] flex items-center px-4 gap-3 border-b border-[#1f1f1f] relative z-10">
                                            <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#333]"></div><div className="w-2.5 h-2.5 rounded-full bg-[#333]"></div><div className="w-2.5 h-2.5 rounded-full bg-[#333]"></div></div>
                                            <div className="flex items-center gap-2 text-neutral-500 text-xs font-mono ml-2"><Hash size={12} /> <span>support-tickets</span></div>
                                        </div>

                                        <div className="p-8 relative z-10">
                                            <div className="flex gap-5">
                                                <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm shadow-lg border border-[#333]"><Shield size={16} fill="currentColor" /></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-baseline gap-2 mb-2"><span className="text-white font-bold text-sm">Guardian. System</span><span className="bg-white text-black text-[9px] px-1.5 py-0.5 rounded font-bold">BOT</span><span className="text-[10px] text-neutral-600">Aujourd'hui à 12:00</span></div>

                                                    <div className="relative mb-4 group/edit">
                                                        <textarea value={panelContent} onChange={(e) => setPanelContent(e.target.value)} className="w-full bg-transparent text-neutral-300 text-sm resize-none outline-none border-l-2 border-transparent focus:border-white pl-3 transition-all min-h-[24px] leading-relaxed placeholder-neutral-700" placeholder="Message hors embed..." />
                                                        <Pencil size={12} className="absolute right-0 top-0 text-neutral-600 opacity-0 group-hover/edit:opacity-100 pointer-events-none" />
                                                    </div>

                                                    <div className="bg-[#111] border border-[#1f1f1f] rounded-lg p-5 grid gap-3 max-w-lg shadow-sm relative overflow-hidden">
                                                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: (editorMode === 'panel' ? panelEmbed : ticketEmbed).color }}></div>
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="space-y-2 w-full">
                                                                <input value={(editorMode === 'panel' ? panelEmbed : ticketEmbed).author?.name || ''} onChange={(e) => (editorMode === 'panel' ? setPanelEmbed : setTicketEmbed)(prev => ({ ...prev, author: { ...prev.author, name: e.target.value } }))} className="bg-transparent font-bold text-neutral-500 text-xs outline-none w-full" placeholder="Auteur" />
                                                                <input value={(editorMode === 'panel' ? panelEmbed : ticketEmbed).title} onChange={(e) => (editorMode === 'panel' ? setPanelEmbed : setTicketEmbed)(prev => ({ ...prev, title: e.target.value }))} className="bg-transparent font-bold text-white text-base outline-none w-full mb-1" placeholder="Titre" />
                                                                <textarea value={(editorMode === 'panel' ? panelEmbed : ticketEmbed).description} onChange={(e) => (editorMode === 'panel' ? setPanelEmbed : setTicketEmbed)(prev => ({ ...prev, description: e.target.value }))} className="bg-transparent text-xs text-neutral-400 outline-none resize-none h-20 w-full" placeholder="Description..." />
                                                            </div>
                                                            <div className="w-16 h-16 bg-[#050505] rounded border border-[#222] flex items-center justify-center relative overflow-hidden group/thumb shrink-0">
                                                                {(editorMode === 'panel' ? panelEmbed : ticketEmbed).thumbnail?.url ? <img src={(editorMode === 'panel' ? panelEmbed : ticketEmbed).thumbnail.url} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-neutral-700" />}
                                                                <input type="text" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => (editorMode === 'panel' ? setPanelEmbed : setTicketEmbed)(prev => ({ ...prev, thumbnail: { url: e.target.value } }))} />
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end pt-2"><input type="color" value={(editorMode === 'panel' ? panelEmbed : ticketEmbed).color} onChange={(e) => (editorMode === 'panel' ? setPanelEmbed : setTicketEmbed)(prev => ({ ...prev, color: e.target.value }))} className="w-4 h-4 rounded-full cursor-pointer bg-transparent border-none p-0 overflow-hidden" /></div>
                                                    </div>

                                                    <div className="mt-4 flex flex-col gap-2">
                                                        <div className="flex gap-2">
                                                            {editorMode === 'panel' ? (
                                                                <button className={`text-white px-5 py-2 rounded-md text-xs font-bold transition-colors shadow-sm ${btnColors[panelBtn.style]}`}>{panelBtn.label}</button>
                                                            ) : (
                                                                <>
                                                                    <button className="bg-[#DA373C] text-white px-4 py-1.5 rounded-md text-xs font-bold opacity-70 cursor-not-allowed">Fermer</button>
                                                                    {ticketButtons.claim && <button className="bg-[#248046] text-white px-4 py-1.5 rounded-md text-xs font-bold opacity-70">Claim</button>}
                                                                    {ticketButtons.transcript && <button className="bg-[#4e5058] text-white px-4 py-1.5 rounded-md text-xs font-bold opacity-70">Transcript</button>}
                                                                </>
                                                            )}
                                                        </div>
                                                        {editorMode === 'ticket' && (ticketButtons.addUser || ticketButtons.removeUser) && (
                                                            <div className="flex gap-2">
                                                                {ticketButtons.addUser && <button className="bg-[#5865F2] text-white px-4 py-1.5 rounded-md text-xs font-bold opacity-70">Ajouter</button>}
                                                                {ticketButtons.removeUser && <button className="bg-[#5865F2] text-white px-4 py-1.5 rounded-md text-xs font-bold opacity-70">Retirer</button>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                                <div className="w-80 bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-6 space-y-6 sticky top-6">
                                    <div className="flex items-center gap-2 text-white mb-2 border-b border-[#1f1f1f] pb-3"><Settings size={16} /> <h3 className="font-bold text-xs uppercase tracking-widest">Configuration</h3></div>
                                    {editorMode === 'panel' ? (
                                        <div className="space-y-4"><div><label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Bouton</label><input value={panelBtn.label} onChange={(e) => setPanelBtn({ ...panelBtn, label: e.target.value })} className="clean-input w-full p-2 rounded text-sm" /></div><div><label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Style (Couleurs Discord)</label><div className="flex gap-2">{['Primary', 'Secondary', 'Success', 'Danger'].map(s => (<div key={s} onClick={() => { setPanelBtn({ ...panelBtn, style: s }); }} className={`h-8 flex-1 rounded cursor-pointer border relative group ${panelBtn.style === s ? 'border-white' : 'border-[#1f1f1f] opacity-50'}`} style={{ backgroundColor: s === 'Primary' ? '#5865F2' : s === 'Secondary' ? '#4e5058' : s === 'Success' ? '#248046' : s === 'Danger' ? '#DA373C' : '#333' }}><span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-[10px] font-bold text-white bg-black border border-[#333] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">{s}</span></div>))}</div></div></div>
                                    ) : (
                                        <div className="space-y-4"><div className="grid grid-cols-2 gap-2"><Toggle label="Btn Claim" checked={ticketButtons.claim} onChange={() => { setTicketButtons({ ...ticketButtons, claim: !ticketButtons.claim }); }} /><Toggle label="Transcript" checked={ticketButtons.transcript} onChange={() => { setTicketButtons({ ...ticketButtons, transcript: !ticketButtons.transcript }); }} /><Toggle label="Ajouter" checked={ticketButtons.addUser} onChange={() => { setTicketButtons({ ...ticketButtons, addUser: !ticketButtons.addUser }); }} /><Toggle label="Retirer" checked={ticketButtons.removeUser} onChange={() => { setTicketButtons({ ...ticketButtons, removeUser: !ticketButtons.removeUser }); }} /></div><div className="pt-4 border-t border-[#1f1f1f]"><label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block flex items-center gap-2"><Users size={12} /> Rôle Admin</label><CustomRoleSelect roles={roles} selectedId={adminRole} onChange={(id) => { setAdminRole(id); }} /></div></div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'moderation' && modView === 'overview' && (
                            <motion.div key="mod-overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <ModCard title="Avertissements" count={warns.length} icon={<TriangleAlert className="text-white" size={32} />} onClick={() => { setActiveTab('moderation'); setModView('warns'); setModSubTab('history'); setSelectedUserWarns(null); }} />
                                <ModCard title="Bannissements" count={bans.length} icon={<Ban className="text-white" size={32} />} onClick={() => { setActiveTab('moderation'); setModView('bans'); setModSubTab('history'); setSelectedUserWarns(null); }} />
                                <ModCard title="Expulsions" count={kicks.length} icon={<UserX className="text-white" size={32} />} onClick={() => { setActiveTab('moderation'); setModView('kicks'); setModSubTab('history'); }} />
                            </motion.div>
                        )}

                        {activeTab === 'moderation' && modView !== 'overview' && (
                            <ModerationView
                                modView={modView} setModView={setModView} modSubTab={modSubTab}
                                warns={warns} bans={bans} kicks={kicks}
                                selectedUserWarns={selectedUserWarns} setSelectedUserWarns={setSelectedUserWarns}

                                warnConfig={warnConfig}
                                // 👇 On remplace setWarnConfig par notre fonction sécurisée ici (ou on ajoute une prop 'onConfigChange')
                                setWarnConfig={setWarnConfig}
                                onConfigChange={handleWarnConfigChange} // <--- AJOUTE CECI

                                handleDeleteWarn={handleDeleteWarn} handleDeleteBan={handleDeleteBan}
                                channels={channels}
                                handleSyncBans={handleSyncBans}
                                guildName={currentGuild?.name}
                            />
                        )}
                    </AnimatePresence>
                </main>

                {selectedTicketId && <TranscriptModal channelId={selectedTicketId} onClose={() => setSelectedTicketId(null)} />}
            </div>
        </>
    );
}

function defaultEmbedState(title = "Titre", desc = "Description") { return { title, description: desc, color: '#5865F2', timestamp: false, author: {}, footer: {}, thumbnail: {}, image: {}, fields: [] }; }

export default Dashboard;