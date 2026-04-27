import { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import { toast } from "react-toastify";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import AuthLayout from "../../components/auth/AuthLayout";

const VerifyOTP = () => {
    const { verifyOtp, resendOtp } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email;

    const [otp, setOtp] = useState("");
    const [timeLeft, setTimeLeft] = useState(179);
    const [canResend, setCanResend] = useState(false);
    const [verifying, setVerifying] = useState(false);

    useEffect(() => { if (!email) navigate("/register"); }, [email, navigate]);

    useEffect(() => {
        if (timeLeft <= 0) { setCanResend(true); return; }
        const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
        return () => clearInterval(t);
    }, [timeLeft]);

    const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    const handleVerify = async (e) => {
        if (e) e.preventDefault();
        if (verifying) return;
        if (otp.length !== 6) { toast.error("Please enter a valid 6-digit OTP"); return; }
        try {
            setVerifying(true);
            await verifyOtp(email, otp);
            toast.success("Email verified! Please login.");
            navigate("/login");
        } catch { setVerifying(false); }
    };

    const handleResend = async () => {
        try { await resendOtp(email); setTimeLeft(60); setCanResend(false); } catch { }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { if (otp.length === 6) handleVerify(); }, [otp]);

    return (
        <AuthLayout>
            <div className="w-full max-w-md px-6 sm:px-10 py-8 relative">
                <Link
                    to="/register"
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                    Back to Registration
                </Link>

                <div className="mb-8 text-left">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                        <ShieldCheck size={24} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                        Verify Email
                    </h2>
                    <p className="mt-2 text-sm text-slate-400 font-medium">We've sent a 6-digit code to <span className="text-slate-900 dark:text-white font-bold">{email}</span></p>
                </div>

                <form onSubmit={handleVerify} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-3 text-center">Enter Verification Code</label>
                        <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                            className="w-full px-4 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-2xl text-center text-3xl font-black tracking-[0.5em] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-slate-900 dark:text-white shadow-sm"
                            placeholder="000000"
                            autoFocus
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">
                            Expiring in: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{fmt(timeLeft)}</span>
                        </p>
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={!canResend}
                            className={`text-sm font-bold transition-colors ${canResend ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 cursor-not-allowed'}`}
                        >
                            Resend Code
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={verifying || otp.length !== 6}
                        className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-slate-900/10 dark:shadow-none hover:bg-black dark:hover:bg-slate-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {verifying ? "Verifying..." : "Verify & Continue"}
                    </button>
                </form>
            </div>
        </AuthLayout>
    );
};

export default VerifyOTP;
