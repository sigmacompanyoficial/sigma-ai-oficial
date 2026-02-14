'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import {
    Plus, Search, Image as ImageIcon, X,
    ChevronDown, Settings, Mic, Send, User, Bot, Sparkles, MessageSquare, LogOut, Camera,
    Copy, Check, Trash2, AlertCircle, Upload,
    ThumbsUp, ThumbsDown, Share, RotateCcw, MoreHorizontal, Brain, ChevronUp, PanelLeft, Square,
    Archive, Flag, BarChart3, Zap
} from 'lucide-react';
import SigmaMarkdown from '@/components/SigmaMarkdown';
import { supabase } from '@/lib/supabaseClient';
import { formatAndLogSupabaseError } from '@/lib/supabaseHelpers';
import styles from './page.module.css';
import { models } from '@/lib/models';
import { uploadAndExtractFile } from '@/lib/fileParser';

const guestModel = { modelId: 'qwen/qwen3-next-80b-a3b-instruct:free', modelName: 'Qwen 3 Next 80B', provider: 'openrouter', hostedId: 'qwen/qwen3-next-80b-a3b-instruct:free', platformLink: 'https://openrouter.ai', imageInput: false, maxContext: 32768 };

export default function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [selectedModel, setSelectedModel] = useState(models[0]);
    const [isGuest, setIsGuest] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [error, setError] = useState(null);

    // User Profile States
    const [userName, setUserName] = useState('Invitado');
    const [userRole, setUserRole] = useState('Visitante');
    const [botName, setBotName] = useState('Sigma LLM 1');
    const [profilePic, setProfilePic] = useState('');
    const [systemInstructions, setSystemInstructions] = useState('Eres sigmaLLM 1, un modelo avanzado creado por Sigma Company. Mantén un tono profesional y amigable.');
    const [useEmojis, setUseEmojis] = useState(true);
    const [useReasoning, setUseReasoning] = useState(false);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [useWebSearch, setUseWebSearch] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [sidebarSearch, setSidebarSearch] = useState('');

    // Detailed Settings States
    const [activeSettingsTab, setActiveSettingsTab] = useState('General');
    const [appearance, setAppearance] = useState('Oscuro');
    const [language, setLanguage] = useState('Español');
    const [botTone, setBotTone] = useState('Profesional');
    const [detailLevel, setDetailLevel] = useState('Medio');
    const [memoryEnabled, setMemoryEnabled] = useState(true);
    const [totalMessages, setTotalMessages] = useState(0);
    const [totalTokens, setTotalTokens] = useState(0);

    const [selectedImages, setSelectedImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
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
    const isAtBottomRef = useRef(true); // Inicializar como true para hacer scroll al inicio
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const attachMenuRef = useRef(null);
    const messagesRef = useRef(messages);
    const streamAbortRef = useRef(null);
    const lastSentRef = useRef(0);

    // Rate limiting & Retry logic
    const RATE_LIMIT = 1000; // 1 segundo entre mensajes
    const MAX_RETRIES = 3;
    const INITIAL_RETRY_DELAY = 2000; // 2 segundos

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const fetchWithRetry = async (url, options, retries = MAX_RETRIES, delay = INITIAL_RETRY_DELAY) => {
        try {
            const response = await fetch(url, options);

            if (response.status === 429) {
                if (retries > 0) {
                    console.warn(`⏳ Límite de peticiones alcanzado. Reintentando en ${delay / 1000}s... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
                    await sleep(delay);
                    return fetchWithRetry(url, options, retries - 1, delay * 1.5);
                } else {
                    throw new Error('Demasiadas peticiones. Por favor espera un momento e intenta de nuevo.');
                }
            }

            return response;
        } catch (err) {
            if (retries > 0 && err.message.includes('Failed to fetch')) {
                console.warn(`🔄 Error de conexión. Reintentando en ${delay / 1000}s...`);
                await sleep(delay);
                return fetchWithRetry(url, options, retries - 1, delay * 1.5);
            }
            throw err;
        }
    };

    const canSendMessage = () => {
        const now = Date.now();
        if (now - lastSentRef.current < RATE_LIMIT) return false;
        lastSentRef.current = now;
        return true;
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (attachMenuRef.current && !attachMenuRef.current.contains(event.target)) {
                setShowAttachMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const canSend = useMemo(() => {
        return (input.trim().length > 0 || selectedImages.length > 0) && !isLoading && !isProcessingImage;
    }, [input, selectedImages, isLoading, isProcessingImage]);

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
        if (!chatContainerRef.current) return;

        const doScroll = () => {
            if (chatContainerRef.current) {
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

        // Usar requestAnimationFrame para asegurar que el DOM se ha actualizado
        if (force || isAtBottomRef.current) {
            requestAnimationFrame(() => {
                setTimeout(doScroll, 0);
            });
        }
    };

    // Agregar event listener de scroll
    useEffect(() => {
        const container = chatContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, []);

    // Scroll cuando cambian los mensajes
    useEffect(() => {
        if (messages.length > 0) {
            // Force scroll cuando hay nuevos mensajes (usuario agrega mensaje)
            scrollToBottom("auto", true);
        }
    }, [messages.length]);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
            const chatIdFromUrl = urlParams.get('id');

            if (!user) {
                console.log('👤 Modo Invitado activado');
                setIsGuest(true);

                if (chatIdFromUrl) {
                    console.log('👀 Viendo chat compartido como invitado...');
                    await loadChat(chatIdFromUrl, null);
                } else {
                    setSelectedModel(guestModel);
                    setBotName('Sigma LLM 1 Mini');
                    setSystemInstructions('Eres sigmaLLM 1, un modelo avanzado creado por Sigma Company. Mantén un tono profesional y amigable.');
                    console.log('🤖 Bot configurado:', 'Sigma LLM 1 Mini');
                }
                return;
            }

            setUser(user);
            setIsGuest(false);

            // Verificación de Onboarding y Rol
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (!profile || !profile.onboarding_completed) {
                window.location.href = '/onboarding';
                return;
            }

            // Cargar datos del perfil
            if (profile) {
                setUserName(profile.full_name || user.email.split('@')[0]);
                setUserRole(profile.role === 'admin' ? 'Administrador' : profile.role === 'premium' ? 'Usuario Premium' : 'Usuario Estándar');
                setProfilePic(profile.avatar_url || '');

                // Cargar configuraciones guardadas si existen
                if (profile.settings) {
                    const s = profile.settings;
                    if (s.theme) setAppearance(s.theme);
                    if (s.language) setLanguage(s.language);
                    if (s.botName) setBotName(s.botName);
                    if (s.botTone) setBotTone(s.botTone);
                    if (s.systemInstructions) setSystemInstructions(s.systemInstructions);
                }
            }

            fetchChats(user.id);
            fetchStats(user.id);

            if (chatIdFromUrl) {
                loadChat(chatIdFromUrl, user.id);
            }
        };
        if (mounted) checkUser();
    }, [mounted]);

    const fetchStats = async (userId) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('total_messages, total_tokens')
            .eq('id', userId)
            .single();

        if (!error && data) {
            setTotalMessages(data.total_messages || 0);
            setTotalTokens(data.total_tokens || 0);
        }
    };

    const fetchChats = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('chats')
                .select(`
                    id,
                    title,
                    user_id,
                    is_shared,
                    created_at,
                    is_archived,
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
        setIsSidebarOpen(false); // Close sidebar on mobile after selection
        try {
            const { data, error } = await supabase
                .from('chats')
                .select(`
                    id,
                    title,
                    user_id,
                    is_shared,
                    created_at,
                    is_archived,
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
                // If userId is null (guest), data.user_id !== null is true.
                // If user is logged in, data.user_id !== userId checks ownership.
                const isOwner = userId ? (data.user_id === userId) : false;
                setIsReadOnly(!isOwner);

                if (!isOwner) {
                    setBotName('Sigma LLM 1 (Solo Lectura)');
                }
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
        setSelectedImages([]);
        setImagePreviews([]);
        setIsSidebarOpen(false); // Close sidebar on mobile
    };

    const archiveChat = async (chatId, undo = false) => {
        const { error } = await supabase
            .from('chats')
            .update({ is_archived: !undo })
            .eq('id', chatId);

        if (!error) {
            fetchChats(user.id);
            if (currentChatId === chatId && !undo) createNewChat();
            setShowMoreMenu(false);
        } else {
            console.warn('Error archiving/unarchiving chat:', error);
            // Fallback local
            setSavedChats(prev => prev.map(c => c.id === chatId ? { ...c, is_archived: !undo } : c));
            if (currentChatId === chatId && !undo) createNewChat();
            setShowMoreMenu(false);
        }
    };

    const reportChat = (chatId) => {
        alert('Este chat ha sido denunciado. Revisaremos el contenido a la brevedad.');
        setShowMoreMenu(false);
    };

    const deleteChat = async (chatId, e) => {
        if (e) e.stopPropagation();
        const { error } = await supabase.from('chats').delete().eq('id', chatId);
        if (!error) {
            fetchChats(user.id);
            if (currentChatId === chatId) createNewChat();
            setShowMoreMenu(false);
        }
    };

    const stopStreaming = () => {
        if (streamAbortRef.current) {
            streamAbortRef.current.abort();
            setIsStreaming(false);
            setIsLoading(false);
        }
    };

    const updateUserStats = async (tokens) => {
        if (isGuest) {
            console.log('📊 [INVITADO] Mensaje enviado, tokens estimados:', tokens);
            return;
        }
        if (!user) return;

        const newTotalMessages = totalMessages + 1;
        const newTotalTokens = totalTokens + tokens;

        setTotalMessages(newTotalMessages);
        setTotalTokens(newTotalTokens);

        const { error } = await supabase
            .from('profiles')
            .update({
                total_messages: newTotalMessages,
                total_tokens: newTotalTokens
            })
            .eq('id', user.id);

        if (error) console.warn('Error updating user stats:', error);
    };

    const handleShareChat = async () => {
        if (!currentChatId) {
            alert('No hay un chat activo para compartir.');
            return;
        }

        if (isGuest) {
            alert('Los invitados no pueden compartir chats. Inicia sesión para guardar y compartir.');
            return;
        }

        try {
            // Update the chat to be shared
            const { error } = await supabase
                .from('chats')
                .update({ is_shared: true })
                .eq('id', currentChatId);

            if (error) throw error;

            // Generate link
            const url = `${window.location.origin}/chat?id=${currentChatId}`;
            await navigator.clipboard.writeText(url);
            alert('✅ Enlace público copiado al portapapeles.\n\nCualquier persona con el enlace podrá ver este chat (solo lectura).');
        } catch (err) {
            console.error('Error sharing chat:', err);
            alert('Error al compartir el chat.');
        }
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!canSend) return;
        if (!canSendMessage()) return;

        const currentInput = input;
        const currentImages = [...imagePreviews];

        const userMsg = {
            role: 'user',
            content: currentInput,
            images: currentImages,
            timestamp: new Date().toISOString()
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setSelectedImages([]);
        setImagePreviews([]);
        setIsLoading(true);
        setIsStreaming(true);
        setError(null);

        let gemmaContext = "";
        if (currentImages.length > 0) {
            console.log('📸 Gemma-3 is analyzing the images in the background...');
            try {
                const analysisResults = [];
                for (const imgBase64 of currentImages) {
                    const base64Clean = imgBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
                    const visionResp = await fetch('/api/vision', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imageBase64: base64Clean })
                    });

                    if (visionResp.ok) {
                        const vReader = visionResp.body.getReader();
                        const vDecoder = new TextDecoder();
                        let vDesc = "";
                        while (true) {
                            const { done, value } = await vReader.read();
                            if (done) break;
                            const chunk = vDecoder.decode(value);
                            const linesChunk = chunk.split('\n');
                            for (const line of linesChunk) {
                                if (line.startsWith('data: ')) {
                                    try {
                                        const json = JSON.parse(line.replace('data: ', ''));
                                        vDesc += json.choices?.[0]?.delta?.content || '';
                                    } catch (e) { }
                                }
                            }
                        }
                        vDesc = vDesc.trim();
                        analysisResults.push(vDesc);
                        console.log(`📝 Gemma Analysis for image ${analysisResults.length}:`, vDesc);
                    }
                }
                if (analysisResults.length > 0) {
                    gemmaContext = `\n\n[ANÁLISIS DE IMÁGENES (Gemma-3 Vision)]:\n${analysisResults.join('\n--- Next Image ---\n')}\n\nUtiliza este análisis profesional para responder al usuario. Actúa como si tú hubieras visto la imagen.`;
                    console.log('✅ Gemma-3 Analysis Complete. Context ready.');
                }
            } catch (vErr) {
                console.error('❌ Error during background image analysis:', vErr);
            }
        }

        let chatId = currentChatId;
        if (user) {
            try {
                if (!chatId) {
                    const { data: chatData, error: chatError } = await supabase.from('chats').insert({
                        user_id: user.id,
                        title: (currentInput || 'Imagen adjunta').slice(0, 30) || 'Nuevo Chat',
                        created_at: new Date().toISOString()
                    }).select().single();
                    if (!chatError && chatData) {
                        chatId = chatData.id;
                        setCurrentChatId(chatId);
                        fetchChats(user.id);
                    }
                }
                if (chatId) {
                    await supabase.from('messages').insert({
                        chat_id: chatId,
                        role: 'user',
                        content: currentInput,
                        image: currentImages[0] || null,
                        created_at: new Date().toISOString()
                    });
                }
            } catch (err) { console.warn('DB Save err:', err); }
        }

        setMessages(prev => [...prev, { role: 'assistant', content: '...', timestamp: new Date().toISOString() }]);

        const controller = new AbortController();
        streamAbortRef.current = controller;

        try {
            let modelToUse = useReasoning ? 'nvidia/nemotron-nano-12b-v2-vl:free' : selectedModel.modelId;
            let searchContext = "";
            if (useWebSearch) {
                try {
                    const searchResp = await fetchWithRetry('/api/search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: currentInput })
                    });
                    if (searchResp.ok) {
                        const searchData = await searchResp.json();
                        if (searchData.success) {
                            searchContext = `\n\n[CONTEXTO DE BÚSQUEDA WEB]:\n${searchData.result}`;
                        }
                    }
                } catch (e) { console.error('Search failed:', e); }
            }

            const messagesForAPI = [...newMessages];
            const lastIdx = messagesForAPI.length - 1;
            messagesForAPI[lastIdx] = {
                ...messagesForAPI[lastIdx],
                content: messagesForAPI[lastIdx].content + gemmaContext + searchContext
            };

            console.log('📤 Sending Final Payload to Trinity:', {
                model: modelToUse,
                messagesCount: messagesForAPI.length,
                lastMessageWithContext: messagesForAPI[lastIdx].content
            });

            const response = await fetchWithRetry('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messagesForAPI,
                    modelId: modelToUse,
                    systemPrompt: systemInstructions,
                    botName: botName,
                    stream: true,
                    tone: botTone,
                    detailLevel: detailLevel,
                    language: language
                }),
                signal: controller.signal
            });

            if (!response.ok) throw new Error('Chat API error');
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let botResponse = '';

            setMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: '', timestamp: new Date().toISOString() };
                return next;
            });

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                const linesChunk = chunk.split('\n');
                for (const line of linesChunk) {
                    if (line.startsWith('data: ')) {
                        try {
                            const json = JSON.parse(line.replace('data: ', ''));
                            const delta = json.choices?.[0]?.delta?.content || '';
                            if (delta) {
                                console.log('📥 Trinity chunk:', delta);
                                botResponse += delta;
                            }
                            setMessages(prev => {
                                const last = [...prev];
                                last[last.length - 1] = { ...last[last.length - 1], content: botResponse };
                                return last;
                            });
                        } catch (e) { }
                    }
                }
            }
            console.log('✅ Response complete. Full text length:', botResponse.length);

            if (user && chatId) {
                await supabase.from('messages').insert({
                    chat_id: chatId,
                    role: 'assistant',
                    content: botResponse,
                    created_at: new Date().toISOString()
                });
                updateUserStats(Math.ceil(botResponse.length / 4));
            }

        } catch (err) {
            console.error('Final flow error:', err);
            setError('Error al obtener respuesta.');
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
        }
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        if (selectedImages.length + files.length > 5) {
            alert('Máximo 5 imágenes.');
            return;
        }

        setIsProcessingImage(true);
        const newImages = [...selectedImages];
        const newPreviews = [...imagePreviews];

        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            const base64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
            newImages.push(file);
            newPreviews.push(base64);
        }

        setSelectedImages(newImages);
        setImagePreviews(newPreviews);
        setIsProcessingImage(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (index) => {
        const newImages = selectedImages.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        setSelectedImages(newImages);
        setImagePreviews(newPreviews);
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

    const saveSettings = async () => {
        setShowSettings(false);
        if (!user) return;

        const newSettings = {
            theme: appearance,
            language: language,
            botName: botName,
            botTone: botTone,
            systemInstructions: systemInstructions
        };

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: userName,
                    settings: newSettings
                })
                .eq('id', user.id);

            if (error) throw error;
            console.log('✅ Configuración guardada correctamente');
        } catch (err) {
            console.error('❌ Error al guardar configuración:', err);
            // Fallback opcional o notificación de error
        }
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
                                <SigmaMarkdown content={thinkingPart} theme="dark" />
                            </div>
                        )}
                    </div>
                )}
                {answerPart && (
                    <SigmaMarkdown content={answerPart} theme="dark" />
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
                    <div className={styles.sidebarLogoContainer}>
                        <img src="/logo_fondo_negro-removebg-preview.png" alt="Sigma AI" className={styles.sidebarLogo} />
                        <span className={styles.sidebarBrand}>Sigma AI</span>
                    </div>

                    <div className={styles.sidebarSearchWrapper}>
                        <Search size={14} className={styles.sidebarSearchIcon} />
                        <input
                            type="text"
                            placeholder="Buscar chats..."
                            className={styles.sidebarSearchInput}
                            value={sidebarSearch}
                            onChange={(e) => setSidebarSearch(e.target.value)}
                        />
                    </div>

                    <button className={styles.newChatBtn} onClick={createNewChat}>
                        <Plus size={18} /> Nueva conversación
                    </button>
                    <button className={styles.iconBtn} onClick={() => setIsSidebarOpen(false)} style={{ display: isSidebarOpen ? 'block' : 'none' }}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.sidebarContent}>
                    <div className={styles.sidebarSection}>
                        <div className={styles.sidebarHeading}>{sidebarSearch ? 'Resultados de búsqueda' : 'Recientes'}</div>
                        {savedChats.filter(chat => !chat.is_archived).filter(chat =>
                            chat.title?.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
                            chat.messages?.some(m => m.content?.toLowerCase().includes(sidebarSearch.toLowerCase()))
                        ).length > 0 ? (
                            savedChats.filter(chat => !chat.is_archived).filter(chat =>
                                chat.title?.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
                                chat.messages?.some(m => m.content?.toLowerCase().includes(sidebarSearch.toLowerCase()))
                            ).map(chat => (
                                <div
                                    key={chat.id}
                                    className={`${styles.sidebarLink} ${currentChatId === chat.id ? styles.activeLink : ''}`}
                                    onClick={() => loadChat(chat.id, user?.id)}
                                >
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.title}</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button onClick={(e) => { e.stopPropagation(); archiveChat(chat.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '4px' }} title="Archivar">
                                            <Archive size={14} />
                                        </button>
                                        <button onClick={(e) => deleteChat(chat.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '4px' }} title="Eliminar">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '0.5rem', fontSize: '0.8rem', color: '#666' }}>
                                {sidebarSearch ? 'No se encontraron chats' : 'Sin chats recientes'}
                            </div>
                        )}
                    </div>

                    <div className={styles.sidebarSection}>
                        <div className={styles.sidebarHeading}>Chats archivados</div>
                        {savedChats.filter(chat => chat.is_archived).length > 0 ? (
                            savedChats.filter(chat => chat.is_archived).map(chat => (
                                <div
                                    key={chat.id}
                                    className={`${styles.sidebarLink} ${currentChatId === chat.id ? styles.activeLink : ''}`}
                                    onClick={() => loadChat(chat.id, user?.id)}
                                >
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.title}</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button onClick={(e) => { e.stopPropagation(); archiveChat(chat.id, true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '4px' }} title="Desarchivar">
                                            <RotateCcw size={14} />
                                        </button>
                                        <button onClick={(e) => deleteChat(chat.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '4px' }} title="Eliminar">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '0.5rem', fontSize: '0.8rem', color: '#666' }}>
                                No hay chats archivados
                            </div>
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
                        {userRole === 'Administrador' && (
                            <button className={styles.iconBtn} onClick={() => window.location.href = '/admin'} title="Panel Admin" style={{ color: '#8b5cf6' }}>
                                <Shield size={18} />
                            </button>
                        )}
                        <button className={styles.iconBtn} onClick={() => setShowSettings(true)} title="Configuración"><Settings size={18} /></button>
                    </div>
                </div>
            </aside>

            {isSidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setIsSidebarOpen(false)} />}

            {/* Main Chat Area */}
            <main className={styles.main}>
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <button className={styles.mobileMenuBtn} onClick={() => setIsSidebarOpen(true)} title="Menú">
                            <PanelLeft size={20} />
                        </button>
                        <div className={styles.modelSelectorWrapper}>
                            <div className={styles.modelSelector} onClick={() => setShowModelDropdown(!showModelDropdown)}>
                                <span>{useReasoning ? 'Sigma LLM 1 Reasoning' : 'Sigma LLM 1'}</span>
                                <ChevronDown size={16} className={styles.chevronIcon} />
                            </div>

                            {showModelDropdown && (
                                <div className={styles.modelDropdown}>
                                    <div
                                        className={`${styles.modelOption} ${!useReasoning ? styles.activeModel : ''}`}
                                        onClick={() => {
                                            setUseReasoning(false);
                                            setShowModelDropdown(false);
                                            setBotName('SigmaLLM 1');
                                        }}
                                    >
                                        <div className={styles.modelOptionHeader}>
                                            <Sparkles size={16} />
                                            <span>Sigma LLM 1</span>
                                        </div>
                                        <p className={styles.modelDescription}>Nuestro modelo estándar, rápido y eficiente.</p>
                                    </div>
                                    <div
                                        className={`${styles.modelOption} ${useReasoning ? styles.activeModel : ''}`}
                                        onClick={() => {
                                            setUseReasoning(true);
                                            setShowModelDropdown(false);
                                            setBotName('SigmaLLM 1 Reasoning');
                                        }}
                                    >
                                        <div className={styles.modelOptionHeader}>
                                            <Brain size={16} />
                                            <span>Sigma LLM 1 Reasoning</span>
                                        </div>
                                        <p className={styles.modelDescription}>Pensamiento avanzado para tareas complejas.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.headerActions}>
                        <button
                            className={styles.shareButton}
                            onClick={handleShareChat}
                            title="Compartir chat públicamente"
                        >
                            <Upload size={16} />
                            <span>Compartir</span>
                        </button>
                        <div className={styles.moreMenuWrapper}>
                            <button className={styles.iconBtn} onClick={() => setShowMoreMenu(!showMoreMenu)}>
                                <MoreHorizontal size={20} />
                            </button>

                            {showMoreMenu && (
                                <div className={styles.moreMenuDropdown}>
                                    <div className={styles.moreMenuOption} onClick={() => archiveChat(currentChatId)}>
                                        <Archive size={16} />
                                        <span>Archivar chat</span>
                                    </div>
                                    <div className={styles.moreMenuOption} onClick={() => reportChat(currentChatId)}>
                                        <Flag size={16} />
                                        <span>Denunciar chat</span>
                                    </div>
                                    <div className={`${styles.moreMenuOption} ${styles.deleteOption}`} onClick={() => deleteChat(currentChatId)}>
                                        <Trash2 size={16} />
                                        <span>Eliminar chat</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className={styles.chatContainer} ref={chatContainerRef} onScroll={handleScroll}>
                    {messages.length === 0 ? (
                        <div className={styles.emptyState}>
                            <img src="/logo_fondo_negro-removebg-preview.png" alt="Sigma AI" className={styles.emptyLogo} />
                            <h1 className={styles.emptyTitle}>¡{getTimeBasedGreeting()}, {userName.split(' ')[0]}!</h1>
                            <p style={{ color: '#BDBDBD', marginTop: '0.5rem', fontSize: '0.95rem' }}>Modelo activo: {botName}</p>
                        </div>
                    ) : (
                        <div className={styles.messagesList}>
                            {messages.map((msg, idx) => (
                                <div key={msg.id || idx} className={`${styles.message} ${msg.role === 'user' ? styles.user : ''}`}>
                                    <div className={`${styles.messageAvatar} ${msg.role === 'user' ? styles.userAvatar : styles.botAvatar}`}>
                                        {msg.role === 'user' ? (
                                            profilePic ? <img src={profilePic} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="User" /> : <User size={18} />
                                        ) : <img src="/logo_fondo_negro-removebg-preview.png" style={{ width: '22px', height: '22px', objectFit: 'contain' }} alt="Bot" />}
                                    </div>
                                    <div className={styles.messageWrapper}>
                                        {msg.images && msg.images.length > 0 && (
                                            <div style={{ marginBottom: '12px', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                                {msg.images.map((imgSrc, imgIdx) => (
                                                    <img key={imgIdx} src={imgSrc} alt={`Uploaded ${imgIdx}`} style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
                                                ))}
                                            </div>
                                        )}
                                        {msg.image && (!msg.images || msg.images.length === 0) && (
                                            <div style={{ marginBottom: '12px', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                                <img src={msg.image} alt="Uploaded" style={{ maxWidth: '400px', width: '100%', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
                                            </div>
                                        )}
                                        <div className={styles.messageContent}>
                                            {msg.isSearching && (
                                                <div className={styles.searchingAnimation}>
                                                    <Search size={16} className={styles.searchIconAnim} />
                                                    <span>Buscando en la web...</span>
                                                </div>
                                            )}
                                            {msg.content === '...' && !msg.isSearching ? (
                                                <div className={styles.loadingContainer}>
                                                    <div className={styles.loadingSpinner}></div>
                                                    <span className={styles.typingText}>{botName} está pensando...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    {renderMessage(msg.content, idx)}
                                                    {msg.source && (
                                                        <div style={{ marginTop: '8px', fontSize: '0.75rem', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Search size={12} /> Fuente: {msg.source}
                                                        </div>
                                                    )}
                                                </>
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
                            {imagePreviews.length > 0 && (
                                <div style={{ width: '100%', marginBottom: '12px', padding: '0 10px' }}>
                                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                                        {imagePreviews.map((preview, idx) => (
                                            <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
                                                <img
                                                    src={preview}
                                                    alt={`Preview ${idx}`}
                                                    style={{
                                                        width: '60px',
                                                        height: '60px',
                                                        objectFit: 'cover',
                                                        borderRadius: '8px',
                                                        border: '1px solid rgba(255,255,255,0.1)'
                                                    }}
                                                />
                                                <button
                                                    onClick={() => removeImage(idx)}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '-6px',
                                                        right: '-6px',
                                                        background: 'rgba(239, 68, 68, 0.9)',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '18px',
                                                        height: '18px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        color: 'white'
                                                    }}
                                                >
                                                    <X size={10} strokeWidth={3} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSend} className={styles.inputWrapper}>
                                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: 'none' }} />

                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <button
                                        type="button"
                                        className={styles.attachButton}
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isLoading}
                                        title="Subir archivos"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>

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

                                {isLoading || isStreaming ? (
                                    <button type="button" className={styles.stopBtnInline} onClick={stopStreaming}>
                                        <Square size={16} fill="white" />
                                    </button>
                                ) : (
                                    <button type="submit" className={styles.sendBtn} disabled={!canSend}>
                                        <Send size={16} />
                                    </button>
                                )}
                            </form>
                        </>
                    )}
                    {isReadOnly && (
                        <div className={styles.readOnlyBanner}>
                            <AlertCircle size={20} />
                            <span>Estás viendo una versión de solo lectura de este chat.</span>
                            {!user && (
                                <button onClick={() => window.location.href = '/login'} className={styles.loginLink}>
                                    Iniciar sesión para crear tu propio chat
                                </button>
                            )}
                        </div>
                    )}
                    <p className={styles.footer}>Sigma AI puede cometer errores. Verifica la información importante</p>
                </div>
            </main>

            {showSettings && (
                <div className={styles.modalOverlay} onClick={() => setShowSettings(false)}>
                    <div className={styles.settingsModal} onClick={(e) => e.stopPropagation()}>
                        {/* Settings Sidebar */}
                        <div className={styles.settingsSidebar}>
                            <h2 className={styles.settingsTitle}>Ajustes</h2>
                            <div className={styles.settingsNav}>
                                {['General', 'Estadísticas', 'Notificaciones', 'Personalización', 'Aplicaciones', 'Datos', 'Seguridad', 'Cuenta'].map(tab => (
                                    <button
                                        key={tab}
                                        className={`${styles.settingsTab} ${activeSettingsTab === tab ? styles.activeSettingsTab : ''}`}
                                        onClick={() => setActiveSettingsTab(tab)}
                                    >
                                        {tab === 'General' && <Settings size={16} />}
                                        {tab === 'Estadísticas' && <BarChart3 size={16} />}
                                        {tab === 'Notificaciones' && <AlertCircle size={16} />}
                                        {tab === 'Personalización' && <Sparkles size={16} />}
                                        {tab === 'Aplicaciones' && <Plus size={16} />}
                                        {tab === 'Datos' && <Trash2 size={16} />}
                                        {tab === 'Seguridad' && <Check size={16} />}
                                        {tab === 'Cuenta' && <User size={16} />}
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            <div className={styles.settingsSidebarFooter}>
                                <button className={styles.logoutBtn} onClick={handleLogout}>
                                    <LogOut size={16} /> Cerrar sesión
                                </button>
                            </div>
                        </div>

                        {/* Settings Content */}
                        <div className={styles.settingsContent}>
                            <div className={styles.settingsContentHeader}>
                                <h3>{activeSettingsTab}</h3>
                                <X className={styles.closeBtn} onClick={() => setShowSettings(false)} />
                            </div>

                            <div className={styles.settingsScrollArea}>
                                {activeSettingsTab === 'General' && (
                                    <div className={styles.settingsSection}>
                                        <div className={styles.settingGroup}>
                                            <label>Nombre de Usuario</label>
                                            <input className={styles.input} value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Tu nombre" />
                                        </div>
                                        <div className={styles.settingGroup}>
                                            <label>Apariencia</label>
                                            <div className={styles.radioGroup}>
                                                {['Claro', 'Oscuro', 'Sistema'].map(mode => (
                                                    <button
                                                        key={mode}
                                                        className={`${styles.radioBtn} ${appearance === mode ? styles.activeRadio : ''}`}
                                                        onClick={() => setAppearance(mode)}
                                                    >
                                                        {mode}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className={styles.settingGroup}>
                                            <label>Idioma</label>
                                            <select className={styles.select} value={language} onChange={(e) => setLanguage(e.target.value)}>
                                                <option>Español</option>
                                                <option>Inglés</option>
                                                <option>Francés</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {activeSettingsTab === 'Estadísticas' && (
                                    <div className={styles.settingsSection}>
                                        <div className={styles.statsGrid}>
                                            <div className={styles.statCard}>
                                                <div className={styles.statIcon} style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                                                    <MessageSquare size={20} />
                                                </div>
                                                <div className={styles.statInfo}>
                                                    <span className={styles.statLabel}>Mensajes enviados</span>
                                                    <span className={styles.statValue}>{totalMessages}</span>
                                                </div>
                                            </div>
                                            <div className={styles.statCard}>
                                                <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                                                    <Zap size={20} />
                                                </div>
                                                <div className={styles.statInfo}>
                                                    <span className={styles.statLabel}>Tokens utilizados</span>
                                                    <span className={styles.statValue}>{totalTokens.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className={styles.statCard}>
                                                <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                                    <Check size={20} />
                                                </div>
                                                <div className={styles.statInfo}>
                                                    <span className={styles.statLabel}>Chats creados</span>
                                                    <span className={styles.statValue}>{savedChats.length}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles.usageChartPlaceholder}>
                                            <div className={styles.placeholderIcon}><BarChart3 size={32} /></div>
                                            <p>El historial detallado de uso estará disponible próximamente.</p>
                                        </div>
                                    </div>
                                )}

                                {activeSettingsTab === 'Personalización' && (
                                    <div className={styles.settingsSection}>
                                        <div className={styles.settingGroup}>
                                            <label>Nombre del Bot</label>
                                            <input className={styles.input} value={botName} onChange={(e) => setBotName(e.target.value)} />
                                        </div>
                                        <div className={styles.settingGroup}>
                                            <label>Instrucciones del Sistema</label>
                                            <textarea className={styles.textareaField} value={systemInstructions} onChange={(e) => setSystemInstructions(e.target.value)} rows={4} />
                                        </div>
                                        <div className={styles.settingGroup}>
                                            <label>Tonalidad de Respuesta</label>
                                            <div className={styles.radioGroup}>
                                                {['Formal', 'Casual', 'Profesional', 'Divertido'].map(tone => (
                                                    <button
                                                        key={tone}
                                                        className={`${styles.radioBtn} ${botTone === tone ? styles.activeRadio : ''}`}
                                                        onClick={() => setBotTone(tone)}
                                                    >
                                                        {tone}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className={styles.settingToggle}>
                                            <span>Uso de Emojis</span>
                                            <input type="checkbox" checked={useEmojis} onChange={(e) => setUseEmojis(e.target.checked)} />
                                        </div>
                                        <div className={styles.settingToggle}>
                                            <span>Búsqueda Web (Tavily)</span>
                                            <input type="checkbox" checked={useWebSearch} onChange={(e) => setUseWebSearch(e.target.checked)} />
                                        </div>
                                        <div className={styles.settingToggle}>
                                            <span>Razonamiento (Nemotron)</span>
                                            <input type="checkbox" checked={useReasoning} onChange={(e) => setUseReasoning(e.target.checked)} />
                                        </div>
                                    </div>
                                )}

                                {activeSettingsTab === 'Seguridad' && (
                                    <div className={styles.settingsSection}>
                                        <div className={styles.bannerMFA}>
                                            <div className={styles.bannerContent}>
                                                <strong>🔒 Protege tu cuenta</strong>
                                                <p>Activa la autenticación multifactor para mayor seguridad.</p>
                                            </div>
                                            <button className={styles.bannerBtn}>Configurar MFA</button>
                                        </div>
                                        <div className={styles.settingGroup}>
                                            <label>Correo Electrónico</label>
                                            <input className={styles.input} value={user?.email || ''} readOnly />
                                        </div>
                                    </div>
                                )}

                                {activeSettingsTab === 'Notificaciones' && (
                                    <div className={styles.settingsSection}>
                                        <div className={styles.settingToggle}>
                                            <div className={styles.toggleLabel}>
                                                <span>Notificaciones por email</span>
                                                <small>Recibe avisos de seguridad y resúmenes</small>
                                            </div>
                                            <input type="checkbox" defaultChecked />
                                        </div>
                                        <div className={styles.settingToggle}>
                                            <div className={styles.toggleLabel}>
                                                <span>Avisos en el navegador</span>
                                                <small>Notificaciones push en tiempo real</small>
                                            </div>
                                            <input type="checkbox" defaultChecked />
                                        </div>
                                    </div>
                                )}

                                {activeSettingsTab === 'Aplicaciones' && (
                                    <div className={styles.settingsSection}>
                                        <div className={styles.bannerMFA} style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                            <div className={styles.bannerContent}>
                                                <strong>🔌 Sigma API</strong>
                                                <p>Conecta Sigma AI con tus propias aplicaciones.</p>
                                            </div>
                                            <button className={styles.bannerBtn} style={{ background: '#333' }}>Próximamente</button>
                                        </div>
                                        <div className={styles.settingGroup}>
                                            <label>Claves de API</label>
                                            <div className={styles.apiKeysPlaceholder}>No hay claves activas</div>
                                        </div>
                                    </div>
                                )}

                                {activeSettingsTab === 'Datos' && (
                                    <div className={styles.settingsSection}>
                                        <div className={styles.dangerZone}>
                                            <div className={styles.dangerItem}>
                                                <div className={styles.dangerText}>
                                                    <span>Eliminar todo el historial</span>
                                                    <p>Esta acción no se puede deshacer.</p>
                                                </div>
                                                <button className={styles.dangerBtn} onClick={async () => {
                                                    if (confirm('¿Seguro que quieres borrar todo el historial?')) {
                                                        const { error } = await supabase.from('chats').delete().eq('user_id', user.id);
                                                        if (!error) fetchChats(user.id);
                                                    }
                                                }}>Borrar todo</button>
                                            </div>
                                            <div className={styles.dangerItem}>
                                                <div className={styles.dangerText}>
                                                    <span>Descargar mis datos</span>
                                                    <p>Obtén un archivo JSON con todos tus chats.</p>
                                                </div>
                                                <button className={styles.secondaryBtn} onClick={() => handleShare(JSON.stringify(savedChats, null, 2))}>Descargar</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSettingsTab === 'Cuenta' && (
                                    <div className={styles.settingsSection}>
                                        <div className={styles.profileEditHeader}>
                                            <div className={styles.profileAvatarLarge}>
                                                {profilePic ? <img src={profilePic} alt="Avatar" /> : userName.substring(0, 2).toUpperCase()}
                                            </div>
                                            <button className={styles.secondaryBtn}>Cambiar foto</button>
                                        </div>
                                        <div className={styles.settingGroup}>
                                            <label>Estado de la cuenta</label>
                                            <div className={styles.accountBadge}>Verificada ✓</div>
                                        </div>
                                        <div className={styles.settingGroup}>
                                            <label>Rol</label>
                                            <input className={styles.input} value={userRole} readOnly />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={styles.settingsFooter}>
                                <button className={styles.saveSettingsBtn} onClick={saveSettings}>
                                    <Check size={16} /> Guardar cambios
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
