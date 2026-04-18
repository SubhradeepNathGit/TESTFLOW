import { useContext, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import Logo from '../common/Logo';
import ProfileModal from '../modals/ProfileModal';
import useSidebarStore from '../../store/useSidebarStore';
import { getArchivedTests } from '../../api/testApi';
import {
    LayoutDashboard, BookOpen, Trophy, Users, ShieldCheck,
    LogOut, Menu, X, ChevronLeft, ChevronRight, User, BarChart3, Library, FileText, Briefcase
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const Sidebar = () => {
    const { user, logout } = useContext(AuthContext);
    const { isOpen, toggleSidebar } = useSidebarStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const isSuperAdmin = user?.role === 'super_admin';
    const isInstructor = user?.role === 'instructor';
    const isAdmin = user?.role === 'owner';
    const isStudent = user?.role === 'student';

    const { data: archivedData } = useQuery({
        queryKey: ['archived-tests'],
        queryFn: () => getArchivedTests().then(r => r.data.data),
        enabled: !!user && !isStudent && !isSuperAdmin,
        staleTime: 1000 * 30,
    });

    const archiveCount = archivedData?.length ?? 0;

    // Nav links per role
    const getNavLinks = () => {
        if (isSuperAdmin) return [
            { label: 'Platform Overview', icon: LayoutDashboard, path: '/admin/dashboard' },
        ];
        if (isInstructor) return [
            { label: 'My Dashboard', icon: LayoutDashboard, path: '/instructor-dashboard' },
            { label: 'Analytics', icon: BarChart3, path: '/analytics' },
            { label: 'Archive', icon: Library, path: '/archive' },
            { label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
            { label: 'Answer Keys', icon: FileText, path: '/answer-keys' },
        ];
        if (isAdmin) return [
            { label: 'Manage Instructors', icon: Briefcase, path: '/instructors' },
            { label: 'Manage Students', icon: Users, path: '/students' },
            { label: 'Analytics', icon: BarChart3, path: '/analytics' },
            { label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
            { label: 'Answer Keys', icon: FileText, path: '/answer-keys' },
        ];
        // Student
        return [
            { label: 'My Tests', icon: BookOpen, path: '/student-dashboard' },
            { label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
            { label: 'Answer Keys', icon: FileText, path: '/answer-keys' },
        ];
    };

    const navLinks = getNavLinks();
    const theme = {
        bg: isSuperAdmin ? 'bg-[#0f112a]' : 'bg-slate-900',
        border: 'border-white/5',
        itemHover: 'hover:bg-white/5',
        itemActive: 'bg-white text-slate-900 shadow-lg',
    };

    const isActive = (path) => location.pathname === path;

    const userInitials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    const profileImageUrl = user?.profileImage && user.profileImage !== 'no-photo.jpg'
        ? (user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:3006/${user.profileImage}`)
        : null;

    const getRoleLabel = () => {
        if (isSuperAdmin) return 'Platform Admin';
        if (isInstructor) return 'Instructor';
        if (isAdmin) return 'Institution Admin';
        return 'Student';
    };

    return (
        <>
            {/* Mobile Top Bar */}
            <div className={`lg:hidden fixed top-0 left-0 right-0 ${theme.bg} border-b ${theme.border} z-40 shadow-lg`}>
                <div className="flex items-center justify-between px-5 py-4">
                    <Logo />
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10">
                        {isMobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
                    </button>
                </div>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 bg-black/60 z-30" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 h-screen ${theme.bg} z-50 transition-all duration-300 border-r ${theme.border} flex flex-col
                ${isOpen ? 'w-72' : 'w-20'}
                ${isMobileMenuOpen ? 'translate-x-0 !w-72' : 'max-lg:-translate-x-full'}`}
            >
                {/* Logo Section */}
                <div className={`px-6 pt-10 pb-6 border-b ${theme.border} flex ${isOpen ? 'items-center justify-between' : 'flex-col items-center gap-8 px-0'}`}>
                    <Link to="/">
                        <Logo hideText={!isOpen && !isMobileMenuOpen} />
                    </Link>
                    <button
                        onClick={toggleSidebar}
                        className="hidden lg:flex items-center justify-center text-slate-500 hover:text-white transition-all"
                    >
                        {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 overflow-y-auto py-6 space-y-1">
                    {(isOpen || isMobileMenuOpen) && (
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-4">Navigation</p>
                    )}
                    {navLinks.map(({ label, icon: Icon, path }) => (
                        <button
                            key={path}
                            onClick={() => { navigate(path); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 relative
                                ${isActive(path) ? theme.itemActive : `text-slate-400 ${theme.itemHover} hover:text-white`}
                                ${!isOpen && !isMobileMenuOpen ? 'justify-center px-0' : 'justify-between'}`}
                            title={!isOpen ? label : ''}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                {(isOpen || isMobileMenuOpen) && <span>{label}</span>}
                            </div>

                            {/* Archive Badge */}
                            {path === '/archive' && archiveCount > 0 && (
                                <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-black rounded-full transition-all
                                    ${isActive(path) ? 'bg-white text-indigo-600' : 'bg-rose-500 text-white'}
                                    ${!isOpen && !isMobileMenuOpen ? 'absolute -top-1 -right-1 px-0 min-w-[16px] h-[16px] text-[8px] ring-2 ring-[#0f112a]' : ''}
                                `}>
                                    {archiveCount > 99 ? '99+' : archiveCount}
                                </span>
                            )}
                        </button>
                    ))}

                </nav>

                {/* User Footer */}
                <div className={`p-4 border-t ${theme.border}`}>
                    <button
                        onClick={() => setIsProfileModalOpen(true)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-all text-left mb-3
                            ${!isOpen && !isMobileMenuOpen ? 'justify-center p-2' : ''}`}
                    >
                        <div className="relative flex-shrink-0">
                            {profileImageUrl ? (
                                <img src={profileImageUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-slate-700" />
                            ) : (
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-600 border-2 border-slate-700">
                                    <span className="text-white text-xs font-bold">{userInitials}</span>
                                </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                        </div>
                        {(isOpen || isMobileMenuOpen) && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{getRoleLabel()}</p>
                            </div>
                        )}
                    </button>
                    <button
                        onClick={logout}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold hover:bg-red-500/20 hover:text-red-400 transition-all
                            ${isOpen || isMobileMenuOpen ? 'w-full px-4' : 'w-10 mx-auto'}`}
                        title={!isOpen ? 'Sign Out' : ''}
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        {(isOpen || isMobileMenuOpen) && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
        </>
    );
};

export default Sidebar;
