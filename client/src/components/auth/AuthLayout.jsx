import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Logo from '../common/Logo';

const authImages = {
    '/login': {
        src: '/testflow-login.png',
        title: 'Welcome Back',
        subtitle: 'Security Portal',
        desc: 'Access your examination dashboard, monitor academic integrity and track test outcomes.'
    },
    '/register': {
        src: '/testflow-signup.jpg',
        title: 'Create Account',
        subtitle: 'Get Started',
        desc: 'Join TESTFLOW — the smart exam portal for corporate. Manage tests, track examinees and evaluate results.'
    },
    '/forgot-password': {
        src: '/testflow-forget.jpg',
        title: 'Recover Access',
        subtitle: 'Account Recovery',
        desc: 'Don\'t worry — we\'ll help you securely reset your password and get back to your dashboard quickly.'
    },
    '/reset-password': {
        src: '/testflow-reset.jpg',
        title: 'Security Update',
        subtitle: 'Account Protection',
        desc: 'Choose a strong, unique password to ensure the security of your TESTFLOW academic portal.'
    },
    '/verify-email': {
        src: '/testflow-email.jpg',
        title: 'Verify Identity',
        subtitle: 'Verification',
        desc: 'Please verify your email address to complete your registration and access the platform.'
    },
    '/email-sent': {
        src: '/testflow-email.jpg',
        title: 'Check Your Inbox',
        subtitle: 'Secure Link Sent',
        desc: 'We\'ve sent a secure recovery link. Follow the instructions in the email to regain access to your account.'
    },
    '/admin': {
        src: '/admin.jpg',
        title: 'Admin Access',
        subtitle: 'Security Portal',
        desc: 'Platform administrative portal. Manage global operations, monitor system health, and oversee all registered institutions.'
    }
};

const AuthLayout = ({ children }) => {
    const location = useLocation();
    const path = location.pathname.startsWith('/reset-password') ? '/reset-password' : location.pathname;
    const config = authImages[path] || authImages['/login'];

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-black overflow-hidden">
            {/* Preload all images (hidden) */}
            <div className="hidden">
                {Object.entries(authImages).map(([path, img]) => (
                    <img key={path} src={img.src} alt="preload" />
                ))}
            </div>

            {/* Left panel — Shared & Persistent */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 h-full overflow-hidden">
                <img
                    src={config.src}
                    alt="Background"
                    className="absolute inset-0 w-full h-full object-cover z-0"
                    fetchPriority="high"
                />
                <div className="absolute inset-0 bg-black/30 z-10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>
                
                <div className="absolute top-12 left-12 z-20 drop-shadow-xl">
                    <Logo />
                </div>
                
                <div className="absolute bottom-12 left-12 right-12 text-white z-20 drop-shadow-2xl">
                    {config.subtitle && (
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-4 drop-shadow-md">
                            {config.subtitle}
                        </span>
                    )}
                    <h2 className="text-4xl font-bold mb-4 tracking-tight">{config.title}</h2>
                    <p className="text-lg text-slate-300 font-medium leading-relaxed max-w-lg drop-shadow-md">
                        {config.desc}
                    </p>
                </div>
            </div>

            {/* Right panel — Form Content */}
            <div className="w-full lg:w-1/2 h-full overflow-y-auto bg-white dark:bg-black">
                <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
