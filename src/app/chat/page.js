'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import {
    Plus, Search, Image as ImageIcon, X,
    ChevronDown, Settings, Mic, Send, User, Bot, Sparkles, MessageSquare, LogOut, Camera,
    Copy, Check, Trash2, AlertCircle, Upload,
    ThumbsUp, ThumbsDown, Share, RotateCcw, MoreHorizontal, Brain, ChevronUp, PanelLeft, Square
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { supabase } from '@/lib/supabaseClient';
import { formatAndLogSupabaseError } from '@/lib/supabaseHelpers';
import styles from './page.module.css';
import { models } from '@/lib/models';
import { uploadAndExtractFile } from '@/lib/fileParser';

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
    const [botName, setBotName] = useState('SigmaLMM 1');
    const [profilePic, setProfilePic] = useState('');
    const [systemInstructions, setSystemInstructions] = useState('Eres sigmaLLM 1, un modelo avanzado creado por Sigma Company. Mantén un tono profesional y amigable.');
    const [useEmojis, setUseEmojis] = useState(true);
    const [useReasoning, setUseReasoning] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [isParsingFile, setIsParsingFile] = useState(false);

    const [savedChats, setSavedChats] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [user, setUser] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [messageFeedback, setMessageFeedback] = useState({}); // { index: 'like' | 'dislike' }
    const [collapsedThinking, setCollapsedThinking] = useState({}); // { index: boolean }
    const [mounted, setMounted] = useState(false);

    const chatContainerRef = useRef(null);
    const isAtBottomRef = useRef(true);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const messagesRef = useRef(messages);
    const streamAbortRef = useRef(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const canSend = useMemo(() => {
        return (input.trim().length > 0 || !!selectedImage) && !isLoading && !isProcessingImage;
    }, [input, selectedImage, isLoading, isProcessingImage]);

    const getTimeBasedGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) return 'Buenos días';
        if (hour >= 12 && hour < 20) return 'Buenas tardes';
        return 'Buenas noches';
    };

    const handleScroll = () => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
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

    useEffect(() => {
        if (isLoading) {
            scrollToBottom("auto");
        } else if (messages.length > 0) {
            scrollToBottom("smooth");
        }
    }, [messages]);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
            const chatIdFromUrl = urlParams.get('id');

            if (!user) {
                if (chatIdFromUrl) {
                    window.location.href = `/login?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`;
                    return;
                }
                window.location.href = '/login';
                return;
            }

            setUser(user);
            fetchChats(user.id);

            if (chatIdFromUrl) {
                loadChat(chatIdFromUrl, user.id);
            }
        };
        if (mounted) checkUser();
    }, [mounted]);

    const fetchChats = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('chats')
                .select(`
                    id,
                    title,
                    user_id,
                    created_at,
                    messages (
                        id,
                        role,
                        content,
                        created_at,
                        image
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                const { ui } = formatAndLogSupabaseError(error);
                console.warn('Error fetching chats:', ui);
                setSavedChats([]);
                return;
            }

            setSavedChats(data || []);
        } catch (err) {
            const { ui } = formatAndLogSupabaseError(err);
            setSavedChats([]);
            console.warn('Fetch chats failed:', ui);
        }
    };

    const loadChat = async (chatId, userId) => {
        setCurrentChatId(chatId);
        try {
            const { data, error } = await supabase
                .from('chats')
                .select(`
                    id,
                    title,
                    user_id,
                    created_at,
                    messages (
                        id,
                        role,
                        content,
                        created_at,
                        image
                    )
                `)
                .eq('id', chatId)
                .single();

            if (error) {
                const { ui } = formatAndLogSupabaseError(error);
                setError(ui);
                return;
            }

            if (data) {
                setMessages(Array.isArray(data.messages) ? data.messages : []);
                setIsReadOnly(data.user_id !== userId);
            }
        } catch (err) {
            const { ui } = formatAndLogSupabaseError(err);
            setError(ui);
        }
    };

    const createNewChat = () => {
        setCurrentChatId(null);
        setMessages([]);
        setIsReadOnly(false);
        setInput('');
        setSelectedImage(null);
        setImagePreview(null);
    };

    const deleteChat = async (chatId, e) => {
        e.stopPropagation();
        const { error } = await supabase.from('chats').delete().eq('id', chatId);
        if (!error) {
            fetchChats(user.id);
            if (currentChatId === chatId) createNewChat();
        }
    };

    const stopStreaming = () => {
        if (streamAbortRef.current) {
            streamAbortRef.current.abort();
            setIsStreaming(false);
            setIsLoading(false);
        }
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!canSend) return;

        const userMsg = {
            role: 'user',
            content: input,
            image: imagePreview,
            timestamp: new Date().toISOString()
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setSelectedImage(null);
        setImagePreview(null);
        setIsLoading(true);
        setIsStreaming(true);
        setError(null);

        // Add assistant placeholder
        setMessages(prev => [...prev, { role: 'assistant', content: '...', timestamp: new Date().toISOString() }]);

        const controller = new AbortController();
        streamAbortRef.current = controller;

        try {
            const modelToUse = useReasoning ? 'nvidia/nemotron-nano-12b-v2-vl:free' : selectedModel.modelId;

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages,
                    modelId: modelToUse,
                    systemPrompt: systemInstructions,
                    botName: botName,
                    stream: true
                }),
                signal: controller.signal
            });

            if (!response.ok) throw new Error('API Error');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let botResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '').trim();
                        if (dataStr === '[DONE]') continue;
                        try {
                            const json = JSON.parse(dataStr);
                            const content = json.choices?.[0]?.delta?.content || '';
                            botResponse += content;

                            setMessages(prev => {
                                const last = [...prev];
                                last[last.length - 1] = {
                                    ...last[last.length - 1],
                                    content: botResponse
                                };
                                return last;
                            });
                        } catch (e) { /* ignore partial json */ }
                    }
                }
            }

            // Auto-collapse thinking block when finished
            if (botResponse.includes('</think>')) {
                setMessages(prev => {
                    const lastIdx = prev.length - 1;
                    setCollapsedThinking(c => ({ ...c, [lastIdx]: true }));
                    return prev;
                });
            }

            // Save to DB
            if (user) {
                try {
                    const payload = {
                        id: currentChatId || undefined,
                        user_id: user.id,
                        title: (input || '').slice(0, 30) || 'Nuevo Chat',
                        created_at: new Date().toISOString()
                    };

                    const { data, error } = await supabase.from('chats').upsert(payload).select().single();

                    // Insert messages separately if needed
                    if (!currentChatId && botResponse) {
                        await supabase.from('messages').insert({
                            chat_id: data.id,
                            role: 'assistant',
                            content: botResponse,
                            created_at: new Date().toISOString()
                        });
                    }
                    if (error) {
                        const { ui } = formatAndLogSupabaseError(error);
                        console.warn('Upsert chat error:', ui);
                    }

                    if (data && !currentChatId) {
                        setCurrentChatId(data.id);
                        fetchChats(user.id);
                    } else {
                        // Refresh list to reflect update
                        fetchChats(user.id);
                    }
                } catch (err) {
                    const { ui } = formatAndLogSupabaseError(err);
                    console.warn('Save chat failed:', ui);
                }
            }

        } catch (err) {
            if (err.name !== 'AbortError') {
                setError(err.message);
                setMessages(prev => prev.slice(0, -1));
            }
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
            streamAbortRef.current = null;
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        console.log('🖼️ File selected:', file.name, file.type, file.size);
        setError(null);

        // Only accept images on client side
        if (!file.type?.startsWith('image/')) {
            console.error('❌ File is not an image:', file.type);
            setError('Solo se permiten imágenes.');
            return;
        }
        console.log('✅ File is valid image');

        setIsLoading(true);
        setIsProcessingImage(true);
        console.log('📡 Starting image processing...');
        try {
            const reader = new FileReader();
            reader.onload = async () => {
                const dataUrl = reader.result;
                setSelectedImage(file);
                setImagePreview(dataUrl);

                // Add user message with image
                const userMsg = {
                    role: 'user',
                    content: `🖼️ Imagen para análisis`,
                    image: dataUrl,
                    timestamp: new Date().toISOString()
                };
                setMessages(prev => [...prev, userMsg]);

                // Add thinking placeholder
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: '...',
                    timestamp: new Date().toISOString()
                }]);

                // Extract base64 without prefix
                const base64 = String(dataUrl).replace(/^data:image\/[a-zA-Z]+;base64,/, '');
                console.log('✅ Image converted to Base64, length:', base64.length);

                // Call vision API with Nemotron/Mistral
                try {
                    console.log('📤 Calling /api/vision with useReasoning:', useReasoning);
                    const resp = await fetch('/api/vision', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imageBase64: base64, prompt: '', useNemotron: useReasoning })
                    });

                    if (!resp.ok) {
                        const err = await resp.json().catch(() => ({}));
                        console.error('❌ /api/vision error:', err);
                        setError(err.error || 'Error al analizar la imagen');
                        setMessages(prev => prev.slice(0, -1)); // Remove thinking placeholder
                        setIsLoading(false);
                        setIsProcessingImage(false);
                        return;
                    }
                    console.log('✅ /api/vision response OK, reading stream...');

                    // Read SSE stream from vision API (Nemotron/Mistral analysis)
                    const streamReader = resp.body.getReader();
                    const decoder = new TextDecoder();
                    let description = '';
                    let nemotronResponse = '';
                    let chunkCount = 0;

                    while (true) {
                        const { done, value } = await streamReader.read();
                        if (done) break;

                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n');

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const dataStr = line.replace('data: ', '').trim();
                                if (dataStr === '[DONE]') continue;
                                try {
                                    const json = JSON.parse(dataStr);
                                    const content = json.choices?.[0]?.delta?.content || '';
                                    if (content) {
                                        nemotronResponse += content;
                                        description += content;
                                        chunkCount++;
                                        console.log(`📦 Chunk ${chunkCount}: "${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"`);
                                    }
                                } catch (e) { console.log('⚠️ Parse error (partial JSON):', dataStr.slice(0, 50)); }
                            }
                        }
                    }

                    // Update assistant message with analysis
                    console.log('✅ Vision analysis complete (' + chunkCount + ' chunks):', description.slice(0, 100) + '...');
                    setMessages(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1] = {
                            ...updated[updated.length - 1],
                            content: description || 'Análisis completado.'
                        };
                        return updated;
                    });

                    // Now send this analysis to SigmaLLM 1 for response
                    console.log('📋 Building chat messages for SigmaLLM 1...');
                    const messagesForChat = [
                        userMsg,
                        {
                            role: 'assistant',
                            content: description
                        },
                        {
                            role: 'user',
                            content: description
                        }
                    ];
                    console.log('📤 Calling /api/chat with model:', selectedModel.modelId);

                    // Call chat API with selected model (SigmaLLM 1) to respond
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: '...',
                        timestamp: new Date().toISOString()
                    }]);

                    const chatResponse = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messages: messagesForChat,
                            modelId: selectedModel.modelId,
                            systemPrompt: systemInstructions,
                            botName: botName,
                            stream: true
                        })
                    });

                    if (!chatResponse.ok) {
                        console.error('❌ Chat API Error:', chatResponse.status);
                        throw new Error('Chat API Error');
                    }
                    console.log('✅ Chat API response OK, reading stream...');

                    const chatReader = chatResponse.body.getReader();
                    let sigmaResponse = '';
                    let chatChunkCount = 0;

                    while (true) {
                        const { done, value } = await chatReader.read();
                        if (done) break;

                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n');

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const dataStr = line.replace('data: ', '').trim();
                                if (dataStr === '[DONE]') continue;
                                try {
                                    const json = JSON.parse(dataStr);
                                    const content = json.choices?.[0]?.delta?.content || '';
                                    sigmaResponse += content;
                                    chatChunkCount++;

                                    setMessages(prev => {
                                        const last = [...prev];
                                        last[last.length - 1] = {
                                            ...last[last.length - 1],
                                            content: sigmaResponse
                                        };
                                        return last;
                                    });
                                    if (chatChunkCount % 10 === 0) console.log(`💬 Chat chunk ${chatChunkCount}: "${content.slice(0, 30)}..."`);
                                } catch (e) { console.log('⚠️ Chat parse error'); }
                            }
                        }
                    }

                    console.log('✅ Chat response complete (' + chatChunkCount + ' chunks)');

                } catch (err) {
                    console.error('❌ Vision/Chat call failed:', err);
                    setError('Error en procesamiento de imagen');
                    setMessages(prev => prev.slice(0, -1)); // Remove last placeholder
                }
            };
            reader.readAsDataURL(file);
        } finally {
            setIsLoading(false);
            setIsProcessingImage(false);
            setSelectedImage(null);
            setImagePreview(null);
            console.log('🏁 Image processing complete');
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
    };

    const copyToClipboard = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedId(idx);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleFeedback = (idx, type) => {
        setMessageFeedback(prev => ({
            ...prev,
            [idx]: prev[idx] === type ? null : type
        }));
    };

    const handleShare = (content) => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sigma-ai-chat.txt';
        a.click();
    };

    const toggleThinking = (idx) => {
        setCollapsedThinking(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    const handleRegenerate = async (idx) => {
        let lastUserMsg = null;
        for (let i = idx - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                lastUserMsg = messages[i].content;
                break;
            }
        }
        if (lastUserMsg) {
            setInput(lastUserMsg);
            setMessages(prev => prev.slice(0, idx - 1));
            // Trigger handleSend manually next tick or refactor handleSend to accept parameters
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    const saveSettings = () => {
        setShowSettings(false);
        // Persist to DB or LocalStorage if needed
    };

    const renderMessage = (content, index) => {
        if (!content) return null;
        let finalContent = content;
        if (!useEmojis) {
            finalContent = finalContent.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "");
        }

        const thinkStart = finalContent.indexOf('<think>');
        const thinkEnd = finalContent.indexOf('</think>');

        let thinkingPart = '';
        let answerPart = finalContent;

        if (thinkStart !== -1) {
            if (thinkEnd !== -1) {
                thinkingPart = finalContent.substring(thinkStart + 7, thinkEnd).trim();
                answerPart = finalContent.substring(thinkEnd + 8).trim();
            } else {
                thinkingPart = finalContent.substring(thinkStart + 7).trim();
                answerPart = '';
            }
        }

        return (
            <>
                {thinkingPart && (
                    <div className={styles.thinkingWrapper}>
                        <div
                            className={styles.thinkingHeader}
                            onClick={() => toggleThinking(index)}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Brain size={14} className={styles.thinkingIcon} />
                                {thinkEnd !== -1 ? 'Pensamiento completado' : 'Reflexionando...'}
                            </span>
                            {collapsedThinking[index] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                        </div>
                        {!collapsedThinking[index] && (
                            <div className={styles.thinkingContent}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{thinkingPart}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                )}
                {answerPart && (
                    <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeKatex, rehypeHighlight]}
                        components={{
                            pre: ({ node, ...props }) => <div className={styles.preWrapper}><pre {...props} /></div>,
                            code: ({ node, inline, ...props }) =>
                                inline ? <code className={styles.inlineCode} {...props} /> : <code {...props} />
                        }}
                    >
                        {answerPart}
                    </ReactMarkdown>
                )}
            </>
        );
    };

    if (!mounted) return null;

    return (
        <div className={styles.pageContainer}>
            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <button className={styles.newChatBtn} onClick={createNewChat}>
                        <Plus size={18} /> Nueva conversación
                    </button>
                    <button className={styles.iconBtn} onClick={() => setIsSidebarOpen(false)} style={{ display: isSidebarOpen ? 'block' : 'none' }}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.sidebarContent}>
                    <div className={styles.sidebarSection}>
                        <div className={styles.sidebarHeading}>Recientes</div>
                        {savedChats.length > 0 ? (
                            savedChats.map(chat => (
                                <div
                                    key={chat.id}
                                    className={`${styles.sidebarLink} ${currentChatId === chat.id ? styles.activeLink : ''}`}
                                    onClick={() => loadChat(chat.id, user?.id)}
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
                    <div className={styles.mobileLeft}>
                        <button className={styles.iconBtn} onClick={() => setIsSidebarOpen(true)} title="Menú (Ctrl+B)">
                            <PanelLeft size={20} />
                        </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <div className={styles.modelSelector}>
                            {botName} 🤖
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        <div style={{ background: 'linear-gradient(135deg, #00c853, #00e676)', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '6px', height: '6px', background: 'white', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
                            Online
                        </div>
                        {isStreaming ? (
                            <button className={styles.stopBtn} onClick={stopStreaming} title="Detener generación">
                                <Square size={18} />
                                <span className={styles.stopLabel}>Stop</span>
                            </button>
                        ) : (
                            <button className={styles.iconBtn} onClick={() => setShowSettings(true)} title="Configuración"><Settings size={20} /></button>
                        )}
                    </div>
                </header>

                <div className={styles.chatContainer} ref={chatContainerRef} onScroll={handleScroll}>
                    {messages.length === 0 ? (
                        <div className={styles.emptyState}>
                            <img src="/logo_fondo_negro-removebg-preview.png" style={{ width: '80px', height: '80px', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 15px rgba(99, 102, 241, 0.4))' }} alt="Logo" />
                            <h1 className={styles.emptyTitle}>¡{getTimeBasedGreeting()}, {userName.split(' ')[0]}!</h1>
                            <p style={{ color: '#888', marginTop: '0.5rem' }}>Modelo activo: SigmaLMM 1</p>
                        </div>
                    ) : (
                        <div className={styles.messagesList}>
                            {messages.map((msg, idx) => (
                                <div key={msg.id || idx} className={styles.message}>
                                    <div className={`${styles.messageAvatar} ${msg.role === 'user' ? styles.userAvatar : styles.botAvatar}`}>
                                        {msg.role === 'user' ? (
                                            profilePic ? <img src={profilePic} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="User" /> : <User size={18} />
                                        ) : <img src="/logo_fondo_negro-removebg-preview.png" style={{ width: '22px', height: '22px', objectFit: 'contain' }} alt="Bot" />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        {msg.image && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <img src={msg.image} alt="Uploaded" style={{ maxWidth: '400px', width: '100%', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
                                            </div>
                                        )}
                                        <div className={styles.messageContent}>
                                            {msg.content === '...' ? (
                                                <div className={styles.loadingContainer}>
                                                    <div className={styles.loadingSpinner}></div>
                                                    <span className={styles.typingText}>{botName} está pensando...</span>
                                                </div>
                                            ) : (
                                                renderMessage(msg.content, idx)
                                            )}
                                        </div>
                                        {msg.role === 'assistant' && msg.content && msg.content !== '...' && (
                                            <div className={styles.messageActions}>
                                                <button className={styles.actionBtn} onClick={() => copyToClipboard(msg.content, idx)} title="Copiar">
                                                    {copiedId === idx ? <Check size={16} /> : <Copy size={16} />}
                                                </button>
                                                <button className={`${styles.actionBtn} ${messageFeedback[idx] === 'like' ? styles.activeAction : ''}`} onClick={() => handleFeedback(idx, 'like')} title="Buen resultado">
                                                    <ThumbsUp size={16} fill={messageFeedback[idx] === 'like' ? 'currentColor' : 'none'} />
                                                </button>
                                                <button className={`${styles.actionBtn} ${messageFeedback[idx] === 'dislike' ? styles.activeAction : ''}`} onClick={() => handleFeedback(idx, 'dislike')} title="Mal resultado">
                                                    <ThumbsDown size={16} fill={messageFeedback[idx] === 'dislike' ? 'currentColor' : 'none'} />
                                                </button>
                                                <button className={styles.actionBtn} onClick={() => handleShare(msg.content)} title="Exportar"><Share size={16} /></button>
                                                <button className={styles.actionBtn} onClick={() => handleRegenerate(idx)} title="Regenerar"><RotateCcw size={16} /></button>
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
                    {!isReadOnly && (
                        <>
                            {imagePreview && (
                                <div style={{ maxWidth: '768px', width: '100%', marginBottom: '12px', position: 'relative' }}>
                                    <div style={{ position: 'relative', display: 'inline-block', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '8px' }}>
                                        {imagePreview === 'file_icon' ? (
                                            <div style={{ padding: '20px', background: '#212121', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                <MessageSquare size={32} color="#6366f1" />
                                                <div style={{ fontSize: '0.8rem', color: '#888' }}>{selectedImage?.name}</div>
                                            </div>
                                        ) : (
                                            <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px' }} />
                                        )}
                                        <button onClick={removeImage} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.9)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                            <X size={16} color="white" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSend} className={styles.inputWrapper}>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                                <button type="button" className={styles.attachButton} onClick={() => fileInputRef.current?.click()} disabled={isLoading}><Upload size={20} /></button>
                                <textarea
                                    ref={textareaRef}
                                    className={styles.textarea}
                                    placeholder={`Mensaje a ${botName}...`}
                                    rows={1}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                                    disabled={isLoading}
                                />
                                <button type="submit" className={styles.sendBtn} disabled={!canSend}><Send size={16} /></button>
                            </form>
                        </>
                    )}
                    <p className={styles.footer}>{botName} puede cometer errores. Creado por <strong>{userName}</strong>.</p>
                </div>
            </main>

            {showSettings && (
                <div className={styles.modalOverlay} onClick={() => setShowSettings(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>⚙️ Panel de Control</h2>
                            <X className={styles.closeBtn} onClick={() => setShowSettings(false)} />
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.sidebarHeading}>Usuario</div>
                            <input className={styles.input} value={userName} onChange={(e) => setUserName(e.target.value)} />
                            <div className={styles.sidebarHeading}>Bot</div>
                            <input className={styles.input} value={botName} onChange={(e) => setBotName(e.target.value)} />
                            <textarea className={styles.textareaField} value={systemInstructions} onChange={(e) => setSystemInstructions(e.target.value)} />
                            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input id="useReasoning" type="checkbox" checked={useReasoning} onChange={(e) => setUseReasoning(e.target.checked)} />
                                <label htmlFor="useReasoning">Activar Razonamiento (usar modelo Nemotron)</label>
                            </div>
                            <button className="btn-primary" onClick={saveSettings}>Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
