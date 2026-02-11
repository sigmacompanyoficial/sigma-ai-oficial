'use client';
import { useState, useRef, useEffect } from 'react';
import {
    Plus, Search, Image as ImageIcon, X,
    ChevronDown, Settings, Mic, Send, User, Bot, Sparkles, MessageSquare, LogOut, Camera,
    Copy, Check, Trash2, AlertCircle, Upload,
    ThumbsUp, ThumbsDown, Share, RotateCcw, MoreHorizontal
} from 'lucide-react';
import MarkdownIt from 'markdown-it';
import { full as emoji } from 'markdown-it-emoji';
import hljs from 'markdown-it-highlightjs';
import 'highlight.js/styles/github-dark.css';
import { models } from '@/lib/models';
import supabase from '@/lib/supabaseClient';
import styles from './page.module.css';

// Enhanced markdown-it configuration
const md = new MarkdownIt({
    html: false,
    breaks: true,
    linkify: true,
    typographer: true,
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(str, { language: lang }).value;
            } catch (__) { }
        }
        return '';
    }
});
md.use(emoji);
md.use(hljs);

export default function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [selectedModel, setSelectedModel] = useState(models[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [error, setError] = useState(null);

    // User Profile States
    const [userName, setUserName] = useState('Ayoub Louah');
    const [userRole, setUserRole] = useState('Admin @ Sigma');
    const [botName, setBotName] = useState('Sigma AI');
    const [profilePic, setProfilePic] = useState('');
    const [systemInstructions, setSystemInstructions] = useState('Mantén un tono profesional y amigable. Explica conceptos técnicos de forma simple.');
    const [useEmojis, setUseEmojis] = useState(true);
    const [copiedId, setCopiedId] = useState(null);

    // Image upload states
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isProcessingImage, setIsProcessingImage] = useState(false);

    const [savedChats, setSavedChats] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [user, setUser] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [messageFeedback, setMessageFeedback] = useState({}); // { index: 'like' | 'dislike' }
    const chatContainerRef = useRef(null);
    const isAtBottomRef = useRef(true);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleScroll = () => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            // Threshold of 100px to consider "at bottom"
            const atBottom = scrollHeight - scrollTop <= clientHeight + 100;
            isAtBottomRef.current = atBottom;
        }
    };

    const scrollToBottom = (behavior = "auto", force = false) => {
        if (chatContainerRef.current && (isAtBottomRef.current || force)) {
            const container = chatContainerRef.current;
            if (behavior === "smooth") {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: "smooth"
                });
            } else {
                container.scrollTop = container.scrollHeight;
            }
        }
    };

    // Improved auto-scroll logic
    useEffect(() => {
        if (isLoading) {
            scrollToBottom("auto");
        } else if (messages.length > 0) {
            scrollToBottom("smooth");
        }
    }, [messages]);

    useEffect(() => {
        setMounted(true);
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const urlParams = new URLSearchParams(window.location.search);
            const chatIdFromUrl = urlParams.get('id');

            if (!user) {
                // If there's a chat ID, we definitely want them to login first
                if (chatIdFromUrl) {
                    window.location.href = `/login?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`;
                    return;
                }
                // Regular access to chat without session -> login
                window.location.href = '/login';
                return;
            }

            setUser(user);
            if (user) {
                fetchChats(user.id);
                const saved = localStorage.getItem(`sigma_settings_${user.id}`);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    setUserName(parsed.userName || userName);
                    setBotName(parsed.botName || botName);
                    setProfilePic(parsed.profilePic || profilePic);
                    setUseEmojis(parsed.useEmojis !== undefined ? parsed.useEmojis : true);
                    setSystemInstructions(parsed.systemInstructions || systemInstructions);
                }

                if (chatIdFromUrl) {
                    loadChat(chatIdFromUrl, user.id);
                }
            }
        };
        checkUser();
    }, []);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [input]);

    const fetchChats = async (userId) => {
        const { data } = await supabase
            .from('chats')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (data) setSavedChats(data);
    };

    // Handle image selection
    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Por favor selecciona un archivo de imagen válido');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            setError('La imagen es demasiado grande. Máximo 10MB');
            return;
        }

        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
        setError(null);
    };

    // Remove selected image
    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Process image with vision model
    const processImageWithVision = async (imageBase64, userPrompt) => {
        console.log('📸 Starting Vision Analysis...');
        try {
            setIsProcessingImage(true);

            const response = await fetch('/api/vision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageBase64: imageBase64.split(',')[1],
                    prompt: userPrompt
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Vision API Error:', errorData);
                throw new Error(errorData.error || 'Error al analizar');
            }

            const data = await response.json();
            console.log('✅ Vision Analysis Complete:', data.description?.substring(0, 50) + '...');
            return data.description;
        } catch (error) {
            console.error('❌ Vision Process Error:', error);
            throw error;
        } finally {
            setIsProcessingImage(false);
        }
    };


    const handleSend = async (e) => {
        e?.preventDefault();
        console.log('🚀 handleSend triggered. Input:', input.substring(0, 20), 'Image:', !!selectedImage);
        if ((!input.trim() && !selectedImage) || isLoading) return;

        const userPrompt = input.trim();
        const hasImage = selectedImage && imagePreview;

        // Clear input immediately
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            let finalContent = userPrompt;
            let userMessageData = { role: 'user', content: userPrompt || "¿Qué hay en esta imagen?" };

            // Handle image if present
            if (hasImage) {
                userMessageData.image = imagePreview;
                console.log('🖼️ Processing image before sending...');
                const imageDesc = await processImageWithVision(imagePreview, userPrompt);
                finalContent = `Imagen: ${imageDesc}\n\nPregunta: ${userPrompt || "Explícame qué hay en esta imagen."}`;
                removeImage();
            }

            // Add user message
            setMessages(prev => [...prev, userMessageData]);
            // Force scroll to bottom for new message
            setTimeout(() => scrollToBottom("auto", true), 10);

            // Add bot placeholder
            setMessages(prev => [...prev, { role: 'assistant', content: '...' }]);

            // Get messages for API
            const apiMessages = hasImage
                ? [{ role: 'user', content: finalContent }]
                : [...messages, { role: 'user', content: finalContent }];

            console.log('📡 Calling Chat API with', apiMessages.length, 'messages');

            // Call chat API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: apiMessages,
                    modelId: selectedModel.modelId,
                    systemPrompt: systemInstructions,
                    botName: botName,
                    stream: true
                }),
            });

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Límite de peticiones alcanzado. Por favor, espera un minuto o prueba con otro modelo.');
                }
                console.error('❌ Chat API HTTP Error:', response.status);
                throw new Error('Error al obtener respuesta');
            }

            console.log('📥 Receiving stream...');
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let botResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '').trim();
                        if (dataStr === '[DONE]') break;
                        try {
                            const json = JSON.parse(dataStr);
                            const delta = json.choices?.[0]?.delta?.content || '';
                            botResponse += delta;

                            setMessages(prev => {
                                const updated = [...prev];
                                updated[updated.length - 1].content = botResponse;
                                return updated;
                            });
                        } catch (e) {
                            // Ignore parse errors
                        }
                    }
                }
            }

            console.log('✅ Stream finished. Content length:', botResponse.length);

            // Check for search intent
            if (botResponse.includes('SEARCH:')) {
                console.log('🔎 Search intent detected in:', botResponse);
                const searchMatch = botResponse.match(/SEARCH:\s*(.+?)(?:\n|$)/);
                if (searchMatch) {
                    const searchQuery = searchMatch[1].trim();
                    console.log('🌐 Searching for:', searchQuery);

                    setMessages(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1].content = '🔍 Buscando en internet...';
                        return updated;
                    });

                    const searchRes = await fetch('/api/search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: searchQuery })
                    });

                    const searchData = await searchRes.json();
                    console.log('📡 Search API Results:', searchData);

                    if (searchData.success) {
                        const contextPrompt = `Información encontrada en la web: ${searchData.result}\n\nAhora responde de forma amigable la pregunta original del usuario con esta información.`;
                        console.log('🔄 Sending search results back to AI...');

                        const followUpRes = await fetch('/api/chat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                messages: [
                                    ...apiMessages,
                                    { role: 'assistant', content: botResponse },
                                    { role: 'user', content: contextPrompt }
                                ],
                                modelId: selectedModel.modelId,
                                systemPrompt: systemInstructions,
                                botName: botName,
                                stream: true
                            }),
                        });

                        if (followUpRes.ok) {
                            const fReader = followUpRes.body.getReader();
                            const fDecoder = new TextDecoder();
                            let finalResponse = '';

                            while (true) {
                                const { done, value } = await fReader.read();
                                if (done) break;

                                const chunk = fDecoder.decode(value, { stream: true });
                                const lines = chunk.split('\n');

                                for (const line of lines) {
                                    if (line.startsWith('data: ')) {
                                        const dataStr = line.replace('data: ', '').trim();
                                        if (dataStr === '[DONE]') break;
                                        try {
                                            const json = JSON.parse(dataStr);
                                            const delta = json.choices?.[0]?.delta?.content || '';
                                            finalResponse += delta;

                                            setMessages(prev => {
                                                const updated = [...prev];
                                                updated[updated.length - 1].content = finalResponse;
                                                return updated;
                                            });
                                        } catch (e) {
                                            // Ignore
                                        }
                                    }
                                }
                            }
                            botResponse = finalResponse;
                            console.log('✅ Final response after search complete.');
                        }
                    } else {
                        console.warn('⚠️ Search returned no results.');
                        setMessages(prev => {
                            const updated = [...prev];
                            updated[updated.length - 1].content = 'No encontré información reciente, pero te diré lo que sé.';
                            return updated;
                        });
                    }
                }
            }

            // Save to database
            if (user) {
                let chatId = currentChatId;
                if (!chatId) {
                    console.log('📁 Creating new chat session...');
                    chatId = await saveNewChat(userPrompt.substring(0, 50) || 'Nueva conversación');
                }
                if (chatId) {
                    console.log('💾 Saving messages to Chat ID:', chatId);
                    await saveMessages(chatId, userPrompt, botResponse, hasImage ? imagePreview : null);
                }
            }

        } catch (error) {
            console.error('💥 Critical Error in handleSend:', error);
            setError(error.message);
            setMessages(prev => {
                const updated = [...prev];
                if (updated[updated.length - 1]?.role === 'assistant') {
                    updated[updated.length - 1].content = `❌ Error: ${error.message}`;
                }
                return updated;
            });
        } finally {
            setIsLoading(false);
            console.log('⏹️ Process finished.');
        }
    };



    const saveNewChat = async (firstInput) => {
        if (!user) return null;
        console.log('📝 Saving new chat to DB with title:', firstInput.substring(0, 30));
        const title = firstInput.substring(0, 30) + (firstInput.length > 30 ? '...' : '');
        try {
            const { data, error } = await supabase.from('chats').insert([{ user_id: user.id, title: title }]).select();
            if (error) throw error;
            if (data) {
                console.log('✅ Chat created. ID:', data[0].id);
                setCurrentChatId(data[0].id);
                fetchChats(user.id);
                return data[0].id;
            }
        } catch (err) {
            console.error('❌ Error creating chat:', err);
        }
        return null;
    };

    const saveMessages = async (chatId, userContent, assistantContent, userImage = null) => {
        console.log('📝 Saving messages to DB for chat:', chatId);
        try {
            const { error } = await supabase.from('messages').insert([
                {
                    chat_id: chatId,
                    role: 'user',
                    content: userContent,
                    image: userImage
                },
                {
                    chat_id: chatId,
                    role: 'assistant',
                    content: assistantContent
                }
            ]);
            if (error) throw error;
            console.log('✅ Messages saved successfully.');
        } catch (error) {
            console.error('❌ Error saving messages:', error);
        }
    };

    const loadChat = async (chatId, currentUserId) => {
        if (!chatId) return;
        console.log('📂 Loading chat:', chatId);
        setCurrentChatId(chatId);

        // Update URL without reloading
        const newUrl = `${window.location.pathname}?id=${chatId}`;
        window.history.pushState({ path: newUrl }, '', newUrl);

        setIsLoading(true);
        setError(null);
        try {
            // Fetch chat info to check ownership
            const { data: chatData, error: chatError } = await supabase
                .from('chats')
                .select('user_id')
                .eq('id', chatId)
                .single();

            if (chatData) {
                setIsReadOnly(chatData.user_id !== currentUserId);
            }

            const { data: msgData, error: msgError } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true });

            if (msgError) throw msgError;

            if (msgData) {
                setMessages(msgData.map(m => ({
                    role: m.role,
                    content: m.content,
                    image: m.image // Load saved image
                })));
            }
        } catch (err) {
            console.error('Error loading chat:', err);
            setError('No se pudo cargar el chat');
        } finally {
            setIsLoading(false);
            // Focus textarea after loading
            if (!isReadOnly) {
                setTimeout(() => textareaRef.current?.focus(), 100);
            }
        }
    };

    const deleteChat = async (chatId, e) => {
        e.stopPropagation();
        if (!confirm('¿Eliminar este chat?')) return;
        console.log('🗑️ Deleting chat:', chatId);
        try {
            const { error } = await supabase.from('chats').delete().eq('id', chatId);
            if (error) throw error;
            if (currentChatId === chatId) {
                setMessages([]);
                setCurrentChatId(null);
            }
            fetchChats(user.id);
            console.log('✅ Chat deleted.');
        } catch (err) {
            console.error('❌ Error deleting chat:', err);
        }
    };

    const handleLogout = async () => {
        console.log('🚪 Logging out...');
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    const handleShare = (text) => {
        if (!currentChatId) {
            alert('Guarda el chat enviando un mensaje antes de compartir');
            return;
        }
        const shareUrl = `${window.location.origin}${window.location.pathname}?id=${currentChatId}`;
        navigator.clipboard.writeText(shareUrl);
        alert('Enlace del chat copiado al portapapeles');
    };

    const handleFeedback = (index, type) => {
        setMessageFeedback(prev => ({
            ...prev,
            [index]: prev[index] === type ? null : type
        }));
    };

    const handleRegenerate = async (index) => {
        // Find the last user message before this assistant message
        let lastUserMsg = null;
        for (let i = index - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                lastUserMsg = messages[i].content;
                break;
            }
        }

        if (lastUserMsg) {
            setInput(lastUserMsg);
            // We use a timeout to ensure setInput finishes if needed, 
            // but handleSend can take the prompt directly.
            // For simplicity, let's just trigger a new send.
            setTimeout(() => handleSend(), 10);
        }
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const renderMessage = (content) => {
        let finalContent = content;
        if (!useEmojis) {
            finalContent = finalContent.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "");
        }
        return { __html: md.render(finalContent || '') };
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowModelDropdown(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <button className={styles.newChatBtn} onClick={() => {
                    setMessages([]);
                    setCurrentChatId(null);
                    setIsReadOnly(false);
                    // Clear URL ID
                    window.history.pushState({}, '', window.location.pathname);
                    setError(null);
                    setIsLoading(false);
                    setInput('');
                    removeImage();
                    textareaRef.current?.focus();
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)' }}>
                        <Plus size={14} />
                    </div>
                    Nuevo chat
                </button>

                <div className={styles.sidebarSection}>
                    <div className={styles.sidebarLink}><Search size={18} /> Buscar</div>
                    <div className={styles.sidebarLink}><ImageIcon size={18} /> Imágenes</div>

                    <div style={{ marginTop: '2rem' }}>
                        <div className={styles.sidebarHeading}>Historial</div>
                        {savedChats.length > 0 ? (
                            savedChats.map(chat => (
                                <div
                                    key={chat.id}
                                    className={`${styles.sidebarLink} ${currentChatId === chat.id ? styles.sidebarLinkActive : ''}`}
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                    onClick={() => loadChat(chat.id)}
                                >
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.title}</span>
                                    <button onClick={(e) => deleteChat(chat.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '4px' }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '0.5rem', fontSize: '0.8rem', color: '#666' }}>Sin chats guardados</div>
                        )}
                    </div>
                </div>

                <div className={styles.sidebarFooter}>
                    <div className={styles.profileInfo}>
                        {profilePic ? (
                            <img src={profilePic} alt="Profile" className={styles.profileAvatar} style={{ objectFit: 'cover', width: '40px', height: '40px', borderRadius: '50%' }} />
                        ) : (
                            <div className={styles.profileAvatar}>{userName.substring(0, 2).toUpperCase()}</div>
                        )}
                        <div className={styles.profileDetails}>
                            <div className={styles.profileName}>{userName}</div>
                            <div className={styles.profileStatus}>{userRole}</div>
                        </div>
                        <button className={styles.iconBtn} onClick={() => setShowSettings(true)} title="Configuración"><Settings size={18} /></button>
                    </div>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className={styles.main}>
                <header className={styles.header}>
                    <div style={{ position: 'relative' }}>
                        <div className={styles.modelSelector} onClick={() => setShowModelDropdown(!showModelDropdown)} title="Cambiar modelo (Ctrl+K)">
                            {botName} 🤖 <ChevronDown size={16} />
                        </div>
                        {showModelDropdown && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', padding: '0.5rem', width: '320px', zIndex: 100, boxShadow: '0 10px 30px -5px rgba(0,0,0,0.6)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#888', padding: '0.5rem', marginBottom: '0.5rem' }}>Seleccionar Modelo</div>
                                {models.map(m => (
                                    <div
                                        key={m.modelId}
                                        className={styles.sidebarLink}
                                        style={{ background: selectedModel.modelId === m.modelId ? 'rgba(99, 102, 241, 0.2)' : 'transparent', borderLeft: selectedModel.modelId === m.modelId ? '2px solid #6366f1' : '2px solid transparent' }}
                                        onClick={() => { setSelectedModel(m); setShowModelDropdown(false); }}
                                    >
                                        <Sparkles size={14} style={{ color: '#6366f1' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.9rem' }}>{m.modelName}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#888' }}>{m.modelId}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className={styles.headerActions}>
                        <div style={{ background: 'linear-gradient(135deg, #00c853, #00e676)', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '6px', height: '6px', background: 'white', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
                            Online
                        </div>
                        <button className={styles.iconBtn} onClick={() => setShowSettings(true)} title="Configuración"><Settings size={20} /></button>
                    </div>
                </header>

                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px 16px', margin: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={18} color="#ef4444" />
                        <span style={{ color: '#fca5a5', fontSize: '0.9rem' }}>{error}</span>
                    </div>
                )}

                <div className={styles.chatContainer} ref={chatContainerRef} onScroll={handleScroll}>
                    {messages.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🤖</div>
                            <h1 className={styles.emptyTitle}>Hola {userName.split(' ')[0]}, ¿en qué puedo ayudarte hoy?</h1>
                            <p style={{ color: '#888', marginTop: '0.5rem' }}>Modelo activo: {selectedModel.modelName}</p>
                        </div>
                    ) : (
                        <div className={styles.messagesList}>
                            {messages.map((msg, idx) => (
                                <div key={idx} className={styles.message}>
                                    <div className={`${styles.messageAvatar} ${msg.role === 'user' ? styles.userAvatar : styles.botAvatar}`}>
                                        {msg.role === 'user' ? (
                                            profilePic ? <img src={profilePic} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="User" /> : <User size={18} />
                                        ) : <Bot size={18} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        {/* Show image if present */}
                                        {msg.image && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <img
                                                    src={msg.image}
                                                    alt="Uploaded"
                                                    style={{
                                                        maxWidth: '400px',
                                                        width: '100%',
                                                        borderRadius: '12px',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <div className={styles.messageContent} dangerouslySetInnerHTML={renderMessage(msg.content)} />
                                        {msg.role === 'assistant' && msg.content && msg.content !== '...' && (
                                            <div className={styles.messageActions}>
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={() => copyToClipboard(msg.content, idx)}
                                                    title="Copiar"
                                                >
                                                    {copiedId === idx ? <Check size={16} /> : <Copy size={16} />}
                                                </button>
                                                <button
                                                    className={`${styles.actionBtn} ${messageFeedback[idx] === 'like' ? styles.activeAction : ''}`}
                                                    onClick={() => handleFeedback(idx, 'like')}
                                                    title="Buen resultado"
                                                >
                                                    <ThumbsUp size={16} fill={messageFeedback[idx] === 'like' ? 'currentColor' : 'none'} />
                                                </button>
                                                <button
                                                    className={`${styles.actionBtn} ${messageFeedback[idx] === 'dislike' ? styles.activeAction : ''}`}
                                                    onClick={() => handleFeedback(idx, 'dislike')}
                                                    title="Mal resultado"
                                                >
                                                    <ThumbsDown size={16} fill={messageFeedback[idx] === 'dislike' ? 'currentColor' : 'none'} />
                                                </button>
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={() => handleShare(msg.content)}
                                                    title="Exportar"
                                                >
                                                    <Share size={16} />
                                                </button>
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={() => handleRegenerate(idx)}
                                                    title="Regenerar"
                                                >
                                                    <RotateCcw size={16} />
                                                </button>
                                                <button className={styles.actionBtn} title="Más"><MoreHorizontal size={16} /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                <div className={styles.inputSection}>
                    {isReadOnly ? (
                        <div style={{
                            padding: '1.5rem',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '1rem',
                            border: '1px solid rgba(255,255,255,0.05)',
                            color: '#888',
                            fontSize: '0.9rem',
                            textAlign: 'center',
                            width: '100%',
                            maxWidth: '768px'
                        }}>
                            🔒 Esta conversación es de solo lectura porque pertenece a otro usuario.
                        </div>
                    ) : (
                        <>
                            {/* Image Preview */}
                            {imagePreview && (
                                <div style={{
                                    maxWidth: '768px',
                                    width: '100%',
                                    marginBottom: '12px',
                                    position: 'relative',
                                    animation: 'fadeIn 0.3s ease-out'
                                }}>
                                    <div style={{
                                        position: 'relative',
                                        display: 'inline-block',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '12px',
                                        padding: '8px',
                                        border: '1px solid rgba(99, 102, 241, 0.3)'
                                    }}>
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            style={{
                                                maxWidth: '200px',
                                                maxHeight: '200px',
                                                borderRadius: '8px',
                                                display: 'block'
                                            }}
                                        />
                                        <button
                                            onClick={removeImage}
                                            style={{
                                                position: 'absolute',
                                                top: '4px',
                                                right: '4px',
                                                background: 'rgba(239, 68, 68, 0.9)',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '28px',
                                                height: '28px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                color: 'white',
                                                transition: 'transform 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            <X size={16} />
                                        </button>
                                        {isProcessingImage && (
                                            <div className={styles.shimmer} style={{
                                                position: 'absolute',
                                                inset: 0,
                                                borderRadius: '8px',
                                                pointerEvents: 'none'
                                            }} />
                                        )}
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSend} className={styles.inputWrapper}>
                                {/* Hidden file input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    style={{ display: 'none' }}
                                />

                                <button
                                    type="button"
                                    className={styles.attachButton}
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Subir imagen (analizada con IA)"
                                    disabled={isLoading || isProcessingImage}
                                >
                                    <ImageIcon size={20} />
                                </button>
                                <textarea
                                    ref={textareaRef}
                                    className={styles.textarea}
                                    placeholder={selectedImage ? "Describe qué quieres saber de la imagen..." : `Mensaje a ${botName}...`}
                                    rows={1}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend(e);
                                        }
                                    }}
                                    disabled={isLoading}
                                />
                                <div className={styles.inputActions}>
                                    <button type="button" className={styles.iconBtn} title="Voz (próximamente)"><Mic size={20} /></button>
                                    <button
                                        type="submit"
                                        className={styles.sendBtn}
                                        disabled={isLoading || (!input.trim() && !selectedImage) || isProcessingImage}
                                        style={{
                                            background: (input.trim() || selectedImage) && !isLoading && !isProcessingImage ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.1)',
                                            cursor: (input.trim() || selectedImage) && !isLoading && !isProcessingImage ? 'pointer' : 'not-allowed'
                                        }}
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                    <p className={styles.footer}>
                        {botName} puede cometer errores. Verifica información importante. Creado por <strong>{userName}</strong>.
                    </p>
                </div>
            </main>

            {/* Settings Modal */}
            {showSettings && (
                <div className={styles.modalOverlay} onClick={() => setShowSettings(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>⚙️ Panel de Control Sigma</h2>
                            <X className={styles.closeBtn} onClick={() => setShowSettings(false)} style={{ cursor: 'pointer' }} />
                        </div>
                        <div className={styles.modalBody} style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px' }}>

                            <div className={styles.sidebarHeading}>👤 Perfil de Usuario</div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nombre</label>
                                <input className={styles.input} value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Tu nombre completo" />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Rol</label>
                                <input className={styles.input} value={userRole} onChange={(e) => setUserRole(e.target.value)} placeholder="Ej: Developer, Designer..." />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>URL Foto de Perfil</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input className={styles.input} style={{ flex: 1 }} value={profilePic} onChange={(e) => setProfilePic(e.target.value)} placeholder="https://..." />
                                    <div style={{ width: '40px', height: '40px', background: '#212121', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                                        <Camera size={20} />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.sidebarHeading} style={{ marginTop: '1.5rem' }}>🤖 Configuración del Bot</div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nombre del Bot</label>
                                <input className={styles.input} value={botName} onChange={(e) => setBotName(e.target.value)} placeholder="Ej: Sigma AI, Asistente..." />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Modelo Predeterminado</label>
                                <select className={styles.select} value={selectedModel.modelId} onChange={(e) => setSelectedModel(models.find(m => m.modelId === e.target.value))}>
                                    {models.map(m => (
                                        <option key={m.modelId} value={m.modelId}>{m.modelName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <label className={styles.label}>Usar Emojis 😊</label>
                                <input
                                    type="checkbox"
                                    checked={useEmojis}
                                    onChange={(e) => setUseEmojis(e.target.checked)}
                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Instrucciones del Sistema</label>
                                <textarea
                                    className={styles.textareaField}
                                    rows={4}
                                    value={systemInstructions}
                                    onChange={(e) => setSystemInstructions(e.target.value)}
                                    placeholder="Define el comportamiento y estilo del bot..."
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                                <button className="btn-primary" style={{ flex: 1 }} onClick={saveSettings}>💾 Guardar Todo</button>
                                <button className="btn-outline" style={{ flex: 1 }} onClick={handleLogout}>🚪 Cerrar Sesión</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
