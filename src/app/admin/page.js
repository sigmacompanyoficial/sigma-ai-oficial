'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
    Users, Shield, Activity, Search, Trash2, Edit, Save, X,
    CheckCircle, AlertTriangle, LogOut, ChevronLeft
} from 'lucide-react';
import styles from './admin.module.css';

export default function AdminPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [theme, setTheme] = useState('dark');
    const router = useRouter();

    useEffect(() => {
        const savedTheme = localStorage.getItem('sigma-theme') || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        // Check profile for role
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
            // Not authorized
            router.push('/chat');
            return;
        }

        setCurrentUser(profile);
        setIsAdmin(true);
        fetchUsers();
    };

    const fetchUsers = async () => {
        try {
            // Fetch profiles
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error) {
                setUsers(data || []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

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
        if (!confirm('¿Estás seguro de que quieres eliminar a este usuario? Esta acción no se puede deshacer.')) return;

        // In a real app, you'd use a server-side function to delete from auth.users too
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
                    <button className={`${styles.navItem} ${styles.active}`}>
                        <Users size={20} />
                        Usuarios
                    </button>
                    <button className={styles.navItem}>
                        <Activity size={20} />
                        Actividad
                    </button>
                    <button className={styles.navItem}>
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
                    <h1>Gestión de Usuarios</h1>
                    <div className={styles.userProfile}>
                        <span>{currentUser?.full_name}</span>
                        <span className={styles.badge}>{currentUser?.role}</span>
                    </div>
                </header>

                <div className={styles.content}>
                    <div className={styles.toolbar}>
                        <div className={styles.searchBar}>
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Buscar usuarios..."
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
                                <span className={styles.statValue}>{users.filter(u => u.role === 'admin').length}</span>
                                <span className={styles.statLabel}>Admins</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
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
                                            <span className={styles.statusBadge}>
                                                <CheckCircle size={14} /> Activo
                                            </span>
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
                </div>
            </main>
        </div>
    );
}
