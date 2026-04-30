import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import AuthLayout from "../../components/auth/AuthLayout";

const SuperAdminLogin = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            setSuccess(true);
            // Redirection happens in context
        } catch (err) {
            // Error handled by context
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="w-full max-w-md px-6 sm:px-10 py-8 relative">
                <div className={`transition-all duration-500 ${success ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                    <div className="mb-8 text-left">
                        <div className="w-12 h-12 bg-slate-900 dark:bg-white/10 text-white flex items-center justify-center rounded-2xl mb-6">
                            <ShieldCheck size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                            Platform Admin
                        </h2>
                        <p className="mt-2 text-sm text-slate-400 font-medium">Elevated access for system administration</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1.5">Admin Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl focus:ring-4 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-white/20 transition-all outline-none text-slate-900 dark:text-slate-100 text-sm font-medium shadow-sm"
                                placeholder="admin@testflow.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1.5">Secure Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl focus:ring-4 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-white/20 transition-all outline-none text-slate-900 dark:text-slate-100 text-sm font-medium shadow-sm"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-slate-900/10 dark:shadow-none hover:bg-black dark:hover:bg-slate-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900 rounded-full animate-spin" />
                                <span>Authenticating Admin</span>
                            </div>
                        ) : success ? "Access Granted" : "Secure Sign In"}
                    </button>
                </form>
                </div>
            </div>
        </AuthLayout>
    );
};

export default SuperAdminLogin;
