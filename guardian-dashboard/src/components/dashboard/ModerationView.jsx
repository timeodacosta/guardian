import { ArrowLeft, TriangleAlert, ArrowRight, Trash2, Gavel, Mail, FileText, Clock, Ban, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Toggle, CustomChannelSelect } from './DashboardUI';

export default function ModerationView({
    modView, setModView, modSubTab,
    warns, bans, kicks,
    selectedUserWarns, setSelectedUserWarns,
    warnConfig, setWarnConfig,
    triggerSaveBar, handleDeleteWarn, handleDeleteBan, channels, handleSyncBans, guildName
}) {

    // FONCTION HELPER POUR AFFICHER UNE GRILLE (WARNS ou BANS)
    const renderGrid = (data, type) => {
        if (data.length === 0) {
            return (
                <div className="flex flex-col items-center gap-6">
                    <div className="p-20 text-center text-neutral-500 border border-dashed border-[#1f1f1f] rounded-xl bg-[#0a0a0a] w-full">
                        Aucun {type === 'warn' ? 'avertissement' : 'bannissement'} enregistré.
                    </div>

                    {/* BLOC SPÉCIAL POUR LA SYNCHRO DES BANS */}
                    {type === 'ban' && (
                        <div className="flex flex-col items-center gap-3 animate-pulse-once">
                            <p className="text-neutral-400 text-sm">Vous ne voyez pas les bannissements de votre serveur ?</p>
                            <button
                                onClick={handleSyncBans}
                                className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold hover:bg-neutral-200 transition-colors shadow-lg shadow-white/10"
                            >
                                <RefreshCw size={14} id="sync-btn-icon" /> Synchroniser {guildName} avec Guardian
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        // Le reste de renderGrid reste identique (le return <div className="grid ..."> ... )
        const grouped = Object.values(data.reduce((acc, item) => {
            // ... (ton code existant pour le reduce)
            if (!acc[item.userId]) { acc[item.userId] = { userId: item.userId, userTag: item.userTag, userAvatar: item.userAvatar, count: 0, lastDate: item.createdAt }; }
            acc[item.userId].count++;
            if (new Date(item.createdAt) > new Date(acc[item.userId].lastDate)) acc[item.userId].lastDate = item.createdAt;
            return acc;
        }, {}));

        return (
            <div className="space-y-4">
                {/* On peut aussi mettre le bouton Sync même s'il y a déjà des bans, au cas où */}
                {type === 'ban' && (
                    <div className="flex justify-end mb-2">
                        <button onClick={handleSyncBans} className="flex items-center gap-2 text-neutral-500 hover:text-white text-xs font-bold transition-colors">
                            <RefreshCw size={12} /> Sync Discord
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* ... ton map des cards ... */}
                    {grouped.map(user => (
                        <div key={user.userId} onClick={() => setSelectedUserWarns({ id: user.userId, type: type })} className="bg-[#0a0a0a] border border-[#1f1f1f] p-5 rounded-xl hover:border-white/20 hover:bg-[#111] transition-all cursor-pointer group flex items-center gap-4">
                            <div className="relative">
                                {user.userAvatar ? (<img src={user.userAvatar} alt={user.userTag} className="w-12 h-12 rounded-full border border-[#333]" />) : (<div className="w-12 h-12 bg-[#222] rounded-full flex items-center justify-center font-bold text-white border border-[#333]">{user.userTag.charAt(0)}</div>)}
                                <div className={`absolute -top-1 -right-1 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#0a0a0a] ${type === 'warn' ? 'bg-orange-500' : 'bg-red-600'}`}>{user.count}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">{user.userTag}</div>
                                <div className="text-[10px] text-neutral-500 font-mono mt-0.5">Dernier : {new Date(user.lastDate).toLocaleDateString()}</div>
                            </div>
                            <ArrowRight size={16} className="text-neutral-600 group-hover:text-white transition-colors" />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // FONCTION HELPER POUR AFFICHER LE DÉTAIL
    const renderDetail = (userId, type) => {
        const sourceData = type === 'warn' ? warns : bans;
        const userRecords = sourceData.filter(w => w.userId === userId);
        const deleteFunc = type === 'warn' ? handleDeleteWarn : handleDeleteBan;
        const userTag = userRecords[0]?.userTag || userId;

        return (
            <div className="space-y-4">
                <button onClick={() => setSelectedUserWarns(null)} className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-2"><ArrowLeft size={14} /> Retour à la liste</button>
                <div className="border border-[#1f1f1f] rounded-xl overflow-hidden bg-[#0a0a0a]">
                    <div className="p-4 border-b border-[#1f1f1f] bg-[#111] flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            {type === 'warn' ? <TriangleAlert size={16} className="text-orange-500" /> : <Ban size={16} className="text-red-500" />}
                            Dossier : {userTag}
                        </h3>
                        <span className="text-xs text-neutral-500 font-mono">ID: {userId}</span>
                    </div>
                    <table className="w-full text-left">
                        <thead className="text-[10px] uppercase text-neutral-500 font-bold bg-[#0f0f0f] border-b border-[#1f1f1f]">
                            <tr><th className="p-4 pl-6">Raison</th><th className="p-4">Modérateur</th><th className="p-4">Date</th><th className="p-4 text-right pr-6">Action</th></tr>
                        </thead>
                        <tbody className="text-sm">
                            {userRecords.map(item => (
                                <tr key={item.id} className="border-b border-[#1f1f1f] last:border-0 hover:bg-[#111] transition-colors">
                                    <td className="p-4 pl-6"><span className="text-neutral-300 font-mono text-xs bg-[#1a1a1a] border border-[#222] rounded px-2 py-1">{item.reason}</span></td>
                                    <td className="p-4"><div className="flex items-center gap-2"><div className="w-5 h-5 bg-[#222] rounded-full flex items-center justify-center text-[8px] text-neutral-400">{item.modTag ? item.modTag.charAt(0) : '?'}</div><span className="text-neutral-400 text-xs">{item.modTag || 'Inconnu'}</span></div></td>
                                    <td className="p-4 text-neutral-500 text-xs">{new Date(item.createdAt).toLocaleString('fr-FR')}</td>
                                    <td className="p-4 text-right pr-6">
                                        <button onClick={() => deleteFunc(item.id)} className="p-2 hover:bg-red-500/10 text-neutral-500 hover:text-red-500 rounded transition-colors" title={type === 'warn' ? "Supprimer" : "Révoquer le ban"}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // --- RENDU PRINCIPAL ---
    if (modSubTab === 'history') {
        return (
            <motion.div key="mod-list" initial={{ opacity: 0 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">

                {/* VUE WARNS */}
                {modView === 'warns' && (
                    !selectedUserWarns ? renderGrid(warns, 'warn') : renderDetail(selectedUserWarns.id || selectedUserWarns, 'warn')
                )}

                {/* VUE BANS */}
                {modView === 'bans' && (
                    !selectedUserWarns ? renderGrid(bans, 'ban') : renderDetail(selectedUserWarns.id || selectedUserWarns, 'ban')
                )}

                {/* VUE KICKS (Pas encore implémentée coté DB) */}
                {modView === 'kicks' && <div className="p-20 text-center text-neutral-500 border border-dashed border-[#1f1f1f] rounded-xl bg-[#0a0a0a]">Historique des expulsions non disponible (logs Discord uniquement).</div>}
            </motion.div>
        );
    }

    // --- CONFIGURATION ---
    if (modSubTab === 'config') {
        return (
            <motion.div key="mod-config" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={modView === 'warns' ? "grid grid-cols-1 md:grid-cols-2 gap-8 items-start" : "w-full"}>
                {modView === 'warns' ? (
                    <>
                        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-6">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Gavel size={18} /> Auto-Sanctions</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Expulsion (Kick) après</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={warnConfig.autoKickCount}
                                            onChange={(e) => onConfigChange('autoKickCount', e.target.value)} // Utilise la nouvelle fonction
                                            min="0"
                                        />
                                        <span className="text-sm text-neutral-400">avertissements</span>
                                    </div>
                                    <p className="text-[10px] text-neutral-600 mt-1">Mettre 0 pour désactiver.</p>
                                </div>
                                <div className="pt-4 border-t border-[#1f1f1f]">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Bannissement après</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={warnConfig.autoBanCount}
                                            onChange={(e) => onConfigChange('autoBanCount', e.target.value)} // Utilise la nouvelle fonction
                                            min="0"
                                            className="clean-input w-20 p-2 rounded text-sm text-center"
                                        />
                                        <span className="text-sm text-neutral-400">avertissements</span>
                                    </div>
                                    <p className="text-[10px] text-neutral-600 mt-1">Mettre 0 pour désactiver.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-6">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Mail size={18} /> Notifications</h3>
                                <Toggle label="Envoyer un MP au membre" checked={warnConfig.dmUser} onChange={() => setWarnConfig({ ...warnConfig, dmUser: !warnConfig.dmUser })} />
                                <p className="text-[10px] text-neutral-500 mt-3">Si activé, le bot enverra un message privé contenant la raison de l'avertissement.</p>
                            </div>
                            <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-6">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><FileText size={18} /> Logs Publiques</h3>
                                <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Salon des logs</label>
                                <CustomChannelSelect channels={channels} selectedId={warnConfig.logChannelId} onChange={(id) => setWarnConfig({ ...warnConfig, logChannelId: id })} />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center p-20 border border-dashed border-[#1f1f1f] rounded-xl bg-[#0a0a0a] text-center w-full">
                        <div className="w-16 h-16 bg-[#111] rounded-full flex items-center justify-center mb-4 border border-[#222]"><Clock size={32} className="text-neutral-500" /></div>
                        <h3 className="text-xl font-bold text-white mb-2">Pas de configuration requise</h3>
                        <p className="text-neutral-500 max-w-md">Les bannissements et expulsions sont gérés nativement par Discord ou via les commandes.</p>
                    </div>
                )}
            </motion.div>
        );
    }
    return null;
}