import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, ArrowRight, LayoutDashboard, Ticket, Menu, X, Lock, Zap, Command, ChevronRight, ArrowLeft, Sparkles, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './Dashboard';
import Documentation from './Documentation'; // Import de la page de documentation
import { API_URL } from './config';

// --- STYLES ---
const styles = `
  :root {
    --bg-color: #000000;
    --border: #1f1f1f;
  }
  
  html { scroll-behavior: smooth; }

  body {
    background-color: var(--bg-color);
    color: #ffffff;
    font-family: 'Inter', sans-serif;
    overflow-x: hidden;
  }

  .bg-grid {
    background-size: 40px 40px;
    background-image: linear-gradient(to right, #1a1a1a 1px, transparent 1px),
                      linear-gradient(to bottom, #1a1a1a 1px, transparent 1px);
    mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
  }
`;

const LATEST_UPDATE = {
    version: "v1.0.0",
    date: "10 Février 2026",
    title: "Patch note : Modération 2.0 & Auto-Save",
    description: "Synchronisation des bannissements Discord, configuration avancée de l'Anti-Spam et sauvegarde automatique sur tout le dashboard.",
    tag: "MAJEUR"
};

function PatchNoteBanner() {
    return (
        <div className="max-w-4xl mx-auto px-6 -mt-8 mb-20 relative z-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-2xl p-1 flex items-stretch overflow-hidden group hover:border-[#333] transition-colors"
            >
                <div className="bg-[#111] p-4 flex flex-col justify-center items-center border-r border-[#1f1f1f] min-w-[100px]">
                    <div className="bg-emerald-500/10 text-emerald-500 p-2 rounded-lg mb-2">
                        <Sparkles size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{LATEST_UPDATE.tag}</span>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-center relative">
                    <div className="absolute top-0 right-0 p-20 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-bold border border-white/5 shadow-sm">
                            {LATEST_UPDATE.version}
                        </span>
                        <span className="text-neutral-600 text-xs font-mono">
                            {LATEST_UPDATE.date}
                        </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                        {LATEST_UPDATE.title}
                    </h3>
                    <p className="text-sm text-neutral-400 leading-relaxed max-w-2xl">
                        {LATEST_UPDATE.description}
                    </p>
                </div>

                <div className="hidden md:flex items-center pr-8 pl-4">
                    <div className="w-10 h-10 rounded-full border border-[#222] flex items-center justify-center text-neutral-500 group-hover:bg-white group-hover:text-black group-hover:border-white transition-all duration-300">
                        <ArrowRight size={18} />
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// --- NAVBAR CAPSULE FIXE ---
function Navbar({ onLogin }) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="fixed top-0 left-0 w-full z-50 flex justify-center pointer-events-none transition-all duration-300">
            <motion.nav
                initial={false}
                animate={isScrolled ? "scrolled" : "top"}
                variants={{
                    top: {
                        y: 0,
                        borderRadius: "0px",
                        backgroundColor: "rgba(0,0,0,0)",
                        border: "1px solid transparent",
                        backdropFilter: "blur(0px)",
                        width: "auto"
                    },
                    scrolled: {
                        y: 20,
                        borderRadius: "100px",
                        backgroundColor: "rgba(10, 10, 10, 0.8)",
                        border: "1px solid #333",
                        backdropFilter: "blur(12px)",
                        width: "auto"
                    }
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="pointer-events-auto flex items-center justify-between px-6 py-3"
            >
                <div className="w-full md:w-[600px] flex items-center justify-between">
                    <div
                        className="flex items-center gap-3 font-bold text-lg tracking-tight text-white cursor-pointer"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center">
                            <Shield size={16} fill="currentColor" />
                        </div>
                        <span>Guardian.</span>
                    </div>

                    {/* Menu Desktop */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/documentation" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors px-2">
                            Documentation
                        </Link>

                        <button
                            onClick={onLogin}
                            className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-neutral-200 transition-colors"
                        >
                            Commencer
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Mobile Dropdown */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-0 right-0 mt-4 mx-auto w-[90vw] bg-[#0a0a0a] border border-[#333] rounded-2xl p-4 flex flex-col gap-3 shadow-2xl md:hidden"
                        >
                            <Link to="/documentation" className="text-center text-neutral-400 hover:text-white py-2">Documentation</Link>
                            <button onClick={onLogin} className="bg-white text-black py-2.5 rounded-lg font-bold w-full">
                                Commencer
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>
        </div>
    );
}

// --- HERO SECTION ---
function Hero({ onLogin }) {
    return (
        <section className="relative h-screen w-full flex flex-col justify-center items-center text-center overflow-hidden px-6">
            <div className="absolute inset-0 bg-grid -z-10 opacity-60"></div>
            <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-black to-transparent -z-10"></div>
            <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-black to-transparent -z-10"></div>

            <div className="max-w-3xl mx-auto z-10 pt-10">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-5xl md:text-8xl font-bold text-white mb-8 tracking-tighter leading-[1.1]"
                >
                    L'infrastructure de<br />
                    <span className="text-neutral-500">modération ultime.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg md:text-xl text-neutral-400 mb-12 max-w-xl mx-auto leading-relaxed font-light"
                >
                    Gérez vos communautés Discord avec une précision chirurgicale.
                    Tickets, Anti-Raid et Logs, le tout piloté depuis le web.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center w-full"
                >
                    <button
                        onClick={onLogin}
                        className="h-12 px-8 rounded-xl bg-white text-black font-bold text-sm hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                    >
                        Déployer maintenant <ArrowRight size={16} />
                    </button>

                    <Link
                        to="/documentation"
                        className="h-12 px-8 rounded-xl border border-[#333] bg-transparent text-white font-bold text-sm hover:border-white transition-colors flex items-center justify-center gap-2"
                    >
                        <Command size={16} /> Documentation
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}

// --- BENTO GRID ---
function BentoGrid() {
    return (
        <section className="py-32 px-6 max-w-6xl mx-auto border-t border-[#1f1f1f]">
            <div className="mb-20 text-center">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                    Tout ce qu'il vous faut.<br /><span className="text-neutral-600">Rien de superflu.</span>
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
                {/* CARTE 1 */}
                <div className="md:col-span-2 bg-[#0a0a0a] border border-[#1f1f1f] rounded-3xl p-10 relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6"><LayoutDashboard className="text-white" /></div>
                        <h3 className="text-2xl font-bold text-white mb-2">Dashboard Temps Réel</h3>
                        <p className="text-neutral-400 text-sm max-w-sm leading-relaxed">Vos actions sur le site se répercutent instantanément sur Discord.</p>
                    </div>
                    <div className="absolute right-0 bottom-0 w-1/2 h-full bg-gradient-to-t from-[#111] to-transparent border-l border-[#1f1f1f] p-6 pt-12 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="space-y-4">
                            <div className="h-3 w-full bg-[#262626] rounded-full"></div>
                            <div className="h-3 w-3/4 bg-[#262626] rounded-full"></div>
                            <div className="flex gap-3 mt-6">
                                <div className="h-10 w-1/2 bg-[#1a1a1a] rounded-lg border border-[#333]"></div>
                                <div className="h-10 w-1/2 bg-white rounded-lg opacity-90"></div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* CARTE 2 */}
                <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-3xl p-10 flex flex-col justify-between group hover:border-[#333] transition-colors">
                    <div>
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6"><Lock className="text-white" /></div>
                        <h3 className="text-2xl font-bold text-white">Anti-Raid</h3>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-center gap-2 text-xs font-mono text-emerald-500 mb-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> ACTIVE
                        </div>
                        <p className="text-neutral-500 text-xs">Protection comportementale.</p>
                    </div>
                </div>
                {/* CARTE 3 */}
                <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-3xl p-10 relative overflow-hidden group hover:border-[#333] transition-colors">
                    <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-white/10 transition-colors duration-700"></div>
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6"><Ticket className="text-white" /></div>
                    <h3 className="text-2xl font-bold text-white mb-2">Tickets HTML</h3>
                    <p className="text-neutral-400 text-sm mb-8">Transcripts web permanents.</p>
                    <div className="flex gap-2">
                        <div className="px-3 py-1.5 bg-[#1a1a1a] rounded-md text-[10px] text-neutral-400 border border-[#333] font-mono">#support</div>
                    </div>
                </div>
                {/* CARTE 4 */}
                <div className="md:col-span-2 bg-[#0a0a0a] border border-[#1f1f1f] rounded-3xl p-10 flex items-center justify-between relative overflow-hidden group">
                    <div className="z-10">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6"><Zap className="text-white" /></div>
                        <h3 className="text-2xl font-bold text-white mb-2">Rapidité Extrême</h3>
                        <p className="text-neutral-400 text-sm max-w-sm">Architecture moderne, réponse en millisecondes.</p>
                    </div>
                    <div className="absolute right-10 top-10 bottom-10 w-64 bg-[#050505] rounded-xl border border-[#222] p-6 font-mono text-[10px] text-neutral-500 hidden md:block shadow-2xl opacity-80 group-hover:opacity-100 transition-opacity">
                        <div><span className="text-purple-400">const</span> bot = <span className="text-yellow-400">init</span>();</div>
                        <div className="pl-4 mt-2"><span className="text-neutral-600">// Event</span></div>
                        <div className="pl-4">bot.<span className="text-blue-400">protect</span>(server);</div>
                        <div className="mt-4 pt-4 border-t border-[#222] text-emerald-500">➜ 4ms</div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// --- FOOTER ---
function Footer() {
    return (
        <footer className="py-20 border-t border-[#1f1f1f] bg-black text-sm">
            <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-3 font-bold text-lg text-white">
                    <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center"><Shield size={14} fill="currentColor" /></div>
                    Guardian.
                </div>
                <div className="flex gap-8 text-neutral-500 font-medium">
                    <a href="#" className="hover:text-white transition-colors">Légal</a>
                    <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
                </div>
                <p className="text-neutral-600 text-xs">
                    &copy; 2024 Guardian. Systems.
                </p>
            </div>
        </footer>
    );
}

// --- LANDING PAGE ---
function LandingPage() {
    const handleLogin = () => {
        window.location.href = `${API_URL}/api/auth/login`;
    };

    return (
        <div className="min-h-screen bg-black">
            <style>{styles}</style>
            <Navbar onLogin={handleLogin} />
            <Hero onLogin={handleLogin} />

            {/* AJOUT DU PATCH NOTE ICI */}
            <PatchNoteBanner />
            <BentoGrid />
            <Footer />
        </div>
    );
}

// --- SERVER LIST (MODIFIÉ POUR LA SYNCHRO) ---
function ServerList({ user, onLogout }) {
    const [guilds, setGuilds] = useState(user.guilds);
    const [selectedGuild, setSelectedGuild] = useState(user.guilds[0]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showMobilePreview, setShowMobilePreview] = useState(false);

    // --- SYNCHRONISATION AUTOMATIQUE ---
    useEffect(() => {
        const syncBotStatus = async () => {
            if (user.guilds.length === 0) return; // Pas besoin de sync si 0 serveur

            try {
                const guildIds = user.guilds.map(g => g.id);
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/sync-bot-status`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ guildIds })
                });

                if (response.ok) {
                    const data = await response.json();
                    const botGuilds = data.botGuilds || [];

                    setGuilds(currentGuilds =>
                        currentGuilds.map(g => ({
                            ...g,
                            botInGuild: botGuilds.includes(g.id)
                        }))
                    );

                    // Mise à jour de la sélection si nécessaire
                    if (selectedGuild) {
                        setSelectedGuild(prev => ({
                            ...prev,
                            botInGuild: botGuilds.includes(prev.id)
                        }));
                    }
                }
            } catch (error) {
                console.error("Erreur de synchronisation:", error);
            }
        };

        syncBotStatus();
        const onFocus = () => syncBotStatus();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [user.guilds]);

    const filteredGuilds = guilds.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleGuildClick = (guild) => {
        setSelectedGuild(guild);
        if (window.innerWidth < 768) {
            setShowMobilePreview(true);
        }
    };

    // --- NOUVEAU : ÉCRAN "PAS DE SERVEUR" ---
    if (guilds.length === 0) {
        return (
            <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>

                <div className="relative z-10 max-w-md text-center space-y-6 bg-[#0a0a0a] border border-[#1f1f1f] p-8 rounded-2xl shadow-2xl">
                    <div className="w-16 h-16 bg-[#111] rounded-full flex items-center justify-center mx-auto border border-[#222]">
                        <Ban size={32} className="text-red-500" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Aucun serveur détecté</h2>
                        <p className="text-neutral-400 text-sm leading-relaxed">
                            Pour utiliser Guardian, vous devez être <strong>Propriétaire</strong> ou avoir la permission <strong>Administrateur</strong> sur au moins un serveur Discord.
                        </p>
                    </div>

                    <div className="bg-[#111] rounded-lg p-4 text-left border border-[#222]">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Solutions possibles :</h3>
                        <ul className="space-y-2 text-sm text-neutral-300">
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-1">1.</span> Créez un nouveau serveur Discord.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-1">2.</span> Demandez les droits "Gérer le serveur" à un ami.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-1">3.</span> Rechargez cette page après modification.
                            </li>
                        </ul>
                    </div>

                    <div className="flex gap-3 justify-center pt-2">
                        <button
                            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'https://termiprotector.alwaysdata.net'}/api/auth/login`}
                            className="px-5 py-2.5 rounded-xl border border-[#333] hover:bg-[#111] text-white text-sm font-bold transition-colors"
                        >
                            Actualiser la liste
                        </button>
                        <button onClick={onLogout} className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 text-sm font-bold transition-colors flex items-center gap-2">
                            Se déconnecter
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-6 text-neutral-600 text-xs font-mono">
                    Compte connecté : {user.username}
                </div>
            </div>
        );
    }

    // --- RENDU NORMAL (Si des serveurs existent) ---
    return (
        <div className="h-screen bg-black text-white font-sans flex overflow-hidden relative">
            {/* ... Tout le code existant de la sidebar et du preview ... */}
            <div className="w-full md:w-[450px] flex flex-col border-r border-[#1f1f1f] bg-[#050505] z-20">
                <div className="p-6 border-b border-[#1f1f1f]">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} className="w-10 h-10 rounded-full border border-[#333]" alt="Avatar" />
                            <div>
                                <div className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Compte</div>
                                <div className="text-sm font-bold text-white truncate max-w-[150px]">{user.username}</div>
                            </div>
                        </div>
                        <button onClick={onLogout} className="p-2 hover:bg-[#1a1a1a] rounded-lg text-neutral-500 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="relative group">
                        <Command size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 group-hover:text-white transition-colors" />
                        <input
                            type="text"
                            placeholder="Rechercher un serveur..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg py-2.5 pl-9 pr-4 text-sm text-white placeholder-neutral-600 outline-none focus:border-[#333] transition-colors"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar pb-20 md:pb-2">
                    {filteredGuilds.map((g) => (
                        <div
                            key={g.id}
                            onClick={() => handleGuildClick(g)}
                            onMouseEnter={() => setSelectedGuild(g)}
                            className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all duration-200 group ${selectedGuild?.id === g.id ? 'bg-[#111] border border-[#222]' : 'border border-transparent hover:bg-[#0a0a0a]'}`}
                        >
                            <div className="flex items-center gap-4">
                                {g.icon ?
                                    <img src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`} className={`w-10 h-10 rounded-full transition-all ${selectedGuild?.id === g.id ? 'grayscale-0' : 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'}`} />
                                    :
                                    <div className="w-10 h-10 bg-[#1a1a1a] rounded-full flex items-center justify-center font-bold text-white text-xs">{g.name.charAt(0)}</div>
                                }
                                <div>
                                    <div className={`font-medium text-sm transition-colors ${selectedGuild?.id === g.id ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-200'}`}>{g.name}</div>
                                    <div className="text-[10px] text-neutral-600 font-mono">{g.botInGuild ? '● CONNECTÉ' : '○ DISPONIBLE'}</div>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-[#333] md:hidden" />
                            {selectedGuild?.id === g.id && <div className="hidden md:block w-1.5 h-1.5 bg-white rounded-full mr-2"></div>}
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-[#1f1f1f] text-center text-[10px] text-neutral-600 font-mono hidden md:block">{filteredGuilds.length} SERVEURS DÉTECTÉS</div>
            </div>
            <AnimatePresence>
                {(showMobilePreview || window.innerWidth >= 768) && (
                    <motion.div
                        initial={window.innerWidth < 768 ? { x: "100%" } : { opacity: 1 }}
                        animate={window.innerWidth < 768 ? { x: 0 } : { opacity: 1 }}
                        exit={window.innerWidth < 768 ? { x: "100%" } : { opacity: 1 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={`bg-black flex-1 items-center justify-center overflow-hidden ${window.innerWidth < 768 ? 'fixed inset-0 z-50 flex flex-col' : 'hidden md:flex relative'}`}
                    >
                        <div className="md:hidden absolute top-6 left-6 z-50">
                            <button onClick={() => setShowMobilePreview(false)} className="flex items-center gap-2 text-white font-bold bg-black/50 backdrop-blur px-4 py-2 rounded-full border border-white/10">
                                <ArrowLeft size={18} /> Retour
                            </button>
                        </div>
                        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] pointer-events-none"></div>
                        <div className="relative z-10 w-full max-w-lg p-8 md:p-12 flex flex-col items-center">
                            <AnimatePresence mode="wait">
                                {selectedGuild && (
                                    <motion.div
                                        key={selectedGuild.id}
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                        transition={{ duration: 0.3, ease: "circOut" }}
                                        className="flex flex-col items-center text-center w-full"
                                    >
                                        <div className="relative mb-8 md:mb-10 group">
                                            <div className="absolute -inset-4 bg-white/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                            {selectedGuild.icon ?
                                                <img src={`https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png`} className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[#1f1f1f] shadow-2xl relative z-10 bg-[#0a0a0a]" />
                                                :
                                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[#1f1f1f] bg-[#111] flex items-center justify-center text-3xl md:text-4xl font-bold text-white relative z-10">{selectedGuild.name.charAt(0)}</div>
                                            }
                                            <div className={`absolute bottom-1 right-1 w-8 h-8 rounded-full border-4 border-black flex items-center justify-center z-20 ${selectedGuild.botInGuild ? 'bg-white' : 'bg-[#333]'}`}>
                                                {selectedGuild.botInGuild ? <Shield size={14} className="text-black fill-black" /> : <Lock size={14} className="text-neutral-500" />}
                                            </div>
                                        </div>
                                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight px-4">{selectedGuild.name}</h2>
                                        <p className="text-neutral-500 mb-10 font-mono text-xs uppercase tracking-[0.2em]">ID: {selectedGuild.id}</p>
                                        <div className="flex flex-col gap-4 w-full max-w-xs">
                                            {selectedGuild.botInGuild ? (
                                                <>
                                                    <Link to={`/dashboard/${selectedGuild.id}`} className="group relative w-full h-14 bg-white text-black font-bold text-sm rounded-xl overflow-hidden flex items-center justify-center hover:scale-105 transition-transform duration-200 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]">
                                                        <div className="absolute inset-0 bg-neutral-200 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                                        <span className="relative z-10 flex items-center gap-2">OUVRIR LE DASHBOARD <ArrowRight size={16} /></span>
                                                    </Link>
                                                    <div className="flex gap-2 justify-center">
                                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wide"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> En ligne</div>
                                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#111] border border-[#222] text-neutral-400 text-[10px] font-bold uppercase tracking-wide">Protection Active</div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <a href={`https://discord.com/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID || '1469434879019057223'}&permissions=8&scope=bot&guild_id=${selectedGuild.id}`} target="_blank" className="w-full h-14 border border-[#333] hover:border-white text-white font-bold text-sm rounded-xl flex items-center justify-center transition-all hover:bg-white/5">
                                                        INSTALLER GUARDIAN
                                                    </a>
                                                    <p className="text-neutral-600 text-xs">Le bot doit être invité pour être configuré.</p>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- APP LOGIC ---
function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('discord_user');
        setUser(null);
        navigate('/');
    };

    useEffect(() => {
        const checkAuth = () => {
            const params = new URLSearchParams(location.search);
            const dataStr = params.get('data');

            if (dataStr) {
                try {
                    const parsedUser = JSON.parse(decodeURIComponent(dataStr));
                    setUser(parsedUser);
                    localStorage.setItem('discord_user', JSON.stringify(parsedUser));
                    navigate('/', { replace: true });
                } catch (e) { console.error("Erreur parsing", e); }
            } else {
                const storedUser = localStorage.getItem('discord_user');
                if (storedUser) {
                    try { setUser(JSON.parse(storedUser)); }
                    catch (e) { localStorage.removeItem('discord_user'); }
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono text-xs uppercase tracking-widest animate-pulse">Chargement...</div>;

    return (
        <Routes>
            <Route path="/" element={user ? <ServerList user={user} onLogout={handleLogout} /> : <LandingPage />} />
            <Route path="/dashboard/:guildId" element={user ? <Dashboard user={user} /> : <LandingPage />} />
            <Route path="/documentation" element={<Documentation />} />
        </Routes>
    );
}

export default App;