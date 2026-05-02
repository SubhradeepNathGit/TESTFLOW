import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import AuthContext from "../../context/AuthContext";
import { Eye, EyeOff, ChevronDown, Check, ShieldCheck, Users, X } from "lucide-react";
import AuthLayout from "../../components/auth/AuthLayout";

const passwordRules = [
    { id: 'len',     label: 'At least 8 characters',       test: (v) => v.length >= 8 },
    { id: 'upper',  label: '1 uppercase letter (A–Z)',     test: (v) => /[A-Z]/.test(v) },
    { id: 'lower',  label: '1 lowercase letter (a–z)',     test: (v) => /[a-z]/.test(v) },
    { id: 'digit',  label: '1 number (0–9)',               test: (v) => /[0-9]/.test(v) },
    { id: 'special',label: '1 special character (!@#$…)',  test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const getStrength = (val) => passwordRules.filter(r => r.test(val)).length;
const strengthColors = ['bg-red-500','bg-red-400','bg-orange-400','bg-amber-400','bg-emerald-500'];
const strengthLabels = ['Very Weak','Weak','Fair','Good','Strong'];

const Register = () => {
    const { register: registerUser } = useContext(AuthContext);
    const [showPassword, setShowPassword] = useState(false);
    const [isRoleOpen, setIsRoleOpen] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: { role: "owner" }
    });

    const passwordValue = watch("password", "");
    const strength = getStrength(passwordValue);

    const navigate = useNavigate();
    const currentRole = useWatch({ control, name: "role", defaultValue: "owner" });

    const roles = [
        { id: "owner", title: "Institution Admin", desc: "Register a new institution", icon: ShieldCheck },
        { id: "instructor", title: "Instructor / Teacher", desc: "Join an existing institution", icon: Users }
    ];

    const onSubmit = async (data) => {
        try {
            await registerUser({
                name: data.name,
                email: data.email,
                password: data.password,
                role: data.role,
                institutionName: data.institutionName
            });
            navigate("/verify-email", { state: { email: data.email } });
        } catch {
            // Error handling can be added here if needed
        }
    };

    return (
        <AuthLayout>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md px-6 sm:px-10 py-8 relative"
            >
                <div className="mb-8 text-left">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                        Create Account
                    </h2>
                    <p className="mt-2 text-sm text-slate-400 font-medium">Select your role and get started</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-4">
                        <div className="z-10 relative">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1.5">Registration Role</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsRoleOpen(!isRoleOpen)}
                                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border rounded-xl focus:ring-4 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-white/20 transition-all outline-none text-sm font-medium shadow-sm flex items-center justify-between text-left ${errors.role ? 'border-red-500' : 'border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12]'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        {currentRole === 'owner' ? <ShieldCheck size={18} className="text-indigo-600" /> : <Users size={18} className="text-indigo-600" />}
                                        <span className="text-slate-900 dark:text-slate-100">{currentRole === 'owner' ? 'Institution Admin' : 'Instructor / Teacher'}</span>
                                    </div>
                                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isRoleOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isRoleOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-20">
                                        {roles.map((role) => (
                                            <button
                                                key={role.id}
                                                type="button"
                                                onClick={() => { setValue("role", role.id); setIsRoleOpen(false); }}
                                                className={`w-full p-4 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors text-left ${currentRole === role.id ? 'bg-slate-50/50 dark:bg-white/[0.04]' : ''}`}
                                            >
                                                <div className={`mt-1 p-2 rounded-lg ${currentRole === role.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                                                    <role.icon size={16} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{role.title}</span>
                                                        {currentRole === role.id && <Check size={14} className="text-indigo-600" />}
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-0.5">{role.desc}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                            <input
                                type="text"
                                {...register("name", { required: "Name is required" })}
                                className={`w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border rounded-xl focus:ring-4 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-white/20 transition-all outline-none text-slate-900 dark:text-slate-100 text-sm font-medium placeholder-slate-400 shadow-sm ${errors.name ? 'border-red-500' : 'border-slate-200 dark:border-white/[0.06] hover:border-slate-300'}`}
                                placeholder="John Doe"
                            />
                            {errors.name && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.name.message}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                            <input
                                type="email"
                                {...register("email", { required: "Email is required" })}
                                className={`w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border rounded-xl focus:ring-4 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-white/20 transition-all outline-none text-slate-900 dark:text-slate-100 text-sm font-medium placeholder-slate-400 shadow-sm ${errors.email ? 'border-red-500' : 'border-slate-200 dark:border-white/[0.06] hover:border-slate-300'}`}
                                placeholder="name@company.com"
                            />
                            {errors.email && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1.5">Institution Name</label>
                            <input
                                type="text"
                                {...register("institutionName", { required: "Institution name is required" })}
                                className={`w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border rounded-xl focus:ring-4 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-white/20 transition-all outline-none text-slate-900 dark:text-slate-100 text-sm font-medium placeholder-slate-400 shadow-sm ${errors.institutionName ? 'border-red-500' : 'border-slate-200 dark:border-white/[0.06] hover:border-slate-300'}`}
                                placeholder="e.g. Stanford University"
                            />
                            {errors.institutionName && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.institutionName.message}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1.5">Create Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    {...register("password", {
                                        required: "Password is required",
                                        validate: (val) => {
                                            if (val.length < 8) return "At least 8 characters required";
                                            if (!/[A-Z]/.test(val)) return "Must contain an uppercase letter";
                                            if (!/[a-z]/.test(val)) return "Must contain a lowercase letter";
                                            if (!/[0-9]/.test(val)) return "Must contain a number";
                                            if (!/[^A-Za-z0-9]/.test(val)) return "Must contain a special character";
                                            return true;
                                        }
                                    })}
                                    onFocus={() => setPasswordFocused(true)}
                                    onBlur={() => setPasswordFocused(false)}
                                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border rounded-xl focus:ring-4 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-white/20 transition-all outline-none text-slate-900 dark:text-slate-100 text-sm font-medium placeholder-slate-400 shadow-sm ${errors.password ? 'border-red-500' : 'border-slate-200 dark:border-white/[0.06] hover:border-slate-300'}`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Strength bar & Checklist */}
                            <AnimatePresence>
                                {passwordValue.length > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-2.5 space-y-2 overflow-hidden"
                                    >
                                        <div className="flex gap-1">
                                            {[0,1,2,3,4].map(i => (
                                                <div key={i} className="flex-1 h-1 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-300 ${i < strength ? strengthColors[strength - 1] : ''}`}
                                                        style={{ width: i < strength ? '100%' : '0%' }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <p className={`text-[11px] font-bold ${strengthColors[strength-1]?.replace('bg-','text-') || 'text-slate-400'}`}>
                                            {passwordValue.length > 0 ? strengthLabels[strength - 1] || 'Very Weak' : ''}
                                        </p>
                                    </motion.div>
                                )}

                                {(passwordFocused || passwordValue.length > 0) && (
                                    <motion.ul 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-2 space-y-1 overflow-hidden"
                                    >
                                        {passwordRules.map(rule => {
                                            const passed = rule.test(passwordValue);
                                            return (
                                                <li key={rule.id} className={`flex items-center gap-2 text-[11px] font-semibold transition-colors ${passed ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`}>
                                                    {passed
                                                        ? <Check size={11} className="shrink-0" />
                                                        : <X size={11} className="shrink-0" />
                                                    }
                                                    {rule.label}
                                                </li>
                                            );
                                        })}
                                    </motion.ul>
                                )}
                            </AnimatePresence>

                            {errors.password && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.password.message}</p>}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-slate-900/10 dark:shadow-none hover:bg-black dark:hover:bg-slate-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900 rounded-full animate-spin" />
                                <span>Creating Account</span>
                            </div>
                        ) : "Sign Up"}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        Already have an account?{" "}
                        <Link to="/login" className="text-slate-900 dark:text-white font-bold hover:text-indigo-600 transition-colors">
                            Sign In
                        </Link>
                    </p>
                </div>
            </motion.div>
        </AuthLayout>
    );
};

export default Register;
