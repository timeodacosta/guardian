import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    Shield, Book, Server, MessageSquare, AlertTriangle, 
    CheckCircle2, Terminal, ArrowRight, ChevronRight, LayoutDashboard, 
    Command, CornerDownRight, ChevronDown, Copy, Check, Sliders, Users, FileText, Lock,
    Gavel, Zap, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const styles = `
  :root {
    --bg-color: #000000;
    --border: #1f1f1f;
  }
  
  .bg-grid {
    background-size: 40px 40px;
    background-image: linear-gradient(to right, #1a1a1a 1px, transparent 1px),
                      linear-gradient(to bottom, #1a1a1a 1px, transparent 1px);
    mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
  }

  .cmd-item {
    background: #0a0a0a;
    border: 1px solid #1f1f1f;
    border-radius: 0.75rem;
    overflow: hidden;
    transition: all 0.2s ease;
  }
  
  .cmd-item:hover {
    border-color: #333;
  }

  .doc-card {
    background: #0a0a0a;
    border: 1px solid #1f1f1f;
    border-radius: 1rem;
    padding: 1.5rem;
    transition: all 0.2s ease;
  }
`;

function Documentation() {
    const [activeSection, setActiveSection] = useState('intro');
    const [botCommands, setBotCommands] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [expandedCmd, setExpandedCmd] = useState(null);
    const [copiedCmd, setCopiedCmd] = useState(null);

    // --- 1. CHARGEMENT API ---
    useEffect(() => {
        fetch(`${API_URL}/api/commands`)
            .then(res => res.json())
            .then(data => {
                setBotCommands(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Erreur chargement commandes", err);
                setLoading(false);
            });
    }, []);

    // --- 2. DETECTION DU SCROLL ---
    useEffect(() => {
        const handleScroll = () => {
            const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;
            if (isAtBottom) {
                setActiveSection('dashboard');
                return;
            }

            const scrollPosition = window.scrollY + 150;
            // Ajout de 'moderation' dans les sections
            const sections = ['intro', 'installation', 'commands', 'tickets', 'moderation', 'dashboard'];

            for (const id of sections) {
                const element = document.getElementById(id);
                if (element) {
                    const offsetTop = element.offsetTop;
                    const offsetHeight = element.offsetHeight;

                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(id);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [botCommands, loading]);

    const scrollTo = (id) => {
        const element = document.getElementById(id);
        if (element) {
            const y = element.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const toggleCmd = (name) => {
        setExpandedCmd(expandedCmd === name ? null : name);
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedCmd(text);
        setTimeout(() => setCopiedCmd(null), 2000);
    };

    const OptionsList = ({ options }) => (
        <div className="grid grid-cols-1 gap-2 mt-2">
            {options.map((opt, idx) => (
                <div key={idx} className="flex items-center justify-between bg-[#111]/50 p-2 rounded border border-[#1f1f1f]/50 ml-4 relative group/opt">
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-[1px] bg-[#333]"></div>
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-400 text-xs bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-900/50">{opt.name}</span>
                        <span className="text-neutral-500 text-xs">{opt.description}</span>
                    </div>
                    {opt.required ? (
                        <span className="text-[9px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded uppercase font-bold border border-red-500/20">Requis</span>
                    ) : (
                        <span className="text-[9px] bg-neutral-500/10 text-neutral-500 px-1.5 py-0.5 rounded uppercase font-bold border border-neutral-500/20">Optionnel</span>
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20">
            <style>{styles}</style>
            
            {/* BACKGROUND */}
            <div className="fixed inset-0 bg-grid -z-10 opacity-40 pointer-events-none"></div>

            {/* NAVBAR */}
            <header className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-[#1f1f1f]">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 font-bold text-lg tracking-tight text-white hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center">
                            <Shield size={16} fill="currentColor" />
                        </div>
                        <span>Guardian. <span className="text-neutral-500 font-medium">/ Docs</span></span>
                    </Link>
                    <Link to="/" className="text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-white transition-colors flex items-center gap-2">
                        Retour au site <ArrowRight size={14}/>
                    </Link>
                </div>
            </header>

            <div className="max-w-7xl mx-auto pt-32 pb-40 px-6 flex flex-col md:flex-row gap-12">
                
                {/* SIDEBAR */}
                <aside className="hidden md:block w-64 shrink-0 fixed h-[calc(100vh-10rem)] top-32 overflow-y-auto custom-scrollbar">
                    <div className="space-y-1">
                        <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4 pl-3">Sommaire</div>
                        <NavItem id="intro" label="Introduction" icon={<Book size={16}/>} active={activeSection === 'intro'} onClick={() => scrollTo('intro')} />
                        <NavItem id="installation" label="Installation" icon={<Server size={16}/>} active={activeSection === 'installation'} onClick={() => scrollTo('installation')} />
                        <NavItem id="commands" label="Liste des Commandes" icon={<Command size={16}/>} active={activeSection === 'commands'} onClick={() => scrollTo('commands')} />
                        <NavItem id="tickets" label="Système Tickets" icon={<MessageSquare size={16}/>} active={activeSection === 'tickets'} onClick={() => scrollTo('tickets')} />
                        <NavItem id="moderation" label="Modération" icon={<Gavel size={16}/>} active={activeSection === 'moderation'} onClick={() => scrollTo('moderation')} />
                        <NavItem id="dashboard" label="Dashboard Web" icon={<LayoutDashboard size={16}/>} active={activeSection === 'dashboard'} onClick={() => scrollTo('dashboard')} />
                    </div>
                </aside>

                {/* CONTENU */}
                <main className="flex-1 md:ml-72 space-y-24">
                    
                    {/* --- INTRO (ENRICHIE) --- */}
                    <section id="intro" className="scroll-mt-32 space-y-8">
                        <div>
                            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Le Gardien de votre <br/><span className="text-neutral-500">Communauté.</span></h1>
                            <p className="text-lg text-neutral-400 leading-relaxed max-w-3xl">
                                Bienvenue sur la documentation de <strong>Guardian</strong>. Conçu pour les serveurs exigeants, ce bot allie puissance et simplicité. 
                                Il ne se contente pas de modérer : il structure votre communauté grâce à un écosystème complet pilotable depuis le web.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-[#0a0a0a] border border-[#1f1f1f] p-6 rounded-xl">
                                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-4 text-white"><Shield size={20}/></div>
                                <h3 className="font-bold text-white mb-2">Protection</h3>
                                <p className="text-sm text-neutral-500">Anti-raid, anti-spam et logs détaillés pour une sécurité maximale.</p>
                            </div>
                            <div className="bg-[#0a0a0a] border border-[#1f1f1f] p-6 rounded-xl">
                                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-4 text-white"><LayoutDashboard size={20}/></div>
                                <h3 className="font-bold text-white mb-2">Gestion Web</h3>
                                <p className="text-sm text-neutral-500">Un dashboard complet pour configurer vos embeds et sanctions sans commande.</p>
                            </div>
                            <div className="bg-[#0a0a0a] border border-[#1f1f1f] p-6 rounded-xl">
                                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-4 text-white"><MessageSquare size={20}/></div>
                                <h3 className="font-bold text-white mb-2">Support</h3>
                                <p className="text-sm text-neutral-500">Système de tickets avancé avec transcripts HTML et gestion d'équipe.</p>
                            </div>
                        </div>
                    </section>

                    {/* --- INSTALLATION --- */}
                    <section id="installation" className="scroll-mt-32 space-y-6 pt-10 border-t border-[#1f1f1f]">
                        <div className="flex items-center gap-3 text-2xl font-bold"><div className="w-8 h-8 rounded bg-[#1f1f1f] flex items-center justify-center text-sm">1</div> Installation</div>
                        <p className="text-neutral-400">La mise en place de Guardian est conçue pour être instantanée.</p>
                        <div className="space-y-4">
                            <Step number="01" title="Inviter le Bot">Cliquez sur le bouton "Inviter" depuis la page d'accueil ou le dashboard pour ajouter Guardian à votre serveur.</Step>
                            <Step number="02" title="Modules de Setup">
                                Guardian dispose de plusieurs modules configurables. Lancez l'assistant correspondant à vos besoins :
                                
                                <div className="mt-3 space-y-2">
                                    <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3 pl-4 font-mono text-sm text-emerald-400 flex justify-between items-center group">
                                        <div className="flex items-center gap-3"><span>/setup ticket</span><span className="text-neutral-600 text-xs italic hidden sm:block">// Système de support</span></div>
                                        <button onClick={() => handleCopy('/setup ticket')} className="text-neutral-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100 p-1" title="Copier">{copiedCmd === '/setup ticket' ? <Check size={16} className="text-emerald-500"/> : <Copy size={16}/>}</button>
                                    </div>
                                    <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3 pl-4 font-mono text-sm text-emerald-400 flex justify-between items-center group">
                                        <div className="flex items-center gap-3"><span>/setup antispam</span><span className="text-neutral-600 text-xs italic hidden sm:block">// Protection chat</span></div>
                                        <button onClick={() => handleCopy('/setup antispam')} className="text-neutral-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100 p-1" title="Copier">{copiedCmd === '/setup antispam' ? <Check size={16} className="text-emerald-500"/> : <Copy size={16}/>}</button>
                                    </div>
                                    <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3 pl-4 font-mono text-sm text-emerald-400 flex justify-between items-center group">
                                        <div className="flex items-center gap-3"><span>/setup antilink</span><span className="text-neutral-600 text-xs italic hidden sm:block">// Blocage de liens</span></div>
                                        <button onClick={() => handleCopy('/setup antilink')} className="text-neutral-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100 p-1" title="Copier">{copiedCmd === '/setup antilink' ? <Check size={16} className="text-emerald-500"/> : <Copy size={16}/>}</button>
                                    </div>
                                    <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3 pl-4 font-mono text-sm text-emerald-400 flex justify-between items-center group">
                                        <div className="flex items-center gap-3"><span>/setup welcome</span><span className="text-neutral-600 text-xs italic hidden sm:block">// Messages de bienvenue</span></div>
                                        <button onClick={() => handleCopy('/setup welcome')} className="text-neutral-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100 p-1" title="Copier">{copiedCmd === '/setup welcome' ? <Check size={16} className="text-emerald-500"/> : <Copy size={16}/>}</button>
                                    </div>
                                    <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3 pl-4 font-mono text-sm text-emerald-400 flex justify-between items-center group">
                                        <div className="flex items-center gap-3"><span>/setup logs</span><span className="text-neutral-600 text-xs italic hidden sm:block">// Salons de logs</span></div>
                                        <button onClick={() => handleCopy('/setup logs')} className="text-neutral-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100 p-1" title="Copier">{copiedCmd === '/setup logs' ? <Check size={16} className="text-emerald-500"/> : <Copy size={16}/>}</button>
                                    </div>
                                </div>
                            </Step>
                        </div>
                    </section>

                    {/* --- COMMANDES --- */}
                    <section id="commands" className="scroll-mt-32 space-y-6 pt-10 border-t border-[#1f1f1f]">
                        <div className="flex items-center gap-3 text-2xl font-bold"><div className="w-8 h-8 rounded bg-[#1f1f1f] flex items-center justify-center text-sm">2</div> Commandes Disponibles</div>
                        <p className="text-neutral-400">Voici la liste exhaustive des commandes détectées sur le bot.</p>

                        {loading ? (
                            <div className="p-8 text-center text-neutral-500 animate-pulse">Chargement des commandes...</div>
                        ) : botCommands.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500 border border-dashed border-[#1f1f1f] rounded-xl">Aucune commande trouvée ou bot hors ligne.</div>
                        ) : (
                            <div className="space-y-3">
                                {botCommands.map((cmd, idx) => {
                                    const isOpen = expandedCmd === cmd.name;
                                    const cmdText = `/${cmd.name}`;
                                    const hasSub = cmd.subcommands && cmd.subcommands.length > 0;
                                    const hasOpts = cmd.options && cmd.options.length > 0;

                                    return (
                                        <div key={idx} className={`cmd-item ${isOpen ? 'bg-[#0f0f0f] border-[#333]' : 'hover:bg-[#0f0f0f]'}`}>
                                            <button onClick={() => toggleCmd(cmd.name)} className="w-full flex items-center justify-between p-4 text-left focus:outline-none group/btn">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 font-mono text-emerald-400 font-bold bg-emerald-400/10 px-2.5 py-1 rounded text-sm border border-emerald-400/10">
                                                        <span>{cmdText}</span>
                                                    </div>
                                                    {!isOpen && <span className="text-sm text-neutral-500 truncate max-w-md hidden sm:block opacity-60 group-hover/btn:opacity-100 transition-opacity">{cmd.description}</span>}
                                                </div>
                                                <ChevronDown size={18} className={`text-neutral-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : ''}`} />
                                            </button>

                                            <AnimatePresence>
                                                {isOpen && (
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                                        <div className="p-4 pt-0 border-t border-[#1f1f1f] mt-2">
                                                            <div className="pt-4 pb-2">
                                                                <h4 className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest mb-2">Description</h4>
                                                                <p className="text-sm text-neutral-300 leading-relaxed mb-6">{cmd.description}</p>

                                                                {/* SOUS-COMMANDES */}
                                                                {hasSub && (
                                                                    <div className="mb-4">
                                                                        <h4 className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest mb-3 flex items-center gap-2"><CornerDownRight size={12}/> Sous-commandes</h4>
                                                                        <div className="space-y-4 pl-2 border-l-2 border-[#1f1f1f]">
                                                                            {cmd.subcommands.map((sub, sIdx) => {
                                                                                const subCmdText = `/${cmd.name} ${sub.name}`;
                                                                                const hasSubOpts = sub.options && sub.options.length > 0;
                                                                                return (
                                                                                    <div key={sIdx} className="pl-4 py-1 group/sub">
                                                                                        <div className="flex gap-3 items-start">
                                                                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neutral-600 shrink-0"></div>
                                                                                            <div className="flex-1">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <span className="font-mono text-white font-bold text-sm">{sub.name}</span>
                                                                                                    <button onClick={() => handleCopy(subCmdText)} className="text-neutral-600 hover:text-white transition-colors opacity-0 group-hover/sub:opacity-100 p-0.5" title="Copier">{copiedCmd === subCmdText ? <Check size={12} className="text-emerald-500"/> : <Copy size={12}/>}</button>
                                                                                                </div>
                                                                                                <p className="text-xs text-neutral-400 mt-0.5">{sub.description}</p>
                                                                                                {hasSubOpts && <OptionsList options={sub.options} />}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                            )})}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* OPTIONS PRINCIPALES */}
                                                                {hasOpts && (
                                                                    <div className="mb-6">
                                                                        <h4 className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest mb-3 flex items-center gap-2"><Sliders size={12}/> Options</h4>
                                                                        <OptionsList options={cmd.options} />
                                                                    </div>
                                                                )}

                                                                {/* UTILISATION */}
                                                                <div>
                                                                    <h4 className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest mb-3">Utilisation</h4>
                                                                    <div className="flex items-center justify-between bg-[#111] p-3 rounded-lg border border-[#1f1f1f] text-sm text-neutral-400 font-mono group/usage">
                                                                        <div className="flex items-center gap-3">
                                                                            <Terminal size={14} className="text-neutral-600"/>
                                                                            <span>{cmdText}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-neutral-600 italic text-xs hidden sm:block">{hasSub ? '// Commande principale' : (hasOpts ? '// Remplir les options' : '// Commande directe')}</span>
                                                                            <button onClick={() => handleCopy(cmdText)} className="text-neutral-500 hover:text-white transition-colors opacity-0 group-hover/usage:opacity-100 p-1" title="Copier">
                                                                                {copiedCmd === cmdText ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* --- TICKETS --- */}
                    <section id="tickets" className="scroll-mt-32 space-y-8 pt-10 border-t border-[#1f1f1f]">
                        <div className="flex items-center gap-3 text-2xl font-bold"><div className="w-8 h-8 rounded bg-[#1f1f1f] flex items-center justify-center text-sm">3</div> Système de Tickets</div>
                        <p className="text-neutral-400">Le système de support complet pour votre communauté, entièrement personnalisable.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="doc-card">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><MessageSquare size={18} className="text-emerald-500"/> Fonctionnalités Clés</h3>
                                <div className="space-y-4">
                                    <Feature label="Ouverture par Modal" desc="L'utilisateur doit saisir un motif avant d'ouvrir un ticket."/>
                                    <Feature label="Système de Claim" desc="Permet au staff de s'attribuer un ticket (le bouton change)." icon={Lock}/>
                                    <Feature label="Transcripts HTML" desc="Sauvegarde complète de la conversation téléchargeable." icon={FileText}/>
                                </div>
                            </div>
                            <div className="doc-card">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Users size={18} className="text-blue-500"/> Gestion Staff</h3>
                                <div className="space-y-4">
                                    <Feature label="Ajout/Retrait Membres" desc="Boutons intégrés pour gérer les permissions du ticket."/>
                                    <Feature label="Rôle Support" desc="Définissez quel rôle a accès aux tickets via le Dashboard."/>
                                    <Feature label="Logs complets" desc="Trace de qui a fermé ou supprimé le ticket."/>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4 pl-1">Cycle de vie d'un ticket</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <StepCard number="1" title="Création" desc="L'utilisateur clique sur 'Ouvrir' et remplit le motif. Le salon privé est créé instantanément."/>
                                <StepCard number="2" title="Assistance" desc="Le staff reçoit le ticket. Il peut 'Claim' pour le prendre en charge ou ajouter des collègues."/>
                                <StepCard number="3" title="Archivage" desc="Une fois résolu, le ticket est fermé (🔒). Un transcript est généré avant la suppression (⛔)." last={true}/>
                            </div>
                        </div>
                    </section>

                    {/* --- MODERATION (NOUVEAU) --- */}
                    <section id="moderation" className="scroll-mt-32 space-y-8 pt-10 border-t border-[#1f1f1f]">
                        <div className="flex items-center gap-3 text-2xl font-bold"><div className="w-8 h-8 rounded bg-[#1f1f1f] flex items-center justify-center text-sm">4</div> Gestion des Sanctions</div>
                        <p className="text-neutral-400">Une interface centralisée pour gérer tous les avertissements, bannissements et expulsions.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="doc-card relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 bg-orange-500/10 rounded-full blur-xl group-hover:bg-orange-500/20 transition-colors pointer-events-none"></div>
                                <h3 className="font-bold text-white mb-2 flex items-center gap-2"><AlertTriangle size={18} className="text-orange-500"/> Avertissements</h3>
                                <p className="text-sm text-neutral-400 mb-4">Consultez l'historique complet des warns de chaque membre. Supprimez les sanctions obsolètes en un clic.</p>
                                <div className="text-xs font-mono text-neutral-500 bg-[#111] p-2 rounded border border-[#222]">/warn add | /warn list</div>
                            </div>
                            
                            <div className="doc-card relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 bg-red-500/10 rounded-full blur-xl group-hover:bg-red-500/20 transition-colors pointer-events-none"></div>
                                <h3 className="font-bold text-white mb-2 flex items-center gap-2"><Gavel size={18} className="text-red-500"/> Sync Bannissements</h3>
                                <p className="text-sm text-neutral-400 mb-4">Synchronisez les bans Discord existants avec la base de données Guardian pour un suivi complet.</p>
                                <div className="text-xs font-mono text-neutral-500 bg-[#111] p-2 rounded border border-[#222]">Sync via Dashboard</div>
                            </div>

                            <div className="doc-card relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors pointer-events-none"></div>
                                <h3 className="font-bold text-white mb-2 flex items-center gap-2"><Zap size={18} className="text-blue-500"/> Auto-Sanctions</h3>
                                <p className="text-sm text-neutral-400 mb-4">Configurez des règles automatiques : Expulsion au bout de 3 warns, Ban au bout de 5 warns.</p>
                                <div className="text-xs font-mono text-neutral-500 bg-[#111] p-2 rounded border border-[#222]">Config via Dashboard</div>
                            </div>
                        </div>
                    </section>

                    {/* --- DASHBOARD --- */}
                    <section id="dashboard" className="scroll-mt-32 space-y-6 pt-10 border-t border-[#1f1f1f]">
                        <div className="flex items-center gap-3 text-2xl font-bold"><div className="w-8 h-8 rounded bg-[#1f1f1f] flex items-center justify-center text-sm">5</div> Dashboard Web</div>
                        <p className="text-neutral-400">Le centre de contrôle ultime. Connectez-vous pour tout gérer sans commande.</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="doc-card">
                                <h3 className="font-bold text-white mb-2">Configuration Modules</h3>
                                <p className="text-sm text-neutral-500 mb-4">Activez et configurez chaque module en détail.</p>
                                <ul className="space-y-2 text-sm text-neutral-400">
                                    <li className="flex items-start gap-2"><Check size={14} className="mt-1 text-emerald-500"/> <strong>Anti-Spam Avancé :</strong> Définissez la limite de messages, le temps, et les rôles/salons ignorés (Whitelists).</li>
                                    <li className="flex items-start gap-2"><Check size={14} className="mt-1 text-emerald-500"/> <strong>Anti-Link :</strong> Blocage automatique des invitations.</li>
                                </ul>
                            </div>
                            <div className="doc-card">
                                <h3 className="font-bold text-white mb-2 flex items-center gap-2"><Settings size={16}/> Auto-Save & Live Editor</h3>
                                <p className="text-sm text-neutral-500">Plus besoin de chercher le bouton "Sauvegarder".</p>
                                <p className="text-sm text-neutral-400 mt-2">
                                    Toutes vos modifications sur le dashboard sont enregistrées automatiquement après 1 seconde d'inactivité.
                                    Le Live Editor des tickets vous montre le résultat en temps réel.
                                </p>
                            </div>
                        </div>

                        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center mt-8">
                            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0"><LayoutDashboard className="text-white"/></div>
                            <div className="flex-1">
                                <h4 className="font-bold text-white mb-1">Prêt à configurer ?</h4>
                                <p className="text-sm text-neutral-400">Connectez-vous maintenant pour accéder à toutes ces fonctionnalités.</p>
                            </div>
                            <Link to="/" className="px-4 py-2 bg-white text-black font-bold text-sm rounded-lg hover:bg-neutral-200 transition-colors whitespace-nowrap">
                                Connexion Dashboard
                            </Link>
                        </div>
                    </section>

                </main>
            </div>
        </div>
    );
}

// --- PETITS COMPOSANTS ---

function NavItem({ id, label, icon, active, onClick }) {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-white text-black' : 'text-neutral-500 hover:text-white hover:bg-[#111]'}`}
        >
            {icon} {label}
        </button>
    );
}

function Step({ number, title, children }) {
    return (
        <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full border border-[#333] bg-[#0a0a0a] flex items-center justify-center text-xs font-bold text-neutral-400">
                {number}
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-white mb-1">{title}</h4>
                <div className="text-sm text-neutral-400 leading-relaxed">{children}</div>
            </div>
        </div>
    );
}

function StepCard({ number, title, desc, last = false }) {
    return (
        <div className="bg-[#0a0a0a] border border-[#1f1f1f] p-5 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors pointer-events-none"></div>
            <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center font-bold text-white text-sm border border-[#333]">{number}</div>
                {!last && <ArrowRight size={16} className="text-neutral-600"/>}
            </div>
            <h4 className="font-bold text-white mb-2 relative z-10">{title}</h4>
            <p className="text-xs text-neutral-400 leading-relaxed relative z-10">{desc}</p>
        </div>
    );
}

function Feature({ label, desc, icon: Icon = CheckCircle2 }) {
    return (
        <div className="flex items-start gap-3">
            <Icon size={16} className="text-emerald-500 mt-0.5 shrink-0"/>
            <div>
                <span className="font-bold text-white text-sm block">{label}</span>
                <span className="text-xs text-neutral-500">{desc}</span>
            </div>
        </div>
    );
}

export default Documentation;