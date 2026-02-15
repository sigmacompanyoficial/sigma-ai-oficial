'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
    Users, Shield, Activity, Search, Trash2, Edit, Save, X,
    CheckCircle, AlertTriangle, LogOut, ChevronLeft, BarChart3, Crown, UserCheck, RefreshCw, Download
} from 'lucide-react';
import styles from './admin.module.css';

export default function AdminPage() {
    const [users, setUsers] = useState([]);
    const [activity, setActivity] = useState([]);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'activity', 'security'
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [theme, setTheme] = useState('dark');
    const [lastSyncAt, setLastSyncAt] = useState(null);
    const router = useRouter();

    const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
            router.push('/chat');
            return;
        }

        setCurrentUser(profile);
        setIsAdmin(true);
        loadAllData();
    };

    const loadAllData = async () => {
        setLoading(true);
        await Promise.all([
            fetchUsers(),
            fetchActivity()
        ]);
        setLastSyncAt(new Date());
        setLoading(false);
    };

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error) {
                setUsers(data || []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchActivity = async () => {
        try {
            console.log('--- Intentando cargar actividad ---');
            const { data, error } = await supabase
                .from('chats')
                .select(`
                    id,
                    title,
                    created_at,
                    user_id,
                    profiles (
                        full_name,
                        email
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Error en fetchActivity:', error);

                // Intento de rescate: cargar chats sin perfiles si la unión falla
                const { data: simpleData } = await supabase
                    .from('chats')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (simpleData) setActivity(simpleData);
            } else {
                console.log('Actividad cargada:', data?.length, 'chats');
                setActivity(data || []);
            }
        } catch (error) {
            console.error('Error catastrófico en actividad:', error);
        }
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem('sigma-theme') || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
        checkAdmin();
    }, []);

    const handleUpdateRole = async (userId, newRole) => {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (!error) {
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            setEditingUser(null);
        } else {
            alert('Error al actualizar rol');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('¿Estás seguro de que quieres eliminar a este usuario?')) return;

        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (!error) {
            setUsers(users.filter(u => u.id !== userId));
        } else {
            alert('Error al eliminar usuario');
        }
    };

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredActivity = activity.filter(act =>
        act.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        act.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        act.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalMessages = users.reduce((acc, curr) => acc + (curr.total_messages || 0), 0);
    const totalTokens = users.reduce((acc, curr) => acc + (curr.total_tokens || 0), 0);
    const premiumUsers = users.filter(u => u.role === 'premium').length;
    const adminUsers = users.filter(u => u.role === 'admin' || u.role === 'superadmin').length;
    const onboardingCompleted = users.filter(u => u.onboarding_completed).length;
    const onboardingRate = users.length ? Math.round((onboardingCompleted / users.length) * 100) : 0;
    const activeToday = activity.filter(a => {
        const d = new Date(a.created_at);
        const now = new Date();
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }).length;

    const topUsers = [...users]
        .sort((a, b) => (b.total_messages || 0) - (a.total_messages || 0))
        .slice(0, 5);

    const exportUsersCsv = () => {
        const rows = [
            ['id', 'username', 'full_name', 'email', 'role', 'onboarding_completed', 'total_messages', 'total_tokens', 'created_at'],
            ...users.map(u => [
                u.id,
                u.username || '',
                u.full_name || '',
                u.email || '',
                u.role || 'user',
                String(!!u.onboarding_completed),
                String(u.total_messages || 0),
                String(u.total_tokens || 0),
                u.created_at || ''
            ])
        ];

        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `sigma-admin-users-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    if (loading) return <div className={styles.loading}>Cargando panel de administración...</div>;
    if (!isAdmin) return null;

    return (
        <div className={styles.container}>
            <aside className={styles.sidebar}>
                <div className={styles.logoContainer}>
                    <img src={theme === 'light' ? '/logo-fondo-claro.png' : '/logo-fondo-negro.png'} alt="Sigma Admin" className={styles.logo} />
                    <span>Sigma Admin</span>
                </div>

                <nav className={styles.nav}>
                    <button
                        className={`${styles.navItem} ${activeTab === 'overview' ? styles.active : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <BarChart3 size={20} />
                        Resumen
                    </button>
                    <button
                        className={`${styles.navItem} ${activeTab === 'users' ? styles.active : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <Users size={20} />
                        Usuarios
                    </button>
                    <button
                        className={`${styles.navItem} ${activeTab === 'activity' ? styles.active : ''}`}
                        onClick={() => setActiveTab('activity')}
                    >
                        <Activity size={20} />
                        Actividad
                    </button>
                    <button
                        className={`${styles.navItem} ${activeTab === 'security' ? styles.active : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        <Shield size={20} />
                        Seguridad
                    </button>
                </nav>

                <div className={styles.sidebarFooter}>
                    <button onClick={() => router.push('/chat')} className={styles.backBtn}>
                        <ChevronLeft size={18} />
                        Volver al Chat
                    </button>
                </div>
            </aside>

            <main className={styles.main}>
                <header className={styles.header}>
                    <h1>{activeTab === 'overview' ? 'Resumen Ejecutivo' : activeTab === 'users' ? 'Gestión de Usuarios' : activeTab === 'activity' ? 'Actividad de la Plataforma' : 'Seguridad y Sistema'}</h1>
                    <div className={styles.userProfile}>
                        <button className={styles.quickBtn} onClick={loadAllData} title="Refrescar datos">
                            <RefreshCw size={14} />
                            Actualizar
                        </button>
                        <button className={styles.quickBtn} onClick={exportUsersCsv} title="Exportar CSV">
                            <Download size={14} />
                            Exportar
                        </button>
                        <span>{currentUser?.full_name}</span>
                        <span className={styles.badge}>{currentUser?.role}</span>
                    </div>
                </header>

                <div className={styles.content}>
                    {activeTab !== 'security' && activeTab !== 'overview' && (
                        <div className={styles.toolbar}>
                            <div className={styles.searchBar}>
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder={activeTab === 'users' ? "Buscar usuarios..." : "Buscar actividad..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className={styles.stats}>
                                <div className={styles.stat}>
                                    <span className={styles.statValue}>{users.length}</span>
                                    <span className={styles.statLabel}>Total</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statValue}>{activity.length}</span>
                                    <span className={styles.statLabel}>Chats</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statValue}>{users.reduce((acc, curr) => acc + (curr.total_messages || 0), 0)}</span>
                                    <span className={styles.statLabel}>Msgs</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statValue}>{(users.reduce((acc, curr) => acc + (curr.total_tokens || 0), 0) / 1000).toFixed(1)}k</span>
                                    <span className={styles.statLabel}>Tokens</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'overview' ? (
                        <div className={styles.overviewGrid}>
                            <div className={styles.metricCard}>
                                <Users size={18} />
                                <div>
                                    <span className={styles.metricValue}>{users.length}</span>
                                    <span className={styles.metricLabel}>Usuarios totales</span>
                                </div>
                            </div>
                            <div className={styles.metricCard}>
                                <Crown size={18} />
                                <div>
                                    <span className={styles.metricValue}>{premiumUsers}</span>
                                    <span className={styles.metricLabel}>Premium activos</span>
                                </div>
                            </div>
                            <div className={styles.metricCard}>
                                <Shield size={18} />
                                <div>
                                    <span className={styles.metricValue}>{adminUsers}</span>
                                    <span className={styles.metricLabel}>Admins</span>
                                </div>
                            </div>
                            <div className={styles.metricCard}>
                                <Activity size={18} />
                                <div>
                                    <span className={styles.metricValue}>{activeToday}</span>
                                    <span className={styles.metricLabel}>Actividad hoy</span>
                                </div>
                            </div>
                            <div className={styles.metricCard}>
                                <BarChart3 size={18} />
                                <div>
                                    <span className={styles.metricValue}>{totalMessages}</span>
                                    <span className={styles.metricLabel}>Mensajes generados</span>
                                </div>
                            </div>
                            <div className={styles.metricCard}>
                                <UserCheck size={18} />
                                <div>
                                    <span className={styles.metricValue}>{onboardingRate}%</span>
                                    <span className={styles.metricLabel}>Onboarding completado</span>
                                </div>
                            </div>

                            <div className={styles.panelCard}>
                                <h3>Top usuarios por uso</h3>
                                <div className={styles.simpleList}>
                                    {topUsers.map((u) => (
                                        <div key={u.id} className={styles.simpleRow}>
                                            <span>{u.full_name || u.email || 'Usuario'}</span>
                                            <span>{u.total_messages || 0} msgs</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.panelCard}>
                                <h3>Últimos chats creados</h3>
                                <div className={styles.simpleList}>
                                    {activity.slice(0, 5).map((act) => (
                                        <div key={act.id} className={styles.simpleRow}>
                                            <span>{act.title || 'Chat sin título'}</span>
                                            <span>{new Date(act.created_at).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className={styles.syncText}>Última actualización: {lastSyncAt ? lastSyncAt.toLocaleTimeString() : 'N/A'}</p>
                            </div>
                        </div>
                    ) : activeTab === 'users' ? (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Usuario</th>
                                        <th>Email</th>
                                        <th>Username</th>
                                        <th>Rol</th>
                                        <th>Uso (Mensajes/Tokens)</th>
                                        <th>Fecha Registro</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr key={user.id}>
                                            <td>
                                                <div className={styles.userInfo}>
                                                    <div className={styles.avatar}>
                                                        {user.full_name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <span>{user.full_name || 'Sin nombre'}</span>
                                                </div>
                                            </td>
                                            <td>{user.email}</td>
                                            <td style={{ color: '#a5b4fc' }}>@{user.username || 'sin-username'}</td>
                                            <td>
                                                {editingUser === user.id ? (
                                                    <select
                                                        defaultValue={user.role}
                                                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                                        className={styles.roleSelect}
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="premium">Premium</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                ) : (
                                                    <span className={`${styles.roleBadge} ${styles[user.role || 'user']}`}>
                                                        {user.role || 'user'}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                    <span style={{ fontWeight: '600', color: '#6366f1' }}>{user.total_messages || 0} msgs</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#888' }}>{user.total_tokens || 0} tokens</span>
                                                </div>
                                            </td>
                                            <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <div className={styles.actions}>
                                                    <button
                                                        className={styles.iconBtn}
                                                        onClick={() => setEditingUser(editingUser === user.id ? null : user.id)}
                                                        title="Editar Rol"
                                                    >
                                                        {editingUser === user.id ? <X size={18} /> : <Edit size={18} />}
                                                    </button>
                                                    <button
                                                        className={`${styles.iconBtn} ${styles.deleteBtn}`}
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        title="Eliminar Usuario"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : activeTab === 'activity' ? (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Chat / Título</th>
                                        <th>Propietario</th>
                                        <th>Fecha</th>
                                        <th>ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredActivity.map(act => (
                                        <tr key={act.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Activity size={16} style={{ color: '#888' }} />
                                                    <span style={{ fontWeight: '500' }}>{act.title || 'Chat sin título'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span>{act.profiles?.full_name || 'Desconocido'}</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#888' }}>{act.profiles?.email}</span>
                                                </div>
                                            </td>
                                            <td>{new Date(act.created_at).toLocaleString()}</td>
                                            <td style={{ fontSize: '0.7rem', color: '#444' }}>{act.id.slice(0, 8)}...</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={styles.securityGrid}>
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <Shield size={20} style={{ color: '#6366f1' }} />
                                    <h3>Estado del RLS</h3>
                                </div>
                                <p>Todos los perfiles, chats y mensajes tienen Row Level Security habilitado.</p>
                                <div className={styles.statusList}>
                                    <div className={styles.statusItem}>
                                        <CheckCircle size={16} color="#10b981" />
                                        <span>Perfiles: Protegido</span>
                                    </div>
                                    <div className={styles.statusItem}>
                                        <CheckCircle size={16} color="#10b981" />
                                        <span>Mensajes: Protegido</span>
                                    </div>
                                    <div className={styles.statusItem}>
                                        <CheckCircle size={16} color="#10b981" />
                                        <span>Chats: Protegido</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <AlertTriangle size={20} style={{ color: '#fbbf24' }} />
                                    <h3>Configuración del Sistema</h3>
                                </div>
                                <p>Configuración global de la plataforma.</p>
                                <div className={styles.configItem}>
                                    <span>Modo Mantenimiento</span>
                                    <button className={styles.toggleBtn}>Desactivado</button>
                                </div>
                                <div className={styles.configItem}>
                                    <span>Registros Abiertos</span>
                                    <button className={styles.toggleBtn}>Activado</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
