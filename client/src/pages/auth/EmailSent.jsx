import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import AuthContext from "../../context/AuthContext";
import AuthLayout from "../../components/auth/AuthLayout";

const EmailSent = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { forgotPassword } = useContext(AuthContext);
    const [sending, setSending] = useState(false);
    const email = state?.email;

    useEffect(() => {
        if (!email) navigate("/forgot-password");
    }, [email, navigate]);

    const handleResend = async () => {
        if (sending || !email) return;
        setSending(true);
        try {
            await forgotPassword(email);
        } finally {
            setSending(false);
        }
    };

    return (
        <AuthLayout>
            <div className="w-full max-w-md px-6 sm:px-10 py-8 relative">
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-8">
                    <MailCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                </div>

                <div className="mb-8 text-left">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                        Check Your Inbox
                    </h2>
                    <p className="mt-2 text-sm text-slate-400 font-medium leading-relaxed">
                        We've sent a reset link to{" "}
                        <span className="font-bold text-slate-900 dark:text-slate-200">{email}</span>.
                        <br />Please check your inbox to proceed.
                    </p>
                </div>

                <div className="space-y-6">
                    <Link
                        to="/login"
                        className="block w-full text-center py-4 rounded-xl text-sm font-bold text-white dark:text-slate-900 bg-slate-900 dark:bg-white hover:bg-black dark:hover:bg-slate-100 transition-all active:scale-[0.98] shadow-lg shadow-slate-900/10"
                    >
                        Return to Login
                    </Link>

                    <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                        <p className="text-sm font-medium text-slate-500">
                            Email not received?{" "}
                            <button
                                onClick={handleResend}
                                disabled={sending}
                                className="font-bold text-slate-900 dark:text-slate-200 hover:text-indigo-600 transition-colors disabled:opacity-50"
                            >
                                {sending ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 border-2 border-slate-900/30 border-t-slate-900 dark:border-white/30 dark:border-t-white rounded-full animate-spin" />
                                        <span>Sending</span>
                                    </div>
                                ) : "Send Again"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
};

export default EmailSent;
