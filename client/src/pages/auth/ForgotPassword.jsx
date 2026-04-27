import { useContext } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import { ArrowLeft } from "lucide-react";
import AuthLayout from "../../components/auth/AuthLayout";

const ForgotPassword = () => {
    const { forgotPassword } = useContext(AuthContext);
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm();

    const onSubmit = async (data) => {
        try {
            await forgotPassword(data.email);
            navigate("/email-sent", { state: { email: data.email } });
        } catch { }
    };

    return (
        <AuthLayout>
            <div className="w-full max-w-md px-6 sm:px-10 py-8 relative">
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                    Back to Sign In
                </Link>

                <div className="mb-8 text-left">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                        Recover Access
                    </h2>
                    <p className="mt-2 text-sm text-slate-400 font-medium">Enter your email and we'll send recovery instructions</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                        <input
                            type="email"
                            {...register("email", {
                                required: "Email is required",
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "Invalid email address"
                                }
                            })}
                            className={`w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border rounded-xl focus:ring-4 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-white/20 transition-all outline-none text-slate-900 dark:text-slate-100 text-sm font-medium placeholder-slate-400 shadow-sm ${errors.email ? 'border-red-500' : 'border-slate-200 dark:border-white/[0.06] hover:border-slate-300'}`}
                            placeholder="name@company.com"
                        />
                        {errors.email && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.email.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-slate-900/10 dark:shadow-none hover:bg-black dark:hover:bg-slate-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Sending Link..." : "Send Reset Link"}
                    </button>
                </form>
            </div>
        </AuthLayout>
    );
};

export default ForgotPassword;
