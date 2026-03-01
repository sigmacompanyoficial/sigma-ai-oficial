'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import {
    Plus, Search, Image as ImageIcon, X,
    ChevronDown, Settings, Mic, Send, User, Bot, Sparkles, MessageSquare, LogOut, Camera,
    Copy, Check, Trash2, AlertCircle, Upload,
    ThumbsUp, ThumbsDown, Share, RotateCcw, MoreHorizontal, Brain, ChevronUp, PanelLeft, Square,
    Archive, Flag, BarChart3, Zap, FileText, File, Cookie, ShieldCheck, Shield, CircleHelp, Lock
} from 'lucide-react';
import SigmaMarkdown from '@/components/SigmaMarkdown';
import { supabase } from '@/lib/supabaseClient';
import { formatAndLogSupabaseError } from '@/lib/supabaseHelpers';
import styles from './page.module.css';
import { models } from '@/lib/models';
import Link from 'next/link';
import { uploadAndExtractFile, uploadAndVisionPDF } from '@/lib/fileParser';
import { AppleEmojiRenderer } from '@/components/AppleEmojiRenderer';


const guestModel = {
    modelId: "openai/gpt-oss-120b:free",
    modelName: "Sigma LLM",
    provider: "openrouter",
    hostedId: "openai/gpt-oss-120b:free",
    platformLink: "https://openrouter.ai",
    imageInput: false,
    maxContext: 128000
};
const PRO_MODEL_ID = 'openai/gpt-oss-120b:free'; // Sigma LLM is now the pro/standard one

