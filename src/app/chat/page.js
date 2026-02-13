'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import {
    Plus, Search, Image as ImageIcon, X,
    ChevronDown, Settings, Mic, Send, User, Bot, Sparkles, MessageSquare, LogOut, Camera,
    Copy, Check, Trash2, AlertCircle, Upload,
    ThumbsUp, ThumbsDown, Share, RotateCcw, MoreHorizontal, Brain, ChevronUp, PanelLeft, Square,
    Archive, Flag, BarChart3, Zap
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

const guestModel = { modelId: 'openai/gpt-oss-120b:free', modelName: 'Sigma LLM 1 Mini', provider: 'openrouter', hostedId: 'openai/gpt-oss-120b:free', platformLink: 'https://openrouter.ai', imageInput: false, maxContext: 32768 };

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
    const [userName, setUserName] = useState('Ayoub Louah');
    const [userRole, setUserRole] = useState('Admin @ Sigma');
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
    const isAtBottomRef = useRef(true); // Inicializar como true para hacer scroll al inicio
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const attachMenuRef = useRef(null);
    const messagesRef = useRef(messages);
    const streamAbortRef = useRef(null);

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
                setSelectedModel(guestModel);
                setBotName('Sigma LLM 1 Mini');
                setSystemInstructions('Eres sigmaLLM 1, un modelo avanzado creado por Sigma Company. Mantén un tono profesional y amigable.');
                console.log('🤖 Bot configurado:', 'Sigma LLM 1 Mini');
                console.log('📋 Instrucciones del sistema establecidas');
                return;
            }

            setUser(user);
            setIsGuest(false);
            
            // Verificación de Onboarding
            const { data: profile } = await supabase
                .from('profiles')
                .select('onboarding_completed')
                .eq('id', user.id)
                .single();

            if (!profile || !profile.onboarding_completed) {
                window.location.href = '/onboarding';
                return;
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

        // Save User Message and Get Chat ID
        let chatId = currentChatId;
        if (isGuest) {
            console.log('💬 [INVITADO] Mensaje de usuario:', input);
            console.log('🖼️ [INVITADO] Imagen adjunta:', !!userMsg.image);
        } else if (user) {
            console.log('💾 Saving user message to DB...');
            try {
                if (!chatId) {
                    console.log('🆕 Creating new chat thread...');
                    const { data: chatData, error: chatError } = await supabase
                        .from('chats')
                        .insert({
                            user_id: user.id,
                            title: (input || '').slice(0, 30) || 'Nuevo Chat',
                            created_at: new Date().toISOString()
                        })
                        .select()
                        .single();
                    if (chatError) throw chatError;
                    chatId = chatData.id;
                    setCurrentChatId(chatId);
                    console.log('✅ Chat created with ID:', chatId);
                    fetchChats(user.id);
                }

                await supabase.from('messages').insert({
                    chat_id: chatId,
                    role: 'user',
                    content: input,
                    image: userMsg.image,
                    created_at: new Date().toISOString()
                });
                console.log('✅ User message saved');
            } catch (err) {
                console.warn('❌ Error saving user message:', err);
            }
        }

        // Add assistant placeholder
        setMessages(prev => [...prev, { role: 'assistant', content: '...', timestamp: new Date().toISOString() }]);

        const controller = new AbortController();
        streamAbortRef.current = controller;

        try {
            let modelToUse = useReasoning ? 'nvidia/nemotron-nano-12b-v2-vl:free' : selectedModel.modelId;
            if (isGuest) {
                console.log('🚀 [INVITADO] Modelo: Sigma LLM 1 Mini');
                console.log('🆔 [INVITADO] ID del modelo:', modelToUse);
                console.log('📤 [INVITADO] Enviando solicitud a OpenRouter/Chat API...');
            } else {
                console.log('🚀 Using model:', modelToUse);
            }
            
            // Real Web Search Logic
            let searchContext = "";
            if (useWebSearch) {
                console.log('🌐 Web Search enabled, searching Tavily...');
                setMessages(prev => {
                    const last = [...prev];
                    last[last.length - 1] = { ...last[last.length - 1], isSearching: true };
                    return last;
                });

                try {
                    const searchResp = await fetch('/api/search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: input })
                    });
                    
                    if (searchResp.ok) {
                        const searchData = await searchResp.json();
                        if (searchData.success) {
                            searchContext = `\n\n[CONTEXTO DE BÚSQUEDA WEB (Tavily)]:\n${searchData.result}\n\nUtiliza esta información para responder de forma precisa y actualizada. Menciona las fuentes si es posible.`;
                            console.log('✅ Search results retrieved from Tavily:', searchData.result.slice(0, 100) + '...');
                        } else {
                            console.warn('⚠️ Search returned no results');
                        }
                    } else {
                        console.error('❌ Search API error:', searchResp.status);
                    }
                } catch (searchErr) {
                    console.error('💥 Search fetch failed:', searchErr);
                }

                setMessages(prev => {
                    const last = [...prev];
                    last[last.length - 1] = { ...last[last.length - 1], isSearching: false };
                    return last;
                });
            }

            console.log('📤 Sending final request to OpenRouter/Chat API...');
            
            // Inject search context into the last user message to ensure the model sees it and uses it
            const messagesForAPI = [...newMessages];
            if (searchContext) {
                const lastIdx = messagesForAPI.length - 1;
                messagesForAPI[lastIdx] = {
                    ...messagesForAPI[lastIdx],
                    content: messagesForAPI[lastIdx].content + searchContext
                };
                console.log('💉 Search context injected into last USER message');
            }

            const response = await fetch('/api/chat', {
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

            if (!response.ok) throw new Error('API Error');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let botResponse = '';
            let hasCollapsedThinking = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    if (isGuest) {
                        console.log('✅ [INVITADO] Stream completado');
                        console.log('📊 [INVITADO] Longitud de respuesta:', botResponse.length);
                    } else {
                        console.log('✅ Stream finished');
                    }
                    break;
                }

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '').trim();
                        if (dataStr === '[DONE]') {
                            console.log('🏁 Stream data [DONE]');
                            continue;
                        }
                        try {
                            const json = JSON.parse(dataStr);
                            const content = json.choices?.[0]?.delta?.content || '';
                            
                            // Even if content is empty (start of stream), we update to clear the '...' placeholder
                            botResponse += content;
                            if (isGuest && content) {
                                console.log('📥 [INVITADO] Chunk recibido:', `"${content}"`);
                            }

                            // Auto-collapse thinking block AS SOON AS </think> is detected
                            if (!hasCollapsedThinking && botResponse.includes('</think>')) {
                                hasCollapsedThinking = true;
                                console.log('🧠 Thinking block completed, collapsing...');
                                setMessages(prev => {
                                    const lastIdx = prev.length - 1;
                                    setCollapsedThinking(c => ({ ...c, [lastIdx]: true }));
                                    return prev;
                                });
                            }

                            setMessages(prev => {
                                const last = [...prev];
                                const lastMsg = last[last.length - 1];
                                
                                // Update content and ensure isSearching is false
                                last[last.length - 1] = {
                                    ...lastMsg,
                                    content: botResponse,
                                    isSearching: false
                                };
                                return last;
                            });
                        } catch (e) { /* ignore partial json */ }
                    }
                }
            }

            // Save Assistant Message
            if (isGuest) {
                console.log('🤖 [INVITADO] Respuesta de Sigma LLM 1 Mini:', botResponse.slice(0, 100) + '...');
            } else if (user && chatId && botResponse) {
                // Check if the response is a SEARCH command
                if (botResponse.startsWith('SEARCH:')) {
                    const searchQuery = botResponse.replace('SEARCH:', '').trim();
                    console.log('🔍 Auto-Search detected for:', searchQuery);
                    
                    setMessages(prev => {
                        const last = [...prev];
                        last[last.length - 1] = { 
                            ...last[last.length - 1], 
                            isSearching: true,
                            content: `Buscando información sobre: ${searchQuery}...`
                        };
                        return last;
                    });

                    try {
                        const searchResp = await fetch('/api/search', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ query: searchQuery })
                        });

                        if (searchResp.ok) {
                            const searchData = await searchResp.json();
                            if (searchData.success) {
                                const searchContext = `\n\n[CONTEXTO DE BÚSQUEDA WEB]:\n${searchData.result}\n\nResponde a la consulta original del usuario usando esta información de forma detallada.`;
                                
                                console.log('✅ Search context retrieved, re-calling Chat API...');
                                
                                // Reset for the second call
                                let secondBotResponse = '';
                                
                                const secondMessagesForAPI = [...newMessages];
                                const lastIdx = secondMessagesForAPI.length - 1;
                                secondMessagesForAPI[lastIdx] = {
                                    ...secondMessagesForAPI[lastIdx],
                                    content: secondMessagesForAPI[lastIdx].content + searchContext
                                };

                                const secondResponse = await fetch('/api/chat', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        messages: secondMessagesForAPI,
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

                                if (secondResponse.ok) {
                                    const secondReader = secondResponse.body.getReader();
                                    
                                    setMessages(prev => {
                                        const last = [...prev];
                                        last[last.length - 1] = { 
                                            ...last[last.length - 1], 
                                            isSearching: false,
                                            content: '',
                                            source: 'Tavily Search'
                                        };
                                        return last;
                                    });

                                    while (true) {
                                        const { done, value } = await secondReader.read();
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
                                                    secondBotResponse += content;
                                                    
                                                    setMessages(prev => {
                                                        const last = [...prev];
                                                        last[last.length - 1] = {
                                                            ...last[last.length - 1],
                                                            content: secondBotResponse
                                                        };
                                                        return last;
                                                    });
                                                } catch (e) {}
                                            }
                                        }
                                    }
                                    
                                    // Final save of the second response
                                    botResponse = secondBotResponse;
                                }
                            }
                        }
                    } catch (searchErr) {
                        console.error('💥 Auto-search failed:', searchErr);
                    }
                }

                await supabase.from('messages').insert({
                    chat_id: chatId,
                    role: 'assistant',
                    content: botResponse,
                    created_at: new Date().toISOString()
                });
                
                // Update Statistics
                const estimatedTokens = Math.ceil(botResponse.length / 4) + 10;
                updateUserStats(estimatedTokens);

                fetchChats(user.id);
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

                // Save User Message to DB
                let chatId = currentChatId;
                if (user) {
                    try {
                        if (!chatId) {
                            const { data: chatData } = await supabase.from('chats').insert({
                                user_id: user.id,
                                title: 'Análisis de Imagen',
                                created_at: new Date().toISOString()
                            }).select().single();
                            if (chatData) {
                                chatId = chatData.id;
                                setCurrentChatId(chatId);
                                fetchChats(user.id);
                            }
                        }
                        if (chatId) {
                            await supabase.from('messages').insert({
                                chat_id: chatId,
                                role: 'user',
                                content: userMsg.content,
                                image: userMsg.image,
                                created_at: new Date().toISOString()
                            });
                        }
                    } catch (dbErr) {
                        console.error('❌ Error saving user image message:', dbErr);
                    }
                }

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

                    // Update assistant message with analysis (SILENT - only in console for debugging)
                    console.log('✅ Vision analysis complete (' + chunkCount + ' chunks):', description.slice(0, 100) + '...');
                    
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
                            content: `Basado en el análisis de la imagen: ${description}. Responde a lo que se ve o a la consulta del usuario.`
                        }
                    ];
                    console.log('📤 Calling /api/chat with model:', selectedModel.modelId);

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
                    let reasoningContent = '';
                    let hasCollapsedThinking = false;

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
                                    const delta = json.choices?.[0]?.delta || {};
                                    const content = delta.content || '';
                                    const reasoning = delta.reasoning || '';
                                    
                                    if (reasoning) {
                                        reasoningContent += reasoning;
                                    }

                                    if (content) {
                                        sigmaResponse += content;
                                    }

                                    // Combine reasoning and content
                                    let fullDisplayContent = sigmaResponse;
                                    if (reasoningContent) {
                                        fullDisplayContent = `<think>\n${reasoningContent}\n</think>\n${sigmaResponse}`;
                                        
                                        if (!hasCollapsedThinking && sigmaResponse.length > 0) {
                                            hasCollapsedThinking = true;
                                            setMessages(prev => {
                                                const lastIdx = prev.length - 1;
                                                setCollapsedThinking(c => ({ ...c, [lastIdx]: true }));
                                                return prev;
                                            });
                                        }
                                    }

                                    setMessages(prev => {
                                        const last = [...prev];
                                        last[last.length - 1] = {
                                            ...last[last.length - 1],
                                            content: fullDisplayContent || '...'
                                        };
                                        return last;
                                    });
                                } catch (e) { console.log('⚠️ Chat parse error'); }
                            }
                        }
                    }

                    console.log('✅ Chat response complete');

                    // Save Assistant Message to DB
                    if (user && chatId && (sigmaResponse || reasoningContent)) {
                        const finalContent = reasoningContent 
                            ? `<think>\n${reasoningContent}\n</think>\n${sigmaResponse}`
                            : sigmaResponse;
                            
                        await supabase.from('messages').insert({
                            chat_id: chatId,
                            role: 'assistant',
                            content: finalContent,
                            created_at: new Date().toISOString()
                        });
                        
                        // Update Statistics
                        const estimatedTokens = Math.ceil(finalContent.length / 4) + 50; // Extra tokens for image analysis
                        updateUserStats(estimatedTokens);

                        console.log('✅ Assistant message saved to chat:', chatId);
                    }

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
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                alert('Enlace copiado al portapapeles');
                            }}
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
                                        {msg.image && (
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
                                                    if(confirm('¿Seguro que quieres borrar todo el historial?')) {
                                                        const { error } = await supabase.from('chats').delete().eq('user_id', user.id);
                                                        if(!error) fetchChats(user.id);
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
                                <button className={styles.saveBtn} onClick={saveSettings}>Guardar Cambios</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
