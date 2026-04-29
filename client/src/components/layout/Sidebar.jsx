import { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AuthContext from '../../context/AuthContext';
import Logo from '../common/Logo';
import ProfileModal from '../modals/ProfileModal';
import useSidebarStore from '../../store/useSidebarStore';
import { getArchivedTests } from '../../api/testApi';
import {
    LayoutDashboard, BookOpen, Trophy, Users,
    LogOut, Menu, X, ChevronLeft, ChevronRight, BarChart3, Library, FileText, Briefcase, Database, GraduationCap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const Sidebar = () => {
    const { user, logout } = useContext(AuthContext);
    const { isOpen, toggleSidebar } = useSidebarStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

    const getNavLinks = () => {
        if (isSuperAdmin) return [
            { label: 'Overview', icon: LayoutDashboard, path: '/admin/dashboard' },
            { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
            { label: 'Institutions', icon: Database, path: '/admin/institutions' },
            { label: 'Instructors', icon: Briefcase, path: '/admin/instructors' },
            { label: 'Students', icon: GraduationCap, path: '/admin/students' },
            { label: 'Archive', icon: Library, path: '/admin/archive' },
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
        return [
            { label: 'My Tests', icon: BookOpen, path: '/student-dashboard' },
            { label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
            { label: 'Answer Keys', icon: FileText, path: '/answer-keys' },
        ];
    };

    const navLinks = getNavLinks();
    const sidebarStyle = {
        bg: isSuperAdmin ? 'bg-[#0f112a]' : 'bg-slate-900',
        border: 'border-white/5',
        itemHover: 'hover:bg-black/40',
        itemActive: 'bg-white text-slate-900 shadow-none',
        textMain: 'text-white',
        textSub: 'text-slate-400',
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
            <div className={`lg:hidden fixed top-0 left-0 right-0 ${sidebarStyle.bg} border-b ${sidebarStyle.border} z-40 shadow-none`}>
                <div className="flex items-center justify-between px-5 py-4">
                    <Logo />
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10">
                        {isMobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
                    </button>
                </div>
            </div>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="lg:hidden fixed inset-0 bg-black/60 z-30"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.div
                initial={false}
                animate={{
                    width: isOpen ? 256 : 80,
                    x: isMobileMenuOpen ? 0 : (windowWidth < 1024 ? -256 : 0)
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`
                    fixed top-0 left-0 h-screen z-50 
                    ${sidebarStyle.bg} ${sidebarStyle.border} border-r
                    flex flex-col shadow-none overflow-x-hidden
                `}
            >
                {/* Logo Section */}
                <div className={`px-6 pt-10 pb-6 border-b ${sidebarStyle.border} flex transition-all duration-500 ${isOpen ? 'items-center justify-between' : 'flex-col items-center justify-center gap-6 px-0'}`}>
                    <Link to="/">
                        <Logo hideText={!isOpen} />
                    </Link>
                    <button
                        onClick={toggleSidebar}
                        className={`
                            hidden lg:flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500
                            bg-white/[0.03] hover:bg-white/[0.08] text-slate-500 hover:text-indigo-400 border border-white/5 hover:border-indigo-500/20
                            backdrop-blur-xl shadow-xl group active:scale-90
                        `}
                    >
                        <ChevronLeft className={`w-4 h-4 transition-all duration-500 ${isOpen ? 'rotate-0' : 'rotate-180'} group-hover:scale-110`} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 overflow-y-auto overflow-x-hidden py-6 space-y-10">
                    <p className={`text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-4 transition-all duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 translate-x-[-10px]'}`}>
                        Navigation
                    </p>

                    {navLinks.map(({ label, icon: Icon, path }) => {
                        const active = isActive(path);
                        return (
                            <button
                                key={path}
                                onClick={() => { navigate(path); setIsMobileMenuOpen(false); }}
                                className={`flex items-center transition-all duration-500 relative group/nav
                                    ${active ? sidebarStyle.itemActive : `text-slate-400 ${sidebarStyle.itemHover}`}
                                    ${!isOpen
                                        ? 'w-12 h-12 justify-center rounded-2xl mx-auto mb-2'
                                        : 'w-full px-3 py-2.5 rounded-xl mb-3'}`}
                                title={!isOpen ? label : ''}
                            >
                                <div className={`flex items-center transition-all duration-500 ${isOpen ? 'px-0' : 'justify-center'}`}>
                                    <Icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover/nav:scale-110" />
                                    <span className={`text-sm font-semibold whitespace-nowrap transition-all duration-500 ease-in-out ${isOpen ? 'opacity-100 ml-3 w-auto' : 'opacity-0 ml-0 w-0 overflow-hidden'}`}>
                                        {label}
                                    </span>
                                </div>

                                {path === '/archive' && archiveCount > 0 && (
                                    <span className={`flex items-center justify-center text-[10px] font-black rounded-full transition-all duration-500 flex-shrink-0
                                        ${active ? 'bg-indigo-600 text-white' : 'bg-rose-500 text-white'}
                                        ${!isOpen
                                            ? 'absolute -top-1 -right-1 w-5 h-5 ring-4 ring-slate-900'
                                            : 'min-w-[20px] h-5 px-1.5 ml-auto'}
                                    `}>
                                        {archiveCount > 99 ? '99+' : archiveCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* User Footer */}
                <div className={`p-4 space-y-2 transition-all duration-500 ${!isOpen ? 'px-2' : ''}`}>
                    <div className={`
                            flex items-center gap-3 p-3 rounded-2xl transition-all duration-300
                            ${sidebarStyle.itemHover} cursor-pointer group/profile
                            ${!isOpen ? 'justify-center p-2' : ''}
                        `} onClick={() => setIsProfileModalOpen(true)}>
                        <div className="relative flex-shrink-0">
                            {profileImageUrl ? (
                                <img src={profileImageUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-slate-700" loading="eager" fetchpriority="high" />
                            ) : (
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-600 border-2 border-slate-700">
                                    <span className="text-white text-xs font-bold">{userInitials}</span>
                                </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                        </div>
                        <div className={`flex-1 min-w-0 transition-all duration-500 ${isOpen ? 'opacity-100 ml-0 w-auto' : 'opacity-0 ml-[-20px] w-0 overflow-hidden'}`}>
                            <p className={`text-sm font-bold truncate ${sidebarStyle.textMain}`}>{user?.name || 'User'}</p>
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${sidebarStyle.textSub}`}>{getRoleLabel()}</p>
                        </div>
                    </div>

                    <div className="space-y-1 mt-2">
                        <button
                            onClick={logout}
                            className={`
                                flex items-center transition-all duration-500 rounded-xl
                                bg-rose-500/[0.04] hover:bg-rose-500/[0.08] text-rose-500/80 hover:text-rose-500 border border-rose-500/10 hover:border-rose-500/20 group/logout
                                ${!isOpen ? 'w-12 h-11 justify-center mx-auto' : 'w-full py-3 px-4 justify-center'}
                            `}
                            title={!isOpen ? 'Sign Out' : ''}
                        >
                            <LogOut className={`${!isOpen ? 'w-4 h-4' : 'w-5 h-5'} flex-shrink-0 transition-transform group-hover/logout:translate-x-0.5`} />
                            <span className={`font-bold text-xs tracking-wide whitespace-nowrap transition-all duration-500 ${isOpen ? 'opacity-100 ml-2.5 w-auto' : 'opacity-0 ml-0 w-0 overflow-hidden'}`}>
                                Sign Out
                            </span>
                        </button>
                    </div>
                </div>
            </motion.div>

            <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
        </>
    );
};

export default Sidebar;

