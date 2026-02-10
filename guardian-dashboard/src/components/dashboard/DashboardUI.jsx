import { Check, ChevronDown, Loader2, ArrowRight, Settings, Hash, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

// --- STYLES CSS GLOBAUX EXPORTÉS ---
export const dashboardStyles = `
  :root { --bg-dark: #000000; --bg-card: #0a0a0a; --border-color: #1f1f1f; --accent: #ffffff; }
  .clean-glass { background: var(--bg-card); border: 1px solid var(--border-color); }
  .clean-input { background: #000000; border: 1px solid var(--border-color); color: #ffffff; transition: all 0.2s ease; }
  .clean-input:focus { border-color: #333; background: #050505; }
  .bg-grid-preview { background-size: 20px 20px; background-image: linear-gradient(to right, #1a1a1a 1px, transparent 1px), linear-gradient(to bottom, #1a1a1a 1px, transparent 1px); }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
`;

export function NavButton({ icon, label, active, onClick }) {
    return (<button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${active ? 'bg-white text-black' : 'text-neutral-500 hover:text-white hover:bg-[#111]'}`}> {icon} {label} </button>);
}

export function TabPill({ label, active, onClick }) {
    return (<button onClick={onClick} className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${active ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}> {label} </button>);
}

export function Toggle({ label, checked, onChange }) {
    return (<div onClick={onChange} className={`cursor-pointer border border-[#1f1f1f] bg-[#111] p-3 rounded-lg flex justify-between items-center ${checked ? 'border-white' : ''}`}> <span className={`text-xs font-bold ${checked ? 'text-white' : 'text-neutral-500'}`}>{label}</span> {checked && <Check size={12} className="text-white" />} </div>);
}

export function CustomRoleSelect({ roles, selectedId, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedRole = roles.find(r => r.id === selectedId);
    return (
        <div className="relative">
            <div onClick={() => setIsOpen(!isOpen)} className="clean-input rounded p-2 text-xs flex justify-between cursor-pointer items-center"><span className={selectedRole ? 'text-white' : 'text-neutral-500'}>{selectedRole?.name || "Sélectionner..."}</span><ChevronDown size={12} /></div>
            {isOpen && (<div className="absolute top-full left-0 w-full bg-[#111] border border-[#333] rounded mt-1 z-50 max-h-40 overflow-auto">{roles.map(r => (<div key={r.id} onClick={() => { onChange(r.id); setIsOpen(false); }} className="p-2 hover:bg-[#222] text-xs text-neutral-300 cursor-pointer flex gap-2 items-center"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }}></div>{r.name}</div>))}</div>)}
        </div>
    );
}

export function CustomChannelSelect({ channels, selectedId, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedChannel = channels.find(c => c.id === selectedId);
    return (
        <div className="relative">
            <div onClick={() => setIsOpen(!isOpen)} className="clean-input rounded p-2 text-xs flex justify-between cursor-pointer items-center"><span className={selectedChannel ? 'text-white' : 'text-neutral-500'}>{selectedChannel ? `#${selectedChannel.name}` : "Sélectionner un salon..."}</span><ChevronDown size={12} /></div>
            {isOpen && (<div className="absolute top-full left-0 w-full bg-[#111] border border-[#333] rounded mt-1 z-50 max-h-40 overflow-auto shadow-xl">{channels.map(c => (<div key={c.id} onClick={() => { onChange(c.id); setIsOpen(false); }} className="p-2 hover:bg-[#222] text-xs text-neutral-300 cursor-pointer flex gap-2 items-center"><Hash size={12} className="text-neutral-500" /> {c.name}</div>))}</div>)}
        </div>
    );
}

export function ModCard({ title, count, icon, onClick }) {
    return (<div onClick={onClick} className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-8 flex flex-col items-center text-center hover:border-white/20 transition-all group relative overflow-hidden cursor-pointer"> <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div> <div className="mb-4 p-4 rounded-full bg-[#111] border border-[#222] group-hover:scale-110 transition-transform">{icon}</div> <h3 className="text-4xl font-bold text-white mb-1">{count}</h3> <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-8">{title}</p> <div className="w-full py-3 rounded-lg border border-[#333] hover:bg-white hover:text-black hover:border-white transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">Accéder <ArrowRight size={14} /></div> </div>);
}

export function ModuleCard({ title, desc, icon, active, loading, onToggle, onConfigure, color }) {
    const colors = { emerald: "text-emerald-500 bg-emerald-500/10", blue: "text-blue-500 bg-blue-500/10", purple: "text-purple-500 bg-purple-500/10", orange: "text-orange-500 bg-orange-500/10", white: "text-white bg-white/10" };
    const activeClass = colors[color] || colors.emerald;
    return (
        <div className={`bg-[#0a0a0a] border ${active ? 'border-neutral-700' : 'border-[#1f1f1f]'} rounded-xl p-6 transition-all duration-300 relative group flex flex-col h-full`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${active ? activeClass : 'text-neutral-500 bg-neutral-900'}`}>{icon}</div>
                <button onClick={onToggle} disabled={loading} className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none ${active ? 'bg-white' : 'bg-[#1f1f1f]'}`}>
                    <motion.div layout transition={{ type: "spring", stiffness: 700, damping: 30 }} className={`absolute top-1 w-4 h-4 rounded-full shadow-md ${active ? 'left-[26px] bg-black' : 'left-1 bg-neutral-500'}`}>{loading && <Loader2 size={12} className="animate-spin absolute top-0.5 left-0.5" />}</motion.div>
                </button>
            </div>
            <h3 className="font-bold text-xl mb-2 text-white">{title}</h3>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6 flex-1">{desc}</p>
            <div className="flex items-center justify-between pt-4 border-t border-[#1f1f1f] mt-auto">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-neutral-800'}`}></div><span className={active ? 'text-white' : 'text-neutral-600'}>{active ? 'Activé' : 'Désactivé'}</span></div>
                {active && onConfigure && (<button onClick={onConfigure} className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white bg-[#111] hover:bg-[#222] px-3 py-1.5 rounded-lg border border-[#222] transition-colors"><Settings size={12} /> Configurer</button>)}
            </div>
        </div>
    );
}

export function ModuleEditor({ module, config, channels, roles, onSave }) {
    // State générique pour gérer tous les champs
    const [localConfig, setLocalConfig] = useState(config);

    const handleChange = (field, value) => {
        const newData = { ...localConfig, [field]: value };
        setLocalConfig(newData);
        onSave(module, { [field]: value });
    };

    // --- RENDU SPÉCIFIQUE ANTI-SPAM ---
    if (module === 'antispam') {
        return (
            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-8 max-w-2xl">
                <div className="mb-8 pb-6 border-b border-[#1f1f1f]">
                    <h3 className="text-2xl font-bold text-white mb-2">Configuration Anti-Spam</h3>
                    <p className="text-neutral-400 text-sm">Définissez la sensibilité du filtre et les exceptions.</p>
                </div>
                
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Limite de messages</label>
                            <input type="number" min="1" max="20" 
                                value={localConfig.messageLimit} 
                                onChange={(e) => handleChange('messageLimit', e.target.value)} 
                                className="clean-input w-full p-2 rounded text-sm" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Temps (ms)</label>
                            <input type="number" min="1000" step="500" 
                                value={localConfig.timeWindow} 
                                onChange={(e) => handleChange('timeWindow', e.target.value)} 
                                className="clean-input w-full p-2 rounded text-sm" 
                            />
                            <p className="text-[9px] text-neutral-600 mt-1">{localConfig.timeWindow / 1000} secondes</p>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Salons ignorés (Whitelist)</label>
                        <MultiSelect options={channels} selectedIds={localConfig.ignoredChannelIds} onChange={(val) => handleChange('ignoredChannelIds', val)} placeholder="Sélectionner des salons..." type="channel" />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Rôles ignorés (Whitelist)</label>
                        <MultiSelect options={roles} selectedIds={localConfig.ignoredRoleIds} onChange={(val) => handleChange('ignoredRoleIds', val)} placeholder="Sélectionner des rôles..." type="role" />
                    </div>
                </div>
                <div className="pt-6 flex items-center gap-2 text-emerald-500 text-xs font-bold border-t border-[#1f1f1f] mt-6">
                    <Check size={14}/> Enregistrement automatique
                </div>
            </motion.div>
        );
    }

    // --- RENDU PAR DÉFAUT (WELCOME / LOGS) ---
    const titles = { welcome: "Paramètres de Bienvenue", logs: "Paramètres des Logs" };
    const descs = { welcome: "Salon d'arrivée des membres.", logs: "Salon pour les rapports de modération." };

    return (
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-8 max-w-2xl">
            <div className="mb-8 pb-6 border-b border-[#1f1f1f]">
                <h3 className="text-2xl font-bold text-white mb-2">{titles[module]}</h3>
                <p className="text-neutral-400 text-sm">{descs[module]}</p>
            </div>
            <div className="space-y-6">
                <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 block flex items-center gap-2"><Hash size={14}/> Salon de destination</label>
                    <CustomChannelSelect channels={channels} selectedId={localConfig.channelId} onChange={(val) => handleChange('channelId', val)} />
                </div>
                <div className="pt-4 flex items-center gap-2 text-emerald-500 text-xs font-bold">
                    <Check size={14}/> Modifications enregistrées automatiquement
                </div>
            </div>
        </motion.div>
    );
}

export function MultiSelect({ options, selectedIds, onChange, placeholder, type = 'text' }) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (id) => {
        const current = selectedIds || [];
        if (current.includes(id)) {
            onChange(current.filter(item => item !== id));
        } else {
            onChange([...current, id]);
        }
    };

    return (
        <div className="relative">
            <div onClick={() => setIsOpen(!isOpen)} className="clean-input rounded p-2 text-xs cursor-pointer flex justify-between items-center min-h-[34px]">
                <div className="flex flex-wrap gap-1">
                    {selectedIds?.length > 0 ? (
                        selectedIds.map(id => {
                            const opt = options.find(o => o.id === id);
                            return (
                                <span key={id} className="bg-[#222] border border-[#333] px-1.5 rounded text-[10px] flex items-center gap-1">
                                    {type === 'role' && opt?.color && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: opt.color }}></div>}
                                    {opt?.name || id}
                                </span>
                            );
                        })
                    ) : (
                        <span className="text-neutral-500">{placeholder}</span>
                    )}
                </div>
                <ChevronDown size={12} />
            </div>
            {isOpen && (
                <div className="absolute top-full left-0 w-full bg-[#111] border border-[#333] rounded mt-1 z-50 max-h-40 overflow-auto shadow-xl">
                    {options.map(opt => (
                        <div key={opt.id} onClick={() => toggleOption(opt.id)} className="p-2 hover:bg-[#222] text-xs text-neutral-300 cursor-pointer flex gap-2 items-center justify-between">
                            <div className="flex items-center gap-2">
                                {type === 'role' && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color || '#fff' }}></div>}
                                {type === 'channel' && <Hash size={12} className="text-neutral-500" />}
                                {opt.name}
                            </div>
                            {selectedIds?.includes(opt.id) && <Check size={12} className="text-emerald-500" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}