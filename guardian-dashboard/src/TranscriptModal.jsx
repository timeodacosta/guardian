import { X, Bot, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_URL } from './config';

function TranscriptModal({ channelId, onClose }) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`${API_URL}/api/ticket-messages/${channelId}`)
            .then(res => {
                if (!res.ok) throw new Error("Impossible de charger les messages.");
                return res.json();
            })
            .then(data => {
                setMessages(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [channelId]);

    const formatDiscordDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-[#313338] w-full max-w-4xl h-[85vh] rounded-lg shadow-2xl flex flex-col overflow-hidden border border-[#1e1f22]">

                {/* HEADER */}
                <div className="bg-[#2b2d31] p-4 flex justify-between items-center border-b border-[#1e1f22]">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <span className="text-gray-400 text-2xl">#</span> Historique du ticket
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
                </div>

                {/* CHAT */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[#313338]">
                    {loading ? (
                        <div className="text-center text-gray-400 mt-20">Chargement...</div>
                    ) : error ? (
                        <div className="text-center text-red-400 mt-20">{error}</div>
                    ) : (
                        messages.map((msg, index) => {
                            const isSequence = index > 0 && messages[index - 1].author.username === msg.author.username && (new Date(msg.timestamp) - new Date(messages[index - 1].timestamp) < 300000); // 5 min grouping

                            return (
                                <div key={msg.id} className={`group flex gap-4 ${isSequence ? 'mt-1' : 'mt-5'} hover:bg-[#2e3035]/50 -mx-2 px-2 py-1 rounded`}>

                                    {/* AVATAR */}
                                    <div className="w-10 flex-shrink-0 pt-0.5">
                                        {!isSequence && (
                                            <img src={msg.author.avatar} className="w-10 h-10 rounded-full hover:opacity-80 cursor-pointer" />
                                        )}
                                        {isSequence && <div className="text-[10px] text-gray-500 hidden group-hover:block w-full text-right pr-1 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                                    </div>

                                    {/* MESSAGE CONTENT */}
                                    <div className="flex-1 min-w-0">
                                        {!isSequence && (
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`font-medium hover:underline cursor-pointer ${msg.author.bot ? 'text-white' : 'text-white'}`}>
                                                    {msg.author.username}
                                                </span>
                                                {msg.author.bot && <span className="bg-[#5865F2] text-white text-[10px] px-1.5 rounded flex items-center gap-1 h-4 font-bold"><Bot size={10} /> BOT</span>}
                                                <span className="text-xs text-gray-400 ml-1">{formatDiscordDate(msg.timestamp)}</span>
                                            </div>
                                        )}

                                        {/* TEXTE */}
                                        {msg.content && <div className="text-[#dcddde] text-[15px] whitespace-pre-wrap leading-6">{msg.content}</div>}

                                        {/* PIÈCES JOINTES */}
                                        {msg.attachments?.map((url, i) => (
                                            <img key={i} src={url} className="mt-2 max-w-sm max-h-60 rounded-lg border border-[#2b2d31]" />
                                        ))}

                                        {/* EMBEDS */}
                                        {msg.embeds?.map((embed, i) => <DiscordEmbed key={i} embed={embed} />)}

                                        {/* BOUTONS (COMPONENTS) */}
                                        {msg.components?.length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                {msg.components.map((row, i) => (
                                                    <div key={i} className="flex flex-wrap gap-2">
                                                        {row.components.map((btn, j) => <DiscordButton key={j} btn={btn} />)}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

// --- SOUS-COMPOSANT : EMBED ---
function DiscordEmbed({ embed }) {
    // Convertir la couleur Integer en Hex CSS
    const colorHex = embed.color ? `#${embed.color.toString(16).padStart(6, '0')}` : '#1e1f22';

    return (
        <div className="mt-2 bg-[#2b2d31] border-l-4 rounded flex max-w-[520px]" style={{ borderLeftColor: colorHex }}>
            <div className="p-4 grid gap-2 w-full">
                {/* Author */}
                {embed.author && <div className="text-sm font-bold text-white">{embed.author.name}</div>}

                {/* Title */}
                {embed.title && <div className="text-base font-bold text-white mb-1">{embed.title}</div>}

                {/* Description */}
                {embed.description && <div className="text-sm text-[#dcddde] whitespace-pre-wrap">{embed.description}</div>}

                {/* Fields */}
                {embed.fields?.length > 0 && (
                    <div className="grid grid-cols-12 gap-2 mt-1">
                        {embed.fields.map((field, i) => (
                            <div key={i} className={`${field.inline ? 'col-span-4' : 'col-span-12'}`}>
                                <div className="text-xs font-bold text-white mb-1">{field.name}</div>
                                <div className="text-sm text-[#dcddde] whitespace-pre-wrap">{field.value}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Image principale */}
                {embed.image && (
                    <img src={embed.image.url} className="mt-2 rounded-lg max-w-full max-h-60 object-cover" />
                )}

                {/* Footer */}
                {(embed.footer || embed.timestamp) && (
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        {embed.footer?.text}
                        {embed.footer && embed.timestamp && <span>•</span>}
                        {embed.timestamp && <span>{new Date(embed.timestamp).toLocaleDateString()}</span>}
                    </div>
                )}
            </div>
            {/* Thumbnail (Image à droite) */}
            {embed.thumbnail && (
                <div className="p-4 pl-0">
                    <img src={embed.thumbnail.url} className="max-w-[80px] max-h-[80px] rounded" />
                </div>
            )}
        </div>
    )
}

// --- SOUS-COMPOSANT : BOUTON ---
function DiscordButton({ btn }) {
    // Styles Discord : 1=Blurple, 2=Grey, 3=Green, 4=Red, 5=Link
    const styles = {
        1: "bg-[#5865F2] hover:bg-[#4752C4] text-white", // Primary
        2: "bg-[#4e5058] hover:bg-[#6d6f78] text-white", // Secondary
        3: "bg-[#248046] hover:bg-[#1a6334] text-white", // Success
        4: "bg-[#DA373C] hover:bg-[#a1282c] text-white", // Danger
        5: "bg-[#4e5058] hover:bg-[#6d6f78] text-white", // Link (Fallback style)
    };

    const styleClass = styles[btn.style] || styles[2];
    const disabledClass = btn.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

    return (
        <button
            disabled={true} // Toujours désactivé car c'est un transcript
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${styleClass} ${disabledClass} bg-opacity-90`}
        >
            {btn.emoji && <span>{btn.emoji.name}</span>}
            {btn.label}
            {btn.style === 5 && <ExternalLink size={12} />}
        </button>
    )
}

export default TranscriptModal;