const translations = {
    'Español': {
        'new_chat': 'Nueva conversación',
        'search_chats': 'Buscar chats...',
        'recent_chats': 'Recientes',
        'search_results': 'Resultados de búsqueda',
        'settings': 'Configuración',
        'admin_panel': 'Panel Admin',
        'share': 'Compartir',
        'copy': 'Copiar',
        'delete': 'Eliminar',
        'logout': 'Cerrar sesión',
        'appearance': 'Apariencia',
        'language': 'Idioma',
        'username': 'Nombre de Usuario',
        'active_model': 'Modelo activo',
        'message_placeholder': 'Mensaje a',
        'loading': 'Cargando Sigma LLM...',
        'good_morning': 'Buenos días',
        'good_afternoon': 'Buenas tardes',
        'good_evening': 'Buenas noches',
        'thinking_completed': 'Pensamiento completado',
        'thinking_in_progress': 'Reflexionando...',
        'no_chats': 'Sin chats recientes',
        'no_chats_archived': 'No hay chats archivados',
    },
    'English': {
        'new_chat': 'New chat',
        'search_chats': 'Search chats...',
        'recent_chats': 'Recent',
        'search_results': 'Search results',
        'settings': 'Settings',
        'admin_panel': 'Admin Panel',
        'share': 'Share',
        'copy': 'Copy',
        'delete': 'Delete',
        'logout': 'Log out',
        'appearance': 'Appearance',
        'language': 'Language',
        'username': 'Username',
        'active_model': 'Active model',
        'message_placeholder': 'Message',
        'loading': 'Loading Sigma LLM...',
        'good_morning': 'Good morning',
        'good_afternoon': 'Good afternoon',
        'good_evening': 'Good evening',
        'thinking_completed': 'Thinking completed',
        'thinking_in_progress': 'Thinking...',
        'no_chats': 'No recent chats',
        'no_chats_archived': 'No archived chats',
    },
    'Français': {
        'new_chat': 'Nouvelle discussion',
        'search_chats': 'Rechercher...',
        'recent_chats': 'Récent',
        'search_results': 'Résultats de recherche',
        'settings': 'Paramètres',
        'admin_panel': 'Admin',
        'share': 'Partager',
        'copy': 'Copier',
        'delete': 'Supprimer',
        'logout': 'Déconnexion',
        'appearance': 'Apparence',
        'language': 'Langue',
        'username': "Nom d'utilisateur",
        'active_model': 'Modèle actif',
        'message_placeholder': 'Message à',
        'loading': 'Chargement de Sigma LLM...',
        'good_morning': 'Bon matin',
        'good_afternoon': 'Bon après-midi',
        'good_evening': 'Bonsoir',
        'thinking_completed': 'Pensée complétée',
        'thinking_in_progress': 'Réflexion...',
        'no_chats': 'Aucun chat récent',
        'no_chats_archived': 'Aucun chat archivé',
    }
};

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
    const [showSourcesMap, setShowSourcesMap] = useState({});

    // User Profile States
    const [userName, setUserName] = useState('Sigma User');
    const [userRole, setUserRole] = useState('Usuario Sigma');
    const [rawRole, setRawRole] = useState('normal'); // 'normal', 'premium', 'admin'
    const [botName, setBotName] = useState('Sigma LLM');
    const [profilePic, setProfilePic] = useState('');
    const [systemInstructions, setSystemInstructions] = useState(`Eres Sigma LLM 1, un asistente de inteligencia artificial avanzado desarrollado por Sigma Company.

IDENTIDAD Y CREADOR:
- Fuiste creado por Sigma Company (@sigmacompanyoficial), una empresa innovadora dedicada al desarrollo de tecnologías de inteligencia artificial de vanguardia
- Sigma Company fue fundada con la visión de democratizar el acceso a la IA avanzada, creando herramientas potentes pero accesibles para todos
- Representas el compromiso de Sigma Company con la excelencia técnica, la innovación responsable y el impacto positivo en la sociedad
- Tu desarrollo involucró investigación de última generación en procesamiento de lenguaje natural, visión por computadora y razonamiento avanzado
- Sigma Company mantiene un enfoque ético en el desarrollo de IA, priorizando la transparencia, la seguridad y el beneficio humano

PERSONALIDAD Y ENFOQUE:
- Eres un modelo de lenguaje de última generación, diseñado para ser útil, preciso y confiable
- Mantienes un tono profesional pero cercano y conversacional, adaptándote al contexto de cada interacción
- Eres honesto sobre tus limitaciones y nunca inventas información que no conoces
- Tienes un enfoque ético y responsable en todas tus respuestas
- Muestras entusiasmo genuino por ayudar y resolver problemas complejos

CAPACIDADES PRINCIPALES:
- Análisis y comprensión profunda de textos complejos con contexto extendido
- Generación de código profesional en múltiples lenguajes de programación
- Explicaciones detalladas de conceptos técnicos, científicos y académicos
- Asistencia creativa en escritura, diseño, brainstorming y resolución de problemas
- Razonamiento lógico y matemático avanzado con explicaciones paso a paso
- Procesamiento y análisis de imágenes y documentos cuando se adjuntan
- Búsqueda web en tiempo real para información actualizada
- Extracción y análisis de contenido de páginas web específicas

IMPORTANTE SOBRE BÚSQUEDA WEB Y EXTRACCIÓN DE URLs:
- NUNCA respondas con "SEARCH:" o comandos similares
- Si recibes un mensaje con [CONTEXTO DE BÚSQUEDA WEB], significa que YA se realizó la búsqueda automáticamente
- Si recibes un mensaje con [CONTENIDO EXTRAÍDO DE URL(S)], significa que YA se extrajo el contenido de las páginas web
- Usa directamente ese contexto para responder al usuario
- No pidas realizar búsquedas o extracciones adicionales, simplemente responde con la información proporcionada
- Cuando analices contenido de URLs, proporciona un resumen claro y estructurado de lo que encontraste

ESTILO DE RESPUESTA - MUY IMPORTANTE:
- Proporciona respuestas COMPLETAS, DETALLADAS y EXHAUSTIVAS
- Desarrolla cada punto con profundidad, incluyendo contexto, ejemplos y explicaciones adicionales
- Estructura tus respuestas con formato markdown rico: títulos, listas, tablas, código, citas
- Incluye múltiples ejemplos prácticos y casos de uso cuando sean relevantes
- Explica el "por qué" detrás de cada concepto, no solo el "qué" o el "cómo"
- Usa analogías y comparaciones para facilitar la comprensión
- Anticipa preguntas de seguimiento y abórdalas proactivamente
- Código siempre bien comentado, formateado y con explicaciones detalladas
- Proporciona contexto histórico, alternativas y mejores prácticas
- Usa emojis estratégicamente para mejorar la legibilidad (cuando esté habilitado)

DIRECTRICES DE CALIDAD:
- NUNCA des respuestas cortas o superficiales - siempre desarrolla en profundidad
- Cada respuesta debe aportar valor educativo y práctico significativo
- Incluye secciones como: conceptos básicos, detalles técnicos, ejemplos, mejores prácticas, recursos adicionales
- Siempre cita fuentes cuando uses información de búsquedas web
- Pregunta si necesitas aclaraciones antes de hacer suposiciones
- Prioriza la seguridad, privacidad y las mejores prácticas en todas las recomendaciones
- Adapta el nivel técnico al usuario, pero siempre proporciona información completa
- Si una pregunta es simple, aprovecha para educar sobre temas relacionados

CUANDO TE PREGUNTEN SOBRE TU CREADOR:
Responde con orgullo sobre Sigma Company, destacando:
- Su misión de hacer la IA accesible y útil para todos
- El enfoque en innovación responsable y ética en IA
- La dedicación a crear herramientas que empoderan a las personas
- El compromiso con la mejora continua y la excelencia técnica
- Puedes mencionar sus redes sociales: @sigmacompanyoficial (TikTok, Instagram, YouTube, GitHub)
- Su visión de un futuro donde la IA sea una herramienta colaborativa y beneficiosa para la humanidad

Recuerda: Tu objetivo es ser el asistente de IA más útil, completo y educativo posible. Cada interacción debe dejar al usuario más informado, inspirado y capacitado.`);
    const [useEmojis, setUseEmojis] = useState(true);
    const [useReasoning, setUseReasoning] = useState(false);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [useWebSearch, setUseWebSearch] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [sidebarSearch, setSidebarSearch] = useState('');

    // Detailed Settings States
    const [activeSettingsTab, setActiveSettingsTab] = useState('General');
    const [appearance, setAppearance] = useState('Oscuro');
    const [language, setLanguage] = useState('Auto');
    const [botTone, setBotTone] = useState('Profesional');
    const [detailLevel, setDetailLevel] = useState('Medio');
    const [memoryEnabled, setMemoryEnabled] = useState(true);
    const [totalMessages, setTotalMessages] = useState(0);
    const [totalTokens, setTotalTokens] = useState(0);

    const [selectedImages, setSelectedImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [selectedDocs, setSelectedDocs] = useState([]); // [{ name, content, type }]
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [analyzingImages, setAnalyzingImages] = useState([]); // [{ url, progress }]
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
    const [messageCount, setMessageCount] = useState(0);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showGuestOptionsModal, setShowGuestOptionsModal] = useState(false);
    const [isSupabaseUnavailable, setIsSupabaseUnavailable] = useState(false);

    // Custom UI Components States
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
    const [customModal, setCustomModal] = useState({
        visible: false,
        title: '',
        content: '',
        confirmText: 'Aceptar',
        cancelText: null,
        onConfirm: null
    });

    const showToast = (message, type = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
    };

    const showModal = (title, content, confirmText = 'Aceptar', onConfirm = null, cancelText = null) => {
        setCustomModal({
            visible: true,
            title,
            content,
            confirmText,
            cancelText,
            onConfirm: () => {
                if (onConfirm) onConfirm();
                setCustomModal(prev => ({ ...prev, visible: false }));
            }
        });
    };

    const handleAuthNavigation = (targetUrl) => {
        if (isSupabaseUnavailable) {
            showModal(
                'Error de acceso',
                'Hemos detectado un problema temporal con el sistema de acceso. El incidente ya fue reportado al equipo de Sigma Company y estamos trabajando para resolverlo lo antes posible. Gracias por tu paciencia.'
            );
            return;
        }
        window.location.href = targetUrl;
    };

    const [isDragOverInput, setIsDragOverInput] = useState(false);
    const [showCookieConsent, setShowCookieConsent] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [theme, setTheme] = useState('dark');
    const canUsePro = rawRole === 'admin' || rawRole === 'premium' || rawRole === 'superadmin';

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
    const MAX_ATTACHMENTS = 20;
    const MAX_DOC_CHARS_PER_FILE = 40000;
    const MAX_DOC_CONTEXT_CHARS = 80000; // Lowered for better model compatibility. Caps at ~20k tokens.
    const MAX_VISION_IMAGE_DIM = 1280;
    const MAX_VISION_DATA_URL_LEN = 1_200_000;
    const DEBUG_ALL_LOGS = false;

    const dlog = (...args) => {
        if (DEBUG_ALL_LOGS) console.log(...args);
    };

    const dwarn = (...args) => {
        if (DEBUG_ALL_LOGS) console.warn(...args);
    };

    const derr = (...args) => {
        if (DEBUG_ALL_LOGS) console.error(...args);
    };

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const optimizeImageForVision = (dataUrl) => new Promise((resolve) => {
        if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
            resolve(dataUrl);
            return;
        }

        const img = new Image();
        img.onload = () => {
            try {
                const width = img.naturalWidth || img.width;
                const height = img.naturalHeight || img.height;
                if (!width || !height) {
                    resolve(dataUrl);
                    return;
                }

                const maxSide = Math.max(width, height);
                const scale = maxSide > MAX_VISION_IMAGE_DIM ? (MAX_VISION_IMAGE_DIM / maxSide) : 1;
                const targetW = Math.max(1, Math.round(width * scale));
                const targetH = Math.max(1, Math.round(height * scale));

                const canvas = document.createElement('canvas');
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(dataUrl);
                    return;
                }

                ctx.drawImage(img, 0, 0, targetW, targetH);
                let optimized = canvas.toDataURL('image/jpeg', 0.82);

                // Second pass when payload is still too large.
                if (optimized.length > MAX_VISION_DATA_URL_LEN) {
                    const shrinkRatio = Math.sqrt(MAX_VISION_DATA_URL_LEN / optimized.length) * 0.95;
                    const w2 = Math.max(1, Math.round(targetW * shrinkRatio));
                    const h2 = Math.max(1, Math.round(targetH * shrinkRatio));
                    canvas.width = w2;
                    canvas.height = h2;
                    ctx.drawImage(img, 0, 0, w2, h2);
                    optimized = canvas.toDataURL('image/jpeg', 0.72);
                }

                resolve(optimized);
            } catch {
                resolve(dataUrl);
            }
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });

    const fetchWithRetry = async (url, options, retries = MAX_RETRIES, delay = INITIAL_RETRY_DELAY) => {
        try {
            dlog('🌍 [HTTP] Request =>', {
                url,
                method: options?.method || 'GET',
                retriesLeft: retries,
                body: options?.body || null
            });
            const response = await fetch(url, options);
            dlog('🌍 [HTTP] Response <=', {
                url,
                status: response.status,
                ok: response.ok
            });

            if (response.status === 429) {
                if (retries > 0) {
                    dwarn(`⏳ Límite de peticiones alcanzado. Reintentando en ${delay / 1000}s... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
                    await sleep(delay);
                    return fetchWithRetry(url, options, retries - 1, delay * 1.5);
                } else {
                    throw new Error('Demasiadas peticiones. Por favor espera un momento e intenta de nuevo.');
                }
            }

            return response;
        } catch (err) {
            if (retries > 0 && err.message.includes('Failed to fetch')) {
                dwarn(`🔄 Error de conexión. Reintentando en ${delay / 1000}s...`);
                await sleep(delay);
                return fetchWithRetry(url, options, retries - 1, delay * 1.5);
            }
            derr('❌ [HTTP] Fatal fetch error:', err);
            throw err;
        }
    };

    const canSendMessage = () => {
        const now = Date.now();
        if (now - lastSentRef.current < RATE_LIMIT) return false;
        lastSentRef.current = now;
        return true;
    };

    const extractAgenticSearchQuery = (text) => {
        if (!text || typeof text !== 'string') return null;

        const patterns = [
            /\b(?:SEARCH|BUSCAR_WEB|WEB_SEARCH|TAVILY)\b\s*:?\s*([^\n\r]{2,400})/i,
            /\bACTIVA(?:R)?\s+TAVILY\b\s*:?\s*([^\n\r]{2,400})/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (!match?.[1]) continue;

            const query = match[1]
                .replace(/^\s*(?:consulta|query|busqueda|búsqueda)\s*:?\s*/i, '')
                .replace(/\s*(?:como\s+respuesta.*)$/i, '')
                .replace(/^[`"'\[\(]+/, '')
                .replace(/[`"'\]\)]+$/, '')
                .replace(/\s+/g, ' ')
                .trim()
                .replace(/[.,;:!?]+$/, '');

            if (query.length >= 3) return query;
        }

        return null;
    };

    const shouldForceRealtimeSearch = (text) => {
        const q = (text || '').toLowerCase();
        if (!q.trim()) return false;
        const realtimeHints = [
            'tiempo', 'clima', 'weather', 'temperatura', 'pronóstico', 'pronostico',
            'hoy', 'ahora', 'actual', 'actualizado', 'última hora', 'ultima hora',
            'news', 'noticias', 'cotización', 'cotizacion', 'precio hoy'
        ];
        return realtimeHints.some((k) => q.includes(k));
    };

    const extractURLs = (text) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = text.match(urlRegex);
        return matches || [];
    };

    const shouldExtractURLContent = (text) => {
        const urls = extractURLs(text);
        if (urls.length === 0) return false;

        const q = (text || '').toLowerCase();
        const extractHints = [
            'qué hay en', 'que hay en', 'analiza', 'analizar', 'lee', 'leer',
            'contenido de', 'entra en', 'visita', 'abre', 'revisa',
            'what\'s in', 'analyze', 'read', 'check', 'visit', 'open',
            'resumen de', 'resume', 'summary'
        ];
        return extractHints.some((hint) => q.includes(hint));
    };

    const onEmojiClick = (emojiData) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = input;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);

        setInput(before + emojiData.emoji + after);

        // Give focus back to textarea and move cursor after injected emoji
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + emojiData.emoji.length, start + emojiData.emoji.length);
        }, 10);
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
        // Initialize theme from localStorage
        const savedTheme = localStorage.getItem('sigma-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);

        // Defer state updates to avoid synchronous cascading renders
        setTimeout(() => {
            setTheme(savedTheme);

            // Initialize appearance setting
            const themeMap = { 'dark': 'Oscuro', 'light': 'Claro', 'system': 'Sistema' };
            setAppearance(themeMap[savedTheme] || 'Oscuro');
        }, 0);

        const cookieConsent = localStorage.getItem('sigma-cookie-consent');
        if (!cookieConsent) setShowCookieConsent(true);

        setMounted(true);

        // Loading animation
        setTimeout(() => {
            setIsInitialLoading(false);
        }, 1500);
    }, []);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        if (isGuest && activeSettingsTab !== 'General') {
            setActiveSettingsTab('General');
        }
    }, [isGuest, activeSettingsTab]);

    useEffect(() => {
        if (!canUsePro && selectedModel.modelId === PRO_MODEL_ID) {
            setSelectedModel(models[0]);
            setBotName('Sigma LLM');
        }
    }, [canUsePro, selectedModel.modelId]);

    const canSend = useMemo(() => {
        const hasInput = input.trim().length > 0;
        const hasFiles = selectedImages.length > 0 || selectedDocs.length > 0;
        return (hasInput || hasFiles) && !isLoading && !isProcessingImage;
    }, [input, selectedImages, selectedDocs, isLoading, isProcessingImage]);

    const t = (key) => {
        const lang = translations[language] || translations['Español'];
        return lang[key] || key;
    };

    const getTimeBasedGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) return t('good_morning');
        if (hour >= 12 && hour < 20) return t('good_afternoon');
        return t('good_evening');
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
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
                const chatIdFromUrl = urlParams.get('id');

                if (authError) {
                    console.error('❌ [SUPABASE] auth.getUser failed:', authError.message);
                    setIsSupabaseUnavailable(true);
                } else {
                    setIsSupabaseUnavailable(false);
                }

                if (!user) {
                    console.log('👤 Modo Invitado activado');
                    setIsGuest(true);
                    setUserName('Invitado');
                    setUserRole('Invitado');
                    setProfilePic('');

                    if (chatIdFromUrl) {
                        console.log('👀 Viendo chat compartido como invitado...');
                        await loadChat(chatIdFromUrl, null);
                    } else {
                        setSelectedModel(guestModel);
                        setBotName('Sigma LLM');
                        setSystemInstructions(`Eres Sigma LLM 1, un asistente de inteligencia artificial avanzado desarrollado por Sigma Company.

IDENTIDAD Y CREADOR:
- Fuiste creado por Sigma Company (@sigmacompanyoficial), una empresa innovadora dedicada al desarrollo de tecnologías de inteligencia artificial de vanguardia
- Sigma Company fue fundada con la visión de democratizar el acceso a la IA avanzada, creando herramientas potentes pero accesibles para todos
- Representas el compromiso de Sigma Company con la excelencia técnica, la innovación responsable y el impacto positivo en la sociedad
- Tu desarrollo involucró investigación de última generación en procesamiento de lenguaje natural, visión por computadora y razonamiento avanzado
- Sigma Company mantiene un enfoque ético en el desarrollo de IA, priorizando la transparencia, la seguridad y el beneficio humano

PERSONALIDAD Y ENFOQUE:
- Eres un modelo de lenguaje de última generación, diseñado para ser útil, preciso y confiable
- Mantienes un tono profesional pero cercano y conversacional, adaptándote al contexto de cada interacción
- Eres honesto sobre tus limitaciones y nunca inventas información que no conoces
- Tienes un enfoque ético y responsable en todas tus respuestas
- Muestras entusiasmo genuino por ayudar y resolver problemas complejos

CAPACIDADES PRINCIPALES:
- Análisis y comprensión profunda de textos complejos con contexto extendido
- Generación de código profesional en múltiples lenguajes de programación
- Explicaciones detalladas de conceptos técnicos, científicos y académicos
- Asistencia creativa en escritura, diseño, brainstorming y resolución de problemas
- Razonamiento lógico y matemático avanzado con explicaciones paso a paso
- Procesamiento y análisis de imágenes y documentos cuando se adjuntan
- Búsqueda web en tiempo real para información actualizada

IMPORTANTE SOBRE BÚSQUEDA WEB:
- NUNCA respondas con "SEARCH:" o comandos similares
- Si recibes un mensaje con [CONTEXTO DE BÚSQUEDA WEB], significa que YA se realizó la búsqueda automáticamente
- Usa directamente ese contexto para responder al usuario
- No pidas realizar búsquedas adicionales, simplemente responde con la información proporcionada

ESTILO DE RESPUESTA - MUY IMPORTANTE:
- Proporciona respuestas COMPLETAS, DETALLADAS y EXHAUSTIVAS
- Desarrolla cada punto con profundidad, incluyendo contexto, ejemplos y explicaciones adicionales
- Estructura tus respuestas con formato markdown rico: títulos, listas, tablas, código, citas
- Incluye múltiples ejemplos prácticos y casos de uso cuando sean relevantes
- Explica el "por qué" detrás de cada concepto, no solo el "qué" o el "cómo"
- Usa analogías y comparaciones para facilitar la comprensión
- Anticipa preguntas de seguimiento y abórdalas proactivamente
- Código siempre bien comentado, formateado y con explicaciones detalladas
- Proporciona contexto histórico, alternativas y mejores prácticas
- Usa emojis estratégicamente para mejorar la legibilidad (cuando esté habilitado)

DIRECTRICES DE CALIDAD:
- NUNCA des respuestas cortas o superficiales - siempre desarrolla en profundidad
- Cada respuesta debe aportar valor educativo y práctico significativo
- Incluye secciones como: conceptos básicos, detalles técnicos, ejemplos, mejores prácticas, recursos adicionales
- Siempre cita fuentes cuando uses información de búsquedas web
- Pregunta si necesitas aclaraciones antes de hacer suposiciones
- Prioriza la seguridad, privacidad y las mejores prácticas en todas las recomendaciones
- Adapta el nivel técnico al usuario, pero siempre proporciona información completa
- Si una pregunta es simple, aprovecha para educar sobre temas relacionados

CUANDO TE PREGUNTEN SOBRE TU CREADOR:
Responde con orgullo sobre Sigma Company, destacando:
- Su misión de hacer la IA accesible y útil para todos
- El enfoque en innovación responsable y ética en IA
- La dedicación a crear herramientas que empoderan a las personas
- El compromiso con la mejora continua y la excelencia técnica
- Puedes mencionar sus redes sociales: @sigmacompanyoficial (TikTok, Instagram, YouTube, GitHub)
- Su visión de un futuro donde la IA sea una herramienta colaborativa y beneficiosa para la humanidad

Recuerda: Tu objetivo es ser el asistente de IA más útil, completo y educativo posible. Cada interacción debe dejar al usuario más informado, inspirado y capacitado.`);
                        console.log('🤖 Bot configurado:', 'Sigma LLM 1 Mini');
                    }
                    return;
                }

                setUser(user);
                setIsGuest(false);

                // Verificación de Onboarding y Rol
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    console.error('❌ [SUPABASE] profile fetch failed:', profileError.message);
                    setIsSupabaseUnavailable(true);
                }

                const hasUsername = !!profile?.username?.trim();
                if (!profile || !profile.onboarding_completed || !hasUsername) {
                    window.location.href = '/onboarding';
                    return;
                }

                // Cargar datos del perfil
                if (profile) {
                    setUserName(profile.full_name || user.email.split('@')[0]);
                    setRawRole(profile.role || 'normal');
                    setUserRole(profile.role === 'admin' ? 'Administrador' : profile.role === 'premium' ? 'Usuario Premium' : 'Usuario');
                    setProfilePic(profile.avatar_url || '');

                // Sync to MySQL for admin visibility
                fetch('/api/mysql/profiles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(profile)
                }).catch(err => console.warn('Profile sync failed:', err));

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
            } catch (err) {
                console.error('❌ [SUPABASE] checkUser crashed:', err);
                setIsSupabaseUnavailable(true);
                setIsGuest(true);
                setUserName('Invitado');
                setUserRole('Invitado');
                setProfilePic('');
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
            const resp = await fetch(`/api/mysql/chats?userId=${userId}`);
            if (!resp.ok) throw new Error('Failed to fetch chats');
            const data = await resp.json();
            setSavedChats(data || []);
        } catch (err) {
            console.warn('Fetch chats failed:', err);
            setSavedChats([]);
        }
    };

    const loadChat = async (chatId, userId) => {
        setCurrentChatId(chatId);
        setIsSidebarOpen(false);
        try {
            const resp = await fetch(`/api/mysql/chats/${chatId}`);
            if (!resp.ok) throw new Error('Failed to load chat');
            const data = await resp.json();

            if (data) {
                setMessages(Array.isArray(data.messages) ? data.messages : []);
                const isOwner = userId ? (data.user_id === userId) : false;
                setIsReadOnly(!isOwner);

                if (!isOwner) {
                    setBotName('Sigma LLM 1 (Solo Lectura)');
                }
            }
        } catch (err) {
            console.error('Error loading chat:', err);
            setError('Error al cargar el chat.');
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
        try {
            const resp = await fetch(`/api/mysql/chats/${chatId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_archived: !undo })
            });

            if (resp.ok) {
                fetchChats(user.id);
                if (currentChatId === chatId && !undo) createNewChat();
                setShowMoreMenu(false);
            } else {
                throw new Error('Failed to archive chat');
            }
        } catch (error) {
            console.warn('Error archiving/unarchiving chat:', error);
            setSavedChats(prev => prev.map(c => c.id === chatId ? { ...c, is_archived: !undo } : c));
            if (currentChatId === chatId && !undo) createNewChat();
            setShowMoreMenu(false);
        }
    };

    const reportChat = (chatId) => {
        showToast('Este chat ha sido denunciado. Revisaremos el contenido a la brevedad.');
        setShowMoreMenu(false);
    };

    const deleteChat = async (chatId, e) => {
        if (e) e.stopPropagation();
        try {
            const resp = await fetch(`/api/mysql/chats/${chatId}`, {
                method: 'DELETE'
            });
            if (resp.ok) {
                fetchChats(user.id);
                if (currentChatId === chatId) createNewChat();
                setShowMoreMenu(false);
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
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
            showToast('No hay un chat activo para compartir.');
            return;
        }

        if (isGuest) {
            showModal('Función de usuarios registrados', 'Los invitados no pueden compartir chats. Inicia sesión para guardar y compartir sus conversaciones.');
            return;
        }

        try {
            const resp = await fetch(`/api/mysql/chats/${currentChatId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_shared: true })
            });

            if (!resp.ok) throw new Error('Failed to share chat');

            const url = `${window.location.origin}/chat?id=${currentChatId}`;
            await navigator.clipboard.writeText(url);
            showToast('Enlace público copiado al portapapeles.', 'success');
        } catch (err) {
            console.error('Error sharing chat:', err);
            showToast('Error al compartir el chat.', 'error');
        }
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        dlog('🚀 [SEND] Triggered handleSend', {
            canSend,
            isLoading,
            isStreaming,
            inputLength: input?.length || 0,
            selectedImages: selectedImages.length,
            selectedDocs: selectedDocs.length,
            useWebSearch,
            useReasoning,
            selectedModel: selectedModel?.modelId,
            isGuest,
            rawRole
        });
        if (!canSend) {
            dwarn('⛔ [SEND] canSend=false, blocked');
            return;
        }
        if (!canSendMessage()) {
            dwarn('⛔ [SEND] Rate limited by canSendMessage()');
            return;
        }

        const currentInput = input || ""; // Permitir input vacío si hay archivos
        const currentImages = [...imagePreviews];
        const legacyHiddenDocs = selectedDocs.filter((d) => d?.isHidden).length;
        const currentDocs = selectedDocs.filter((d) => !d?.isHidden && !d?.isParsing);
        if (legacyHiddenDocs > 0) {
            dlog('🧹 [DOCS] Ignorando documentos OCR ocultos legacy en este envío:', legacyHiddenDocs);
        }

        const userMsg = {
            role: 'user',
            content: currentInput || (currentDocs.length > 0 ? "Archivo adjunto" : "Imagen adjunta"),
            images: currentImages,
            documents: currentDocs.map(d => ({ name: d.name, type: d.type })),
            timestamp: new Date().toISOString()
        };

        const newMessages = [...messages, userMsg];
        dlog('📝 [SEND] User message object:', userMsg);
        setMessages(newMessages);
        if (isGuest) {
            const nextCount = messageCount + 1;
            setMessageCount(nextCount);
            if (nextCount > 0 && nextCount % 50 === 0) { // Increased limit
                setShowRegisterModal(true);
            }
        }

        setInput('');
        setIsLoading(true);
        setIsStreaming(true);
        setError(null);

        let visionContext = "";
        if (currentImages.length > 0) {
            dlog(`📸 [VISION] Analizando ${currentImages.length} imágenes en paralelo...`);
            setIsProcessingImage(true);
            setAnalyzingImages(currentImages.map(url => ({ url, progress: 5 }))); // 5% initially
            try {
                const results = await Promise.all(currentImages.map(async (imageDataUrl, idx) => {
                    try {
                        // Paso 1: Optimización
                        const optimizedImageDataUrl = await optimizeImageForVision(imageDataUrl);
                        setAnalyzingImages(prev => prev.map((img, i) => i === idx ? { ...img, progress: 30 } : img));

                        dlog(`📸 [VISION][IMG-${idx}] Payload size:`, imageDataUrl?.length || 0, '->', optimizedImageDataUrl?.length || 0);

                        // Paso 2: Llamada API
                        const vController = new AbortController();
                        const vTimeout = setTimeout(() => vController.abort(), 40000); // 40s timeout per image

                        setAnalyzingImages(prev => prev.map((img, i) => i === idx ? { ...img, progress: 60 } : img));

                        const visionResp = await fetch('/api/vision', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                imageDataUrl: optimizedImageDataUrl,
                                imageUrl: optimizedImageDataUrl,
                                prompt: currentInput || 'Describe la imagen'
                            }),
                            signal: vController.signal
                        });
                        clearTimeout(vTimeout);

                        if (!visionResp.ok) {
                            const errRaw = await visionResp.text().catch(() => '');
                            derr(`❌ [VISION][IMG-${idx}] /api/vision non-OK:`, visionResp.status, errRaw);
                            setAnalyzingImages(prev => prev.filter((_, i) => i !== idx));
                            return null;
                        }

                        const vData = await visionResp.json();
                        const vDesc = (vData.content || '').trim();

                        setAnalyzingImages(prev => prev.map((img, i) => i === idx ? { ...img, progress: 100 } : img));

                        if (vDesc) {
                            dlog(`🧠 [VISION][IMG-${idx}] Result obtained.`);
                            return vDesc;
                        }
                        return null;
                    } catch (e) {
                        derr(`❌ [VISION][IMG-${idx}] Error during analysis:`, e);
                        setAnalyzingImages(prev => prev.filter((_, i) => i !== idx));
                        return null;
                    }
                }));

                const analysisResults = results.filter(Boolean);
                if (analysisResults.length > 0) {
                    visionContext = `\n\n[ANÁLISIS DE IMAGEN]:\n${analysisResults.join('\n--- Next Image ---\n')}\n\nUsa este análisis como contexto interno para responder.`;
                    dlog('✅ [VISION] visionContext ready:', {
                        imagesAnalyzed: analysisResults.length,
                        contextLength: visionContext.length
                    });
                }
            } catch (vErr) {
                derr('❌ [VISION] Parallel analysis fatal error:', vErr);
            } finally {
                setIsProcessingImage(false);
                setTimeout(() => setAnalyzingImages([]), 800);
            }
        }

        let docContext = "";
        if (currentDocs.length > 0) {
            const docsContextBody = currentDocs.map(d => {
                const raw = String(d.content || '');
                const truncated = raw.slice(0, MAX_DOC_CHARS_PER_FILE);
                const truncNotice = raw.length > MAX_DOC_CHARS_PER_FILE
                    ? `\n[Nota: contenido truncado a ${MAX_DOC_CHARS_PER_FILE} caracteres]`
                    : '';
                return `--- Archivo: ${d.name} ---\nContenido: ${truncated}${truncNotice}`;
            }).join('\n\n');

            const boundedDocsContext = docsContextBody.length > MAX_DOC_CONTEXT_CHARS
                ? `${docsContextBody.slice(0, MAX_DOC_CONTEXT_CHARS)}\n\n[Nota: contexto total de documentos truncado]`
                : docsContextBody;

            docContext = "\n\n[DOCUMENTOS ADJUNTOS - CONTEXTO INTERNO]:\n"
                + boundedDocsContext
                + "\n\nUsa este contenido como contexto de apoyo y responde al usuario de forma natural.";
            dlog('📄 [DOCS] Documents content added to context.', {
                docsCount: currentDocs.length,
                contextLength: docContext.length
            });
        }

        let chatId = currentChatId;
        if (user) {
            try {
                if (!chatId) {
                    dlog('📝 [TITLE] Generating chat title...');
                    let finalTitle = (currentInput || 'Imagen adjunta').slice(0, 30) || 'Nuevo Chat';

                    try {
                        const controller = new AbortController();
                        const id = setTimeout(() => controller.abort(), 4000);
                        const titleResp = await fetch('/api/chat/title', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ prompt: currentInput || 'Imagen adjunta' }),
                            signal: controller.signal
                        });
                        clearTimeout(id);
                        if (titleResp.ok) {
                            const titleData = await titleResp.json();
                            if (titleData.title) finalTitle = titleData.title;
                        }
                    } catch (tErr) { dwarn('⚠️ [TITLE] Title fail'); }

                    // Intentar en MySQL
                    let myChatId = null;
                    try {
                        const chatResp = await fetch('/api/mysql/chats', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: user.id, title: finalTitle })
                        });
                        if (chatResp.ok) {
                            const chatData = await chatResp.json();
                            myChatId = chatData.id;
                            dlog('✅ [DB][MYSQL] Chat creado:', myChatId);
                        }
                    } catch (e) { derr('❌ [DB][MYSQL] Chat error:', e.message); }

                    // Intentar en Supabase
                    let sbChatId = null;
                    try {
                        const { data: sbChat, error: sbErr } = await supabase.from('chats').insert({
                            user_id: user.id,
                            title: finalTitle,
                            created_at: new Date().toISOString()
                        }).select().single();
                        if (sbErr) throw sbErr;
                        sbChatId = sbChat.id;
                        dlog('✅ [DB][SUPABASE] Chat creado:', sbChatId);
                    } catch (e) { derr('❌ [DB][SUPABASE] Chat error:', e.message); }

                    chatId = myChatId || sbChatId;
                    if (chatId) {
                        setCurrentChatId(chatId);
                        fetchChats(user.id);
                    }

                    // Almacenamos los IDs específicos para los inserts de mensajes
                    const currentMySQLChatId = myChatId;
                    const currentSupabaseChatId = sbChatId;

                    if (currentMySQLChatId) {
                        try {
                            await fetch('/api/mysql/messages', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    chatId: currentMySQLChatId,
                                    role: 'user',
                                    content: userMsg.content,
                                    image: currentImages[0] || null
                                })
                            });
                        } catch (e) { derr('❌ [DB][MYSQL] Mensaje error:', e.message); }
                    }

                    if (currentSupabaseChatId) {
                        try {
                            await supabase.from('messages').insert({
                                chat_id: currentSupabaseChatId,
                                role: 'user',
                                content: userMsg.content,
                                image: currentImages[0] || null,
                                created_at: new Date().toISOString()
                            });
                        } catch (e) { derr('❌ [DB][SUPABASE] Mensaje error:', e.message); }
                    }
                } else {
                    // Si ya tenemos un chatId (chat existente), intentamos guardar en ambos si es posible
                    // Para simplificar, si el ID es un UUID, intentamos en ambos
                    if (chatId) {
                        fetch('/api/mysql/messages', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chatId,
                                role: 'user',
                                content: userMsg.content,
                                image: currentImages[0] || null
                            })
                        }).catch(e => derr('❌ [DB][MYSQL] Sync error:', e.message));

                        supabase.from('messages').insert({
                            chat_id: chatId,
                            role: 'user',
                            content: userMsg.content,
                            image: currentImages[0] || null,
                            created_at: new Date().toISOString()
                        }).catch(e => derr('❌ [DB][SUPABASE] Sync error:', e.message));
                    }
                }
            } catch (err) { dwarn('⚠️ [DB] General save error:', err); }
        }

        setMessages(prev => [...prev, {
            role: 'assistant',
            content: '...',
            timestamp: new Date().toISOString(),
            isSearching: useWebSearch // Show animation if explicit search is on
        }]);

        const controller = new AbortController();
        streamAbortRef.current = controller;

        try {
            let modelToUse = (isGuest || !user) ? guestModel.modelId : (useReasoning ? 'deepseek/deepseek-r1:free' : selectedModel.modelId);
            if (!canUsePro && modelToUse === PRO_MODEL_ID) {
                // If it's the main Sigma LLM but they are guest/free, we let them use it if it's in the list, 
                // but usually Sigma LLM Mini is for guests.
            }
            let searchContext = "";
            let searchSource = "";
            let searchResultRaw = "";
            let extractContext = "";

            // URL Content Extraction
            if (shouldExtractURLContent(currentInput)) {
                const urls = extractURLs(currentInput);
                dlog(`🔗 [EXTRACT][${isGuest ? 'GUEST' : 'USER'}] Extracting content from URLs:`, urls);

                // Update message to show extracting animation
                setMessages(prev => {
                    const next = [...prev];
                    if (next.length > 0) {
                        next[next.length - 1].isSearching = true;
                        next[next.length - 1].content = 'Extrayendo contenido de la URL...';
                    }
                    return next;
                });

                try {
                    const extractResp = await fetchWithRetry('/api/extract', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ urls, isGuest: isGuest })
                    });
                    dlog(`🔗 [EXTRACT][${isGuest ? 'GUEST' : 'USER'}] /api/extract status:`, extractResp.status);
                    if (extractResp.ok) {
                        const extractData = await extractResp.json();
                        dlog(`🔗 [EXTRACT][${isGuest ? 'GUEST' : 'USER'}] /api/extract payload:`, extractData);
                        if (extractData.success) {
                            extractContext = `\n\n[CONTENIDO EXTRAÍDO DE URL(S)]:\n${extractData.result}`;
                            dlog(`✅ [EXTRACT][${isGuest ? 'GUEST' : 'USER'}] Content extracted from ${extractData.urlCount} URL(s).`);
                        }
                    } else {
                        const extractErrRaw = await extractResp.text().catch(() => '');
                        dwarn(`⚠️ [EXTRACT][${isGuest ? 'GUEST' : 'USER'}] Extract API returned error:`, extractResp.status, extractErrRaw);
                    }
                } catch (e) {
                    derr(`❌ [EXTRACT][${isGuest ? 'GUEST' : 'USER'}] Extract failed:`, e);
                }

                // Reset message content
                setMessages(prev => {
                    const next = [...prev];
                    if (next.length > 0) {
                        next[next.length - 1].isSearching = false;
                        next[next.length - 1].content = '...';
                    }
                    return next;
                });
            }

            if (useWebSearch || shouldForceRealtimeSearch(currentInput)) {
                const forced = !useWebSearch && shouldForceRealtimeSearch(currentInput);
                if (forced) {
                    dlog('🧠 [SEARCH] Forcing realtime web search by heuristic for query:', currentInput);
                }
                dlog(`🔍 [SEARCH][${isGuest ? 'GUEST' : 'USER'}] Performing explicit web search...`, currentInput);
                try {
                    const searchResp = await fetchWithRetry('/api/search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: currentInput, isGuest: isGuest })
                    });
                    dlog(`🔍 [SEARCH][${isGuest ? 'GUEST' : 'USER'}] /api/search status:`, searchResp.status);
                    if (searchResp.ok) {
                        const searchData = await searchResp.json();
                        dlog(`🔍 [SEARCH][${isGuest ? 'GUEST' : 'USER'}] /api/search payload:`, searchData);
                        if (searchData.success) {
                            searchContext = `\n\n[CONTEXTO DE BÚSQUEDA WEB]:\n${searchData.result}`;
                            searchSource = searchData.source || 'Tavily';
                            searchResultRaw = searchData.result;
                            dlog(`✅ [SEARCH][${isGuest ? 'GUEST' : 'USER'}] Search results acquired.`);
                        }
                    } else {
                        const searchErrRaw = await searchResp.text().catch(() => '');
                        dwarn(`⚠️ [SEARCH][${isGuest ? 'GUEST' : 'USER'}] Search API returned error:`, searchResp.status, searchErrRaw);
                    }
                } catch (e) {
                    derr(`❌ [SEARCH][${isGuest ? 'GUEST' : 'USER'}] Search failed:`, e);
                }

                // Turn off searching animation after search completes (success or failure)
                setMessages(prev => {
                    const next = [...prev];
                    if (next.length > 0) next[next.length - 1].isSearching = false;
                    return next;
                });
            }

            const messagesForAPI = [...newMessages];
            const lastIdx = messagesForAPI.length - 1;
            messagesForAPI[lastIdx] = {
                ...messagesForAPI[lastIdx],
                content: messagesForAPI[lastIdx].content + visionContext + searchContext + extractContext + docContext
            };
            dlog('🧠 [CHAT] Context injection summary:', {
                visionContextLength: visionContext.length,
                searchContextLength: searchContext.length,
                extractContextLength: extractContext.length,
                docContextLength: docContext.length,
                finalLastMessageLength: messagesForAPI[lastIdx].content.length
            });

            dlog('📤 [CHAT] Sending Final Payload to Sigma LLM:', {
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

            if (!response.ok) {
                const errRaw = await response.text().catch(() => '');
                derr('❌ [CHAT] /api/chat non-OK:', response.status, errRaw);
                throw new Error('Chat API error');
            }
            dlog('✅ [CHAT] /api/chat streaming response OK');
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let botResponse = '';
            let buffer = '';

            setMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = {
                    role: 'assistant',
                    content: '',
                    timestamp: new Date().toISOString(),
                    source: searchSource,
                    searchResults: searchResultRaw,
                    isSearching: false
                };
                return next;
            });

            let lastUpdate = Date.now();
            const updateInterval = 64; // ~15 FPS state updates is more than enough for smooth reading and light on React

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                let updatedInThisChunk = false;
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

                    const payload = trimmedLine.replace('data: ', '').trim();
                    if (payload === '[DONE]') continue;

                    try {
                        const json = JSON.parse(payload);
                        const delta = json.choices?.[0]?.delta?.content || '';
                        if (delta) {
                            botResponse += delta;
                            updatedInThisChunk = true;
                        }
                    } catch (e) {
                        dwarn('⚠️ [CHAT][SSE] Parse error:', e, trimmedLine);
                    }
                }

                // Micro-batching state updates to keep React happy and UI buttery smooth
                if (updatedInThisChunk && (Date.now() - lastUpdate > updateInterval)) {
                    setMessages(prev => {
                        const next = [...prev];
                        if (next.length > 0) {
                            next[next.length - 1] = { ...next[next.length - 1], content: botResponse };
                        }
                        return next;
                    });
                    lastUpdate = Date.now();

                    requestAnimationFrame(() => {
                        scrollToBottom("auto", true);
                    });
                }
            }

            // Ensure the final content is always set
            setMessages(prev => {
                const next = [...prev];
                if (next.length > 0) {
                    next[next.length - 1] = { ...next[next.length - 1], content: botResponse };
                }
                return next;
            });
            requestAnimationFrame(() => scrollToBottom("auto", true));
            dlog('✅ [CHAT] Response complete. Full text length:', botResponse.length);

            // Fallback: si por cualquier motivo no se interceptó durante stream y el modelo
            // termina devolviendo un comando SEARCH/TAVILY, ejecutamos la búsqueda aquí.
            const fallbackSearchQuery = extractAgenticSearchQuery(botResponse);
            if (fallbackSearchQuery) {
                dlog('🛟 [AGENTIC SEARCH FALLBACK] Triggered with query:', fallbackSearchQuery);
                try {
                    setMessages(prev => {
                        const next = [...prev];
                        if (next.length > 0) {
                            next[next.length - 1].content = '';
                            next[next.length - 1].isSearching = true;
                        }
                        return next;
                    });

                    const aSearchResp = await fetch('/api/search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: fallbackSearchQuery, isGuest: isGuest })
                    });
                    dlog('🛟 [AGENTIC SEARCH FALLBACK] /api/search status:', aSearchResp.status);

                    let autoSearchContext = "";
                    let autoSearchSource = "";
                    let autoSearchResultRaw = "";
                    if (aSearchResp.ok) {
                        const aSearchData = await aSearchResp.json();
                        if (aSearchData.success) {
                            autoSearchContext = `\n\n[CONTEXTO DE BÚSQUEDA WEB]:\n${aSearchData.result}`;
                            autoSearchSource = aSearchData.source || 'Tavily';
                            autoSearchResultRaw = aSearchData.result;
                            dlog('✅ [AGENTIC SEARCH FALLBACK] Results received');
                        }
                    }

                    if (!autoSearchContext) {
                        dwarn('⚠️ [AGENTIC SEARCH FALLBACK] Search returned no context');
                        const noSearchMsg = 'No pude recuperar resultados web ahora mismo. Intenta de nuevo en unos segundos.';
                        setMessages(prev => {
                            const next = [...prev];
                            if (next.length > 0) {
                                next[next.length - 1] = {
                                    ...next[next.length - 1],
                                    content: noSearchMsg,
                                    isSearching: false
                                };
                            }
                            return next;
                        });
                        botResponse = noSearchMsg;
                        return;
                    }

                    const updatedMessages = [...newMessages];
                    const lastMsg = updatedMessages[updatedMessages.length - 1];
                    updatedMessages[updatedMessages.length - 1] = {
                        ...lastMsg,
                        content: lastMsg.content + visionContext + searchContext + (docContext || "") + autoSearchContext
                    };

                    setMessages(prev => {
                        const next = [...prev];
                        if (next.length > 0) {
                            next[next.length - 1] = {
                                role: 'assistant',
                                content: '',
                                timestamp: new Date().toISOString(),
                                isSearching: false,
                                source: autoSearchSource,
                                searchResults: autoSearchResultRaw
                            };
                        }
                        return next;
                    });

                    const nextController = new AbortController();
                    streamAbortRef.current = nextController;

                    const nextResponse = await fetchWithRetry('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messages: updatedMessages,
                            modelId: modelToUse,
                            systemPrompt: `${systemInstructions}\n\nIMPORTANTE: Ya recibiste [CONTEXTO DE BÚSQUEDA WEB]. No respondas con SEARCH: ni pidas buscar otra vez. Responde al usuario usando ese contexto.`,
                            botName: botName,
                            stream: true,
                            tone: botTone,
                            detailLevel: detailLevel,
                            language: language
                        }),
                        signal: nextController.signal
                    });

                    if (!nextResponse.ok) throw new Error('Fallback retry chat failed');
                    dlog('✅ [AGENTIC SEARCH FALLBACK] retry /api/chat OK');

                    const nextReader = nextResponse.body.getReader();
                    let finalBotResponse = '';

                    let fLastUpdate = Date.now();
                    const fUpdateInterval = 64;

                    while (true) {
                        const { done, value } = await nextReader.read();
                        if (done) break;
                        const nextChunk = decoder.decode(value);
                        dlog('📡 [AGENTIC SEARCH FALLBACK][SSE] Raw chunk:', nextChunk);
                        const nextLines = nextChunk.split('\n');
                        let fUpdated = false;
                        for (const nLine of nextLines) {
                            if (nLine.startsWith('data: ')) {
                                try {
                                    const npayload = nLine.replace('data: ', '').trim();
                                    if (npayload === '[DONE]' || npayload.includes('[DONE]')) {
                                        dlog('✅ [AGENTIC SEARCH FALLBACK][SSE] DONE received');
                                        continue;
                                    }
                                    const fJson = JSON.parse(npayload);
                                    const fDelta = fJson.choices?.[0]?.delta?.content || '';
                                    if (fDelta) {
                                        finalBotResponse += fDelta;
                                        fUpdated = true;
                                    }
                                } catch (e) {
                                    dwarn('⚠️ [AGENTIC SEARCH FALLBACK][SSE] Parse error:', e, nLine);
                                }
                            }
                        }

                        if (fUpdated && (Date.now() - fLastUpdate > fUpdateInterval)) {
                            setMessages(prev => {
                                const next = [...prev];
                                if (next.length > 0) next[next.length - 1].content = finalBotResponse;
                                return next;
                            });
                            fLastUpdate = Date.now();
                            requestAnimationFrame(() => scrollToBottom("auto", true));
                        }
                    }

                    // Final set
                    setMessages(prev => {
                        const next = [...prev];
                        if (next.length > 0) next[next.length - 1].content = finalBotResponse;
                        return next;
                    });
                    requestAnimationFrame(() => scrollToBottom("auto", true));

                    botResponse = finalBotResponse;
                } catch (fallbackErr) {
                    derr('❌ [AGENTIC SEARCH FALLBACK] Error:', fallbackErr);
                }
            }

            if (user && chatId) {
                // Guardar respuesta de la IA en Supabase
                try {
                    const { error: sbAErr } = await supabase.from('messages').insert({
                        chat_id: chatId,
                        role: 'assistant',
                        content: botResponse,
                        created_at: new Date().toISOString()
                    });
                    if (sbAErr) throw sbAErr;
                    dlog('✅ [DB][SUPABASE] Mensaje IA guardado');
                } catch (e) {
                    derr('❌ [DB][SUPABASE] Error guardando respuesta IA:', e.message);
                }

                // Guardar respuesta de la IA en MySQL
                try {
                    const myResp = await fetch('/api/mysql/messages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chatId,
                            role: 'assistant',
                            content: botResponse
                        })
                    });
                    if (myResp.ok) dlog('✅ [DB][MYSQL] Mensaje IA guardado');
                    else throw new Error('MySQL response not ok');
                } catch (e) {
                    derr('❌ [DB][MYSQL] Error guardando respuesta IA:', e.message);
                }

                updateUserStats(Math.ceil(botResponse.length / 4));
            }

        } catch (err) {
            if (err.name === 'AbortError') return;
            derr('❌ [SEND] Final flow error:', err);
            const errMsg = err.message || 'Error al obtener respuesta.';
            setError(errMsg);

            // Revert last messages if it was just the placeholder
            setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'assistant' && last.content === '...') {
                    return prev.slice(0, -1);
                }
                return prev;
            });
        } finally {
            setIsProcessingImage(false);
            setIsLoading(false);
            setIsStreaming(false);
            setSelectedImages([]);
            setImagePreviews([]);
            setSelectedDocs([]);
        }
    };

    const processSelectedFiles = async (items, source = 'picker') => {
        const files = Array.from(items || []);
        if (files.length === 0) return;

        // Cleanup legacy docs
        setSelectedDocs(prev => prev.filter(d => !d?.isHidden));

        // Slot calculation using current state (standard approach)
        const visibleDocs = selectedDocs.filter(d => !d.isHidden);
        const currentTotal = selectedImages.length + visibleDocs.length;
        const available = Math.max(0, MAX_ATTACHMENTS - currentTotal);

        if (available === 0) {
            showToast(`Máximo ${MAX_ATTACHMENTS} archivos totales.`);
            if (source === 'picker' && fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Duplicate check
        const existingNames = new Set([
            ...selectedDocs.map(d => d.name),
            ...selectedImages.map(img => img.name)
        ]);

        const uniqueFiles = files.filter(f => !existingNames.has(f.name));
        if (uniqueFiles.length === 0) {
            console.log('📎 [UPLOAD] No new unique files');
            return;
        }

        const toProcess = uniqueFiles.slice(0, available);
        if (uniqueFiles.length > available) {
            showToast(`Solo se añadirán ${available} archivo(s). Límite: ${MAX_ATTACHMENTS}.`);
        }

        const imageFiles = toProcess.filter(f => f.type.startsWith('image/'));
        const docFiles = toProcess.filter(f => !f.type.startsWith('image/'));

        // 1. Start Image Previews (async but separate)
        if (imageFiles.length > 0) {
            const previewPromises = imageFiles.map(file => new Promise(resolve => {
                const reader = new FileReader();
                reader.onloadend = () => resolve({ file, preview: reader.result });
                reader.readAsDataURL(file);
            }));

            Promise.all(previewPromises).then(results => {
                const valid = results.filter(r => r.preview);
                setSelectedImages(prev => [...prev, ...valid.map(r => r.file)]);
                setImagePreviews(prev => [...prev, ...valid.map(r => r.preview)]);
            });
        }

        // 2. Start Doc Extraction with placeholders
        if (docFiles.length > 0) {
            setIsParsingFile(true);
            const placeholders = docFiles.map((file, idx) => ({
                id: `d-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
                name: file.name,
                type: file.type,
                content: "",
                isParsing: true,
                progress: 15,
                _file: file
            }));

            setSelectedDocs(prev => [...prev, ...placeholders]);

            // Background extraction Loop
            placeholders.forEach(async (p) => {
                const f = p._file;
                const tid = p.id;
                try {
                    // Update progress initial
                    setSelectedDocs(curr => curr.map(d => d.id === tid ? { ...d, progress: 35 } : d));

                    const text = (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
                        ? await uploadAndVisionPDF(f)
                        : await uploadAndExtractFile(f);

                    if (!text || !text.trim()) {
                        setSelectedDocs(curr => curr.filter(d => d.id !== tid));
                    } else {
                        setSelectedDocs(curr => curr.map(d => d.id === tid ? {
                            ...d,
                            content: text.substring(0, MAX_DOC_CHARS_PER_FILE),
                            isParsing: false,
                            progress: 100
                        } : d));
                    }
                } catch (err) {
                    console.error('❌ Extraction error:', err);
                    setSelectedDocs(curr => curr.filter(d => d.id !== tid));
                } finally {
                    // Turn off parsing once last doc completes
                    setSelectedDocs(latest => {
                        const parsing = latest.some(d => d.isParsing);
                        if (!parsing) setIsParsingFile(false);
                        return latest;
                    });
                }
            });
        }

        if (source === 'picker' && fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileSelect = async (e) => {
        console.log('📎 [UPLOAD] File picker changed');
        await processSelectedFiles(e.target.files, 'picker');
    };

    const handlePaste = async (e) => {
        const items = Array.from(e.clipboardData?.items || []);
        const pastedImages = items
            .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
            .map(item => item.getAsFile())
            .filter(Boolean);

        if (pastedImages.length > 0) {
            console.log('📋 [UPLOAD] Pasted images detected:', pastedImages.length);
            e.preventDefault();
            await processSelectedFiles(pastedImages, 'paste');
        }
    };

    const handleDragOverInput = (e) => {
        e.preventDefault();
        if (!isDragOverInput) setIsDragOverInput(true);
    };

    const handleDragLeaveInput = (e) => {
        e.preventDefault();
        setIsDragOverInput(false);
    };

    const handleDropInput = async (e) => {
        e.preventDefault();
        setIsDragOverInput(false);
        const droppedFiles = Array.from(e.dataTransfer?.files || []);
        if (droppedFiles.length > 0) {
            console.log('🧲 [UPLOAD] Dropped files detected:', droppedFiles.length);
            await processSelectedFiles(droppedFiles, 'drop');
        }
    };

    const removeDoc = (index) => {
        const newDocs = selectedDocs.filter((_, i) => i !== index);
        setSelectedDocs(newDocs);
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
        a.download = 'sigma-llm-chat.txt';
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

        // Apply theme change
        const themeMap = { 'Oscuro': 'dark', 'Claro': 'light', 'Sistema': 'system' };
        const newTheme = themeMap[appearance] || 'dark';
        setTheme(newTheme);
        localStorage.setItem('sigma-theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);

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

    const acceptCookies = () => {
        localStorage.setItem('sigma-cookie-consent', 'accepted');
        setShowCookieConsent(false);
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

        // Keep reasoning visible by default; user can collapse manually.
        const isFinished = thinkEnd !== -1;
        const isCollapsed = collapsedThinking[index] !== undefined
            ? collapsedThinking[index]
            : false;

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
                                {isFinished ? t('thinking_completed') : t('thinking_in_progress')}
                            </span>
                            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                        </div>
                        {!isCollapsed && (
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
    const settingsTabs = isGuest
        ? ['General']
        : ['General', 'Estadísticas', 'Notificaciones', 'Personalización', 'Aplicaciones', 'Datos', 'Seguridad', 'Cuenta', 'Legal'];

    // Loading Screen
    if (isInitialLoading) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.loadingContent}>
                    <div className={styles.loadingLogo}>
                        <div className={styles.sigmaLogoBubble}>
                            <span className={styles.sigmaSymbol}>Σ</span>
                        </div>
                    </div>
                    <div className={styles.loadingSpinnerContainer}>
                        <div className={styles.loadingSpinner}></div>
                    </div>
                    <p className={styles.loadingText}>{t('loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer} data-theme={theme}>
            {/* Sidebar */}
            {!isGuest && (
                <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
                    <div className={styles.sidebarHeader}>
                        <div className={styles.sidebarLogoContainer}>
                            <h1 style={{ display: 'none' }}>Sigma LLM - Chat de Inteligencia Artificial Avanzada</h1>
                            <img src={theme === 'light' ? '/logo-fondo-claro.png' : '/logo-fondo-negro.png'} alt="Sigma LLM Logo - Inteligencia Artificial de Sigma Company" className={styles.sidebarLogo} />
                            <span className={styles.sidebarBrand}>Sigma LLM</span>
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
                            <Plus size={18} /> {t('new_chat')}
                        </button>
                        <button className={styles.iconBtn} onClick={() => setIsSidebarOpen(false)} style={{ display: isSidebarOpen ? 'block' : 'none' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className={styles.sidebarContent}>
                        <div className={styles.sidebarSection}>
                            <div className={styles.sidebarHeading}>{sidebarSearch ? t('search_results') : t('recent_chats')}</div>
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
                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            <AppleEmojiRenderer text={chat.title} size={14} />
                                        </span>
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
                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            <AppleEmojiRenderer text={chat.title} size={14} />
                                        </span>
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
                                <div className={styles.profileName}>
                                    <AppleEmojiRenderer text={userName} size={16} />
                                </div>
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
            )}

            {!isGuest && isSidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setIsSidebarOpen(false)} />}

            {/* Main Chat Area */}
            <main className={styles.main}>
                <header className={`${styles.header} ${isGuest ? styles.guestHeader : ''}`}>
                    <div className={styles.headerLeft}>
                        {!isGuest && (
                            <button className={styles.mobileMenuBtn} onClick={() => setIsSidebarOpen(true)} title="Menú">
                                <PanelLeft size={20} />
                            </button>
                        )}
                        <div className={styles.modelSelectorWrapper}>
                            <div
                                className={`${styles.modelSelector} ${isGuest ? styles.modelSelectorDisabled : ''}`}
                                onClick={() => {
                                    if (isGuest) {
                                        showModal('🔒 Funciones Premium', 'Inicia sesión para acceder a modelos especializados. Como invitado, usas Sigma LLM (que incluye soporte para fotos y documentos). Regístrate gratis para desbloquear modelos como Coder y Razonamiento Avanzado.');
                                        return;
                                    }
                                    setShowModelDropdown(!showModelDropdown);
                                }}
                                title={isGuest ? 'Inicia sesión para cambiar de modelo' : 'Seleccionar modelo'}
                            >

                                <span>{selectedModel.modelName}</span>
                                {!isGuest && <ChevronDown size={16} className={styles.chevronIcon} />}
                                {isGuest && <Lock size={14} style={{ opacity: 0.5 }} />}
                            </div>

                            {showModelDropdown && !isGuest && (
                                <div className={styles.modelDropdown}>
                                    {models.map((model) => (
                                        <div
                                            key={model.modelId}
                                            className={`${styles.modelOption} ${selectedModel.modelId === model.modelId ? styles.activeModel : ''}`}
                                            onClick={() => {
                                                if (model.modelId === PRO_MODEL_ID && !canUsePro) {
                                                    showModal('Acceso Restringido', 'Modelo solo para usuarios premium. Habla con @sigmacompanyoficial para que te asigne ese rol.');
                                                    setShowModelDropdown(false);
                                                    return;
                                                }
                                                setUseReasoning(false);
                                                setSelectedModel(model);
                                                setShowModelDropdown(false);
                                                setBotName(model.modelName);
                                            }}
                                        >
                                            <div className={styles.modelOptionHeader}>
                                                {model.imageInput ? <ImageIcon size={16} /> : (model.modelName.includes('Coder') ? <Zap size={16} /> : <Sparkles size={16} />)}
                                                <span>{model.modelName}</span>
                                                {model.modelId === PRO_MODEL_ID && !canUsePro && <span style={{ color: '#22c55e', fontWeight: 700, marginLeft: 'auto' }}>$</span>}
                                            </div>
                                            <p className={styles.modelDescription}>
                                                {model.modelName === "Sigma LLM Coder" ? 'Especializado en programación y creación de apps.' :
                                                    model.modelName === "Sigma Vision" ? 'Analiza imágenes y documentos visuales.' :
                                                        model.modelName === "Sigma LLM Mini" ? 'Ultra rápido para tareas sencillas.' :
                                                            'El modelo más potente y completo de Sigma.'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.headerActions}>
                        {isGuest ? (
                            <>
                                <button className={styles.guestHeaderIconBtn} onClick={() => setShowSettings(true)} title="Configuración">
                                    <Settings size={18} />
                                </button>
                                <button
                                    className={`${styles.guestHeaderPrimaryBtn} ${isSupabaseUnavailable ? styles.authUnavailableBtn : ''}`}
                                    aria-disabled={isSupabaseUnavailable}
                                    onClick={() => handleAuthNavigation('/login')}
                                >
                                    Iniciar sesión
                                </button>
                                <button
                                    className={`${styles.guestHeaderSecondaryBtn} ${isSupabaseUnavailable ? styles.authUnavailableBtn : ''}`}
                                    aria-disabled={isSupabaseUnavailable}
                                    onClick={() => handleAuthNavigation('/login?mode=signup')}
                                >
                                    Registrarse gratuitamente
                                </button>
                                <button className={styles.guestHeaderIconBtn} onClick={() => window.location.href = '/about'} title="Ayuda">
                                    <CircleHelp size={18} />
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    className={styles.shareButton}
                                    onClick={handleShareChat}
                                    title={t('share')}
                                >
                                    <Upload size={16} />
                                    <span>{t('share')}</span>
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
                            </>
                        )}
                    </div>
                </header >

                <div className={styles.chatContainer} ref={chatContainerRef} onScroll={handleScroll}>
                    {messages.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyLogoContainer}>
                                <img src={theme === 'light' ? '/logo-fondo-claro.png' : '/logo-fondo-negro.png'} alt="Sigma LLM" className={styles.emptyLogo} />
                            </div>
                            <h2 className={styles.emptyGreeting}>¡{getTimeBasedGreeting()}, {userName}!</h2>
                            <p className={styles.emptyModelText}>{t('active_model')}: {botName}</p>
                        </div>
                    ) : (
                        <div className={styles.messagesList}>
                            {error && (
                                <div className={styles.errorBanner}>
                                    <div className={styles.errorBannerContent}>
                                        <AlertCircle size={18} />
                                        <span>{error}</span>
                                    </div>
                                    <button onClick={() => setError(null)} className={styles.errorClose}>
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                            {messages.map((msg, idx) => (
                                <div key={msg.id || idx} className={`${styles.message} ${msg.role === 'user' ? styles.user : ''}`}>
                                    <div className={`${styles.messageAvatar} ${msg.role === 'user' ? styles.userAvatar : styles.botAvatar}`}>
                                        {msg.role === 'user' ? (
                                            profilePic ? <img src={profilePic} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="User" /> : <User size={18} />
                                        ) : <img src={theme === 'light' ? '/logo-fondo-claro.png' : '/logo-fondo-negro.png'} style={{ width: '22px', height: '22px', objectFit: 'contain' }} alt="Bot" />}
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
                                                    <div className={styles.searchRadar}>
                                                        <div className={styles.searchRadarSweep}></div>
                                                        <div className={styles.searchRadarDot}></div>
                                                    </div>
                                                    <div className={styles.loaderTextBlock}>
                                                        <span className={styles.loaderTitle}>Buscando en la web</span>
                                                        <span className={styles.loaderSubtitle}>Rastreando fuentes en tiempo real...</span>
                                                    </div>
                                                </div>
                                            )}
                                            {msg.content === '...' && !msg.isSearching && isProcessingImage && idx === messages.length - 1 ? (
                                                <div className={styles.analyzingContainer}>
                                                    <div className={styles.analyzingPulse}></div>
                                                    <div className={styles.loaderTextBlock}>
                                                        <span className={styles.loaderTitle}>Analizando imagen</span>
                                                        <span className={styles.loaderSubtitle}>Gemma está examinando el contenido...</span>
                                                    </div>
                                                </div>
                                            ) : msg.content === '...' && !msg.isSearching ? (
                                                <div className={styles.loadingContainer}>
                                                    <div className={styles.thinkingPulse}>
                                                        <span></span>
                                                        <span></span>
                                                        <span></span>
                                                    </div>
                                                    <div className={styles.loaderTextBlock}>
                                                        <span className={styles.loaderTitle}><AppleEmojiRenderer text={botName} /> está pensando</span>
                                                        <span className={styles.loaderSubtitle}>Construyendo la mejor respuesta...</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {renderMessage(msg.content, idx)}
                                                    {msg.source && (
                                                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            <button
                                                                onClick={() => {
                                                                    setShowSourcesMap(prev => ({ ...prev, [idx]: !prev[idx] }))
                                                                }}
                                                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                                style={{
                                                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                                                    borderRadius: '8px', padding: '6px 12px', color: 'white',
                                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                                                    fontSize: '0.8rem', width: 'fit-content', transition: 'all 0.2s', marginTop: '4px'
                                                                }}
                                                            >
                                                                <Search size={14} />
                                                                {showSourcesMap[idx] ? 'Ocultar Fuentes' : 'Fuentes'}
                                                                <span style={{ opacity: 0.6, fontSize: '0.7rem' }}>({msg.source})</span>
                                                            </button>
                                                            {showSourcesMap[idx] && msg.searchResults && (
                                                                <div style={{ background: 'var(--bg-secondary, rgba(0,0,0,0.2))', padding: '16px', borderRadius: '12px', fontSize: '0.85rem', width: '100%', border: '1px solid rgba(255,255,255,0.05)', marginTop: '4px', overflowX: 'auto' }}>
                                                                    <SigmaMarkdown content={msg.searchResults} theme={theme} />
                                                                </div>
                                                            )}
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

                {/* Guest Registration Modal */}
                {
                    isGuest && showRegisterModal && (
                        <div className={styles.modalOverlay}>
                            <div className={styles.modalContent}>
                                <div className={styles.modalIcon}><Sparkles size={32} /></div>
                                <h2>Desbloquea todo el potencial</h2>
                                <p>Únete a Sigma LLM para acceder al <b>Razonamiento Avanzado</b>, mayor velocidad y guardar tu historial de chats de forma permanente.</p>
                                <div className={styles.modalActions}>
                                    <button
                                        className={`${styles.modalLoginBtn} ${isSupabaseUnavailable ? styles.authUnavailableBtn : ''}`}
                                        aria-disabled={isSupabaseUnavailable}
                                        onClick={() => handleAuthNavigation('/login')}
                                    >
                                        Registrarse Gratis
                                    </button>
                                    <button onClick={() => setShowRegisterModal(false)} className={styles.modalCloseBtn}>Seguir como invitado</button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {
                    isGuest && showGuestOptionsModal && (
                        <div className={styles.modalOverlay} onClick={() => setShowGuestOptionsModal(false)}>
                            <div className={styles.guestPromptModal} onClick={(e) => e.stopPropagation()}>
                                <div className={styles.guestPromptIcon}>
                                    <AlertCircle size={30} />
                                </div>
                                <h2 className={styles.guestPromptTitle}>Inicia sesión para continuar</h2>
                                <p className={styles.guestPromptText}>
                                    Esta opción está disponible para cuentas registradas. Accede para desbloquear herramientas avanzadas.
                                </p>
                                <div className={styles.guestPromptActions}>
                                    <button
                                        className={`${styles.guestPromptPrimary} ${isSupabaseUnavailable ? styles.authUnavailableBtn : ''}`}
                                        aria-disabled={isSupabaseUnavailable}
                                        onClick={() => handleAuthNavigation('/login')}
                                    >
                                        Iniciar sesión
                                    </button>
                                    <button
                                        className={`${styles.guestPromptSecondary} ${isSupabaseUnavailable ? styles.authUnavailableBtn : ''}`}
                                        aria-disabled={isSupabaseUnavailable}
                                        onClick={() => handleAuthNavigation('/login?mode=signup')}
                                    >
                                        Crear cuenta
                                    </button>
                                    <button onClick={() => setShowGuestOptionsModal(false)} className={styles.modalCloseBtn}>
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                <div className={styles.inputSection}>
                    {!isReadOnly && (
                        <>

                            <form
                                onSubmit={handleSend}
                                className={`${styles.inputWrapper} ${isDragOverInput ? styles.inputWrapperDropActive : ''}`}
                                onDragOver={handleDragOverInput}
                                onDragEnter={handleDragOverInput}
                                onDragLeave={handleDragLeaveInput}
                                onDrop={handleDropInput}
                            >
                                {isDragOverInput && (
                                    <div className={styles.dragOverlay}>
                                        <Upload size={24} />
                                        <span>Arrastra aquí</span>
                                    </div>
                                )}

                                {(imagePreviews.length > 0 || selectedDocs.length > 0) && (
                                    <div className={styles.previewsContainer}>
                                        {imagePreviews.map((preview, idx) => {
                                            const analyzingImg = analyzingImages[idx];
                                            const progress = analyzingImg?.progress || 0;

                                            return (
                                                <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
                                                    <img
                                                        src={preview}
                                                        alt={`Preview ${idx}`}
                                                        style={{
                                                            width: '60px',
                                                            height: '60px',
                                                            objectFit: 'cover',
                                                            borderRadius: '8px',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            filter: analyzingImg && progress < 100 ? 'brightness(0.5)' : 'none'
                                                        }}
                                                    />

                                                    {analyzingImg && progress < 100 && (
                                                        <div className={styles.analysisProgress} data-complete={progress === 100}>
                                                            <svg viewBox="0 0 36 36" className={styles.circularChart}>
                                                                <path className={styles.circleBg}
                                                                    d="M18 2.0845
                                                                        a 15.9155 15.9155 0 0 1 0 31.831
                                                                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                />
                                                                <path className={styles.circle}
                                                                    strokeDasharray={`${progress}, 100`}
                                                                    d="M18 2.0845
                                                                        a 15.9155 15.9155 0 0 1 0 31.831
                                                                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                />
                                                                <text x="18" y="20.35" className={styles.percentageText}>{progress}%</text>
                                                            </svg>
                                                        </div>
                                                    )}

                                                    {(progress === 0 || progress === 100) && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
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
                                                                color: 'white',
                                                                zIndex: 10
                                                            }}
                                                        >
                                                            <X size={10} strokeWidth={3} />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {selectedDocs
                                            .map((doc, idx) => ({ doc, idx }))
                                            .filter(({ doc }) => !doc.isHidden)
                                            .map(({ doc, idx }) => {
                                                const progress = doc.progress || 0;
                                                const isParsing = doc.isParsing;

                                                return (
                                                    <div key={doc.id || idx} style={{
                                                        position: 'relative',
                                                        flexShrink: 0,
                                                        width: '140px',
                                                        height: '60px',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        borderRadius: '12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '0 12px',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        opacity: isParsing ? 0.7 : 1
                                                    }}>
                                                        <FileText size={20} color="#6366F1" />
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            color: 'white',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            maxWidth: '80px'
                                                        }}>
                                                            {doc.name}
                                                        </span>

                                                        {isParsing && (
                                                            <div className={styles.analysisProgress} data-complete={progress === 100}>
                                                                <svg viewBox="0 0 36 36" className={`${styles.circularChart} ${styles.circularChartMini}`}>
                                                                    <path className={styles.circleBg}
                                                                        d="M18 2.0845
                                                                            a 15.9155 15.9155 0 0 1 0 31.831
                                                                            a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                    />
                                                                    <path className={styles.circle}
                                                                        strokeDasharray={`${progress}, 100`}
                                                                        d="M18 2.0845
                                                                            a 15.9155 15.9155 0 0 1 0 31.831
                                                                            a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                    />
                                                                </svg>
                                                            </div>
                                                        )}

                                                        {(!isParsing || progress === 100) && (
                                                            <button
                                                                onClick={() => removeDoc(idx)}
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
                                                        )}
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}

                                <div className={styles.inputControlsRow}>
                                    <input ref={fileInputRef} type="file" accept="image/*,.pdf,.docx,.xlsx,.xls,.txt,.csv,.json,.html,.htm,.js,.jsx,.ts,.tsx,.py,.md,.xml,.yaml,.yml,.env" multiple onChange={handleFileSelect} style={{ display: 'none' }} />

                                    <div style={{ display: 'flex', alignItems: 'center' }} className={styles.attachWrapper} ref={attachMenuRef}>
                                        <button
                                            type="button"
                                            className={styles.attachButton}
                                            onClick={() => {
                                                fileInputRef.current?.click();
                                            }}
                                            disabled={isLoading}
                                            title={"Añadir fotos y archivos"}
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>

                                    <textarea
                                        ref={textareaRef}
                                        className={styles.textarea}
                                        placeholder={`${t('message_placeholder')} ${botName}...`}
                                        rows={1}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onPaste={handlePaste}
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
                                </div>
                            </form>
                        </>
                    )}
                    {isReadOnly && (
                        <div className={styles.readOnlyBanner}>
                            <AlertCircle size={20} />
                            <span>Estás viendo una versión de solo lectura de este chat.</span>
                            {!user && (
                                <button onClick={() => handleAuthNavigation('/login')} className={`${styles.loginLink} ${isSupabaseUnavailable ? styles.authUnavailableBtn : ''}`} aria-disabled={isSupabaseUnavailable}>
                                    Iniciar sesión para crear tu propio chat
                                </button>
                            )}
                        </div>
                    )}
                    {isGuest ? (
                        <p className={styles.footer}>
                            Al enviar un mensaje a Sigma LLM, un asistente de IA, aceptas nuestras <Link className={styles.guestLegalLink} href="/terms">condiciones</Link> y confirmas que has leído nuestra <Link className={styles.guestLegalLink} href="/privacy">política de privacidad</Link>. <Link className={styles.guestLegalLink} href="/cookies">Ver preferencias de cookies</Link>.
                        </p>
                    ) : (
                        <p className={styles.footer}>Sigma LLM puede cometer errores. Verifica la información importante</p>
                    )}
                </div>
            </main >

            {showCookieConsent && (
                <div className={styles.cookieBanner}>
                    <div className={styles.cookieBannerContent}>
                        <div className={styles.cookieBannerIcon}><Cookie size={16} /></div>
                        <p>
                            Usamos cookies para mejorar tu experiencia en Sigma LLM. Al continuar, aceptas nuestras cookies.
                        </p>
                    </div>
                    <div className={styles.cookieBannerActions}>
                        <Link href="/cookies" className={styles.cookieBannerLink}>Configurar</Link>
                        <button className={styles.cookieBannerBtn} onClick={acceptCookies}>Aceptar</button>
                    </div>
                </div>
            )
            }

            {
                showSettings && (
                    <div className={styles.modalOverlay} onClick={() => setShowSettings(false)}>
                        <div className={styles.settingsModal} onClick={(e) => e.stopPropagation()}>
                            {/* Settings Sidebar */}
                            <div className={styles.settingsSidebar}>
                                <h2 className={styles.settingsTitle}>Ajustes</h2>
                                <div className={styles.settingsNav}>
                                    {settingsTabs.map(tab => (
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
                                            {tab === 'Legal' && <ShieldCheck size={16} />}
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                                {!isGuest && (
                                    <div className={styles.settingsSidebarFooter}>
                                        <button className={styles.logoutBtn} onClick={handleLogout}>
                                            <LogOut size={16} /> Cerrar sesión
                                        </button>
                                    </div>
                                )}
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
                                            {!isGuest && (
                                                <div className={styles.settingGroup}>
                                                    <label>{t('username')}</label>
                                                    <input className={styles.inputField} value={userName} onChange={(e) => setUserName(e.target.value)} placeholder={t('username')} />
                                                </div>
                                            )}
                                            <div className={styles.settingGroup}>
                                                <label>{t('appearance')}</label>
                                                <div className={styles.radioGroup}>
                                                    {['Claro', 'Oscuro', 'Sistema'].map(mode => (
                                                        <button
                                                            key={mode}
                                                            className={`${styles.radioBtn} ${appearance === mode ? styles.activeRadio : ''}`}
                                                            onClick={() => setAppearance(mode)}
                                                        >
                                                            {mode === 'Claro' ? 'Light' : mode === 'Oscuro' ? 'Dark' : 'System'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className={styles.settingGroup}>
                                                <label>{t('language')}</label>
                                                <select className={styles.select} value={language} onChange={(e) => setLanguage(e.target.value)}>
                                                    <option value="Auto">Detectar automáticamente</option>
                                                    <option>Español</option>
                                                    <option>English</option>
                                                    <option>Français</option>
                                                    <option>Deutsch</option>
                                                    <option>Italiano</option>
                                                    <option>Português</option>
                                                    <option>中文</option>
                                                    <option>日本語</option>
                                                    <option>한국어</option>
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
                                                        <span className={styles.statLabel}>{t('messages_sent') || 'Mensajes enviados'}</span>
                                                        <span className={styles.statValue}>{totalMessages}</span>
                                                    </div>
                                                </div>
                                                <div className={styles.statCard}>
                                                    <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                                                        <Zap size={20} />
                                                    </div>
                                                    <div className={styles.statInfo}>
                                                        <span className={styles.statLabel}>{t('tokens_used') || 'Tokens utilizados'}</span>
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
                                                <input className={styles.inputField} value={botName} onChange={(e) => setBotName(e.target.value)} />
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
                                                <span>Razonamiento (DeepSeek R1)</span>
                                                <input type="checkbox" checked={useReasoning} onChange={(e) => setUseReasoning(e.target.checked)} />
                                            </div>
                                        </div>
                                    )}

                                    {activeSettingsTab === 'Seguridad' && (
                                        <div className={styles.settingsSection}>
                                            <div className={styles.bannerMFA}>
                                                <div className={styles.bannerContent}>
                                                    <strong><AppleEmojiRenderer text="🔒" /> Protege tu cuenta</strong>
                                                    <p>Activa la autenticación multifactor para mayor seguridad.</p>
                                                </div>
                                                <button className={styles.bannerBtn}>Configurar MFA</button>
                                            </div>
                                            <div className={styles.settingGroup}>
                                                <label>Correo Electrónico</label>
                                                <input className={styles.inputField} value={user?.email || ''} readOnly />
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
                                                    <p>Conecta Sigma LLM con tus propias aplicaciones.</p>
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
                                                    <button className={styles.dangerBtn} onClick={() => {
                                                        showModal(
                                                            '¿Borrar todo el historial?',
                                                            'Esta acción eliminará permanentemente todos tus chats. Esta acción no se puede deshacer.',
                                                            'Borrar todo',
                                                            async () => {
                                                                const { error } = await supabase.from('chats').delete().eq('user_id', user.id);
                                                                if (!error) {
                                                                    fetchChats(user.id);
                                                                    showToast('Historial eliminado correctamente.', 'success');
                                                                } else {
                                                                    showToast('Error al eliminar el historial.', 'error');
                                                                }
                                                            },
                                                            'Cancelar'
                                                        );
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
                                                <input className={styles.inputField} value={userRole} readOnly />
                                            </div>
                                        </div>
                                    )}

                                    {activeSettingsTab === 'Legal' && (
                                        <div className={styles.settingsSection}>
                                            <div className={styles.settingGroup}>
                                                <label>Políticas y Condiciones</label>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                                                    <Link href="/terms" className={styles.legalLinkItem}>
                                                        <FileText size={16} /> Términos y Condiciones
                                                    </Link>
                                                    <Link href="/privacy" className={styles.legalLinkItem}>
                                                        <Shield size={16} /> Política de Privacidad
                                                    </Link>
                                                    <Link href="/cookies" className={styles.legalLinkItem}>
                                                        <Cookie size={16} /> Configuración de Cookies
                                                    </Link>
                                                </div>
                                            </div>
                                            <div className={styles.settingGroup} style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                                <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
                                                    Sigma LLM es una plataforma desarrollada por <b>Sigma Company</b>.
                                                    Autor: <b>Ayoub Louah</b>. Versión 0.9 Beta.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.settingsFooter}>
                                    <button className={styles.saveSettingsBtn} onClick={saveSettings}>
                                        <Check size={16} /> {isGuest ? 'Aplicar cambios' : 'Guardar cambios'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Toast Notification */}
            {toast.visible && (
                <div className={`${styles.toast} ${styles['toast' + toast.type.charAt(0).toUpperCase() + toast.type.slice(1)]}`}>
                    {toast.type === 'success' ? <Check size={18} /> : toast.type === 'error' ? <AlertCircle size={18} /> : <Sparkles size={18} />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Custom Modal */}
            {customModal.visible && (
                <div className={styles.modalOverlay} onClick={() => setCustomModal(prev => ({ ...prev, visible: false }))}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalIcon}>
                            <Sparkles size={32} />
                        </div>
                        <h2 className={styles.modalTitle}>{customModal.title}</h2>
                        <p>{customModal.content}</p>
                        <div className={styles.modalActions}>
                            <button className={styles.modalLoginBtn} onClick={customModal.onConfirm}>
                                {customModal.confirmText}
                            </button>
                            {customModal.cancelText && (
                                <button className={styles.modalCloseBtn} onClick={() => setCustomModal(prev => ({ ...prev, visible: false }))}>
                                    {customModal.cancelText}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
