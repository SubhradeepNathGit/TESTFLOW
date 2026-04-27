import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import AuthContext from "../../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "../../components/auth/AuthLayout";

const Login = () => {
    const { login } = useContext(AuthContext);
    const [showPassword, setShowPassword] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm();

    const onSubmit = async (data) => {
        await login(data.email, data.password, "team");
    };

    return (
        <AuthLayout>
            <div className="w-full max-w-md px-6 sm:px-10 py-8 relative">
                <div className="mb-8 text-left">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight sm:whitespace-nowrap">
                        Welcome to TESTFLOW
                    </h2>
                    <p className="mt-2 text-sm text-slate-400 font-medium">Please sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                            <input
                                type="email"
                                {...register("email", { required: "Email is required" })}
                                className={`w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border rounded-xl focus:ring-4 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-white/20 transition-all outline-none text-slate-900 dark:text-slate-100 text-sm font-medium placeholder-slate-400 dark:placeholder-slate-600 shadow-sm ${errors.email ? 'border-red-500' : 'border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12]'}`}
                                placeholder="name@company.com"
                            />
                            {errors.email && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    {...register("password", { required: "Password is required" })}
                                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border rounded-xl focus:ring-4 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-white/20 transition-all outline-none text-slate-900 dark:text-slate-100 text-sm font-medium placeholder-slate-400 dark:placeholder-slate-600 shadow-sm ${errors.password ? 'border-red-500' : 'border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12]'}`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.password.message}</p>}
                        </div>
                    </div>

                    <div className="flex items-center justify-end">
                        <Link to="/forgot-password" className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-slate-900/10 dark:shadow-none hover:bg-black dark:hover:bg-slate-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Authenticating...</span>
                            </div>
                        ) : "Sign In"}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        Don't have an account?{" "}
                        <Link to="/register" className="text-slate-900 dark:text-white font-bold hover:text-indigo-600 transition-colors">
                            Create account
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
};

export default Login;
