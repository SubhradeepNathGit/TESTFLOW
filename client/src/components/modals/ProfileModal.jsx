import React, { useState, useRef, useEffect } from "react";
import {
    X,
    Camera,
    User,
    Mail,
    Save,
    Loader,
    ChevronRight,
    Lock,
    Eye,
    EyeOff,
    Pencil
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../api/axiosInstance";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

const ProfileModal = ({ isOpen, onClose }) => {
    const { user, updatePassword, setUser } = useAuth();
    const [activeTab, setActiveTab] = useState("info");
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(user?.name || "");
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const fileInputRef = useRef(null);

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();

        if (passwordData.new !== passwordData.confirm) {
            toast.error("New passwords do not match");
            return;
        }

        if (passwordData.new.length < 6) {
            toast.error("New password must be at least 6 characters long");
            return;
        }

        try {
            setIsUpdatingPassword(true);
            await updatePassword(passwordData.current, passwordData.new);
            setPasswordData({ current: '', new: '', confirm: '' });
        } catch (err) {
            console.error("Password update error:", err);
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    useEffect(() => {
        if (isOpen && user) {
            setEditName(user.name);
        }
    }, [isOpen, activeTab, user]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB");
            return;
        }

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(file);
    };

    const handleSaveProfile = async () => {
        if (!editName.trim()) {
            toast.error("Name cannot be empty");
            return;
        }

        try {
            setIsSaving(true);
            const formData = new FormData();
            formData.append("name", editName.trim());
            if (selectedFile) {
                formData.append("profileImage", selectedFile);
            }

            const res = await api.put("/users/profile", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data.success) {
                toast.success("Profile updated successfully!");
                setUser(res.data.data);
                setIsEditing(false);
                setSelectedFile(null);
                setPreviewUrl(null);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const profileImageUrl =
        previewUrl ||
        (user?.profileImage && user.profileImage !== "no-photo.jpg"
            ? user.profileImage.startsWith("http")
                ? user.profileImage
                : `http://localhost:3006/${user.profileImage}`
            : null);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md"
                        onClick={onClose}
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative w-full max-w-5xl bg-white/90 dark:bg-[#0A0A0A]/90 backdrop-blur-3xl rounded-[28px] border border-slate-200/60 dark:border-white/[0.08] shadow-2xl dark:shadow-none overflow-hidden flex flex-col h-[85vh] md:min-h-[500px]"
                    >
                        {/* Header (No divider) */}
                        <div className="flex items-center justify-between px-6 py-5 md:px-8 md:py-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-center shrink-0">
                                    <User className="w-5 h-5 text-slate-600 dark:text-slate-300" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">My Profile</h2>
                                    <p className="text-[10px] md:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                                        Account settings
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {activeTab === "info" && !isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-3 bg-white dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all"
                                        title="Edit Profile"
                                    >
                                        <Pencil className="w-4 h-4" strokeWidth={1.5} />
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-3 bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.04] text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all"
                                >
                                    <X className="w-5 h-5" strokeWidth={1.5} />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row flex-1 overflow-hidden px-2 md:px-4 pb-4 md:pb-6 gap-6">
                            {/* Sidebar (No divider) */}
                            <div className="w-full md:w-64 px-4 md:px-0 shrink-0 flex flex-row md:flex-col overflow-x-auto gap-2 no-scrollbar">
                                <button
                                    onClick={() => setActiveTab("info")}
                                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-semibold text-xs uppercase tracking-wider whitespace-nowrap ${activeTab === "info"
                                        ? "bg-slate-900 dark:bg-white/[0.06] text-white dark:text-white"
                                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.02] hover:text-slate-800 dark:hover:text-slate-300"
                                        }`}
                                >
                                    <User className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                                    <span className="flex-1 text-left">Personal Info</span>
                                    {activeTab === "info" && (
                                        <ChevronRight className="w-4 h-4 hidden md:block opacity-50" strokeWidth={2} />
                                    )}
                                </button>

                                {user?.role === 'student' && (
                                    <button
                                        onClick={() => setActiveTab("security")}
                                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-semibold text-xs uppercase tracking-wider whitespace-nowrap ${activeTab === "security"
                                            ? "bg-slate-900 dark:bg-white/[0.06] text-white dark:text-white"
                                            : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.02] hover:text-slate-800 dark:hover:text-slate-300"
                                            }`}
                                    >
                                        <Lock className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                                        <span className="flex-1 text-left">Security</span>
                                        {activeTab === "security" && (
                                            <ChevronRight className="w-4 h-4 hidden md:block opacity-50" strokeWidth={2} />
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 overflow-y-auto px-4 md:px-8">
                                {activeTab === "info" && (
                                    <div className="max-w-xl mx-auto py-8">
                                        <div className="flex flex-col items-center text-center">
                                            {/* Avatar */}
                                            <div className="relative mb-8">
                                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.08] flex items-center justify-center">
                                                    {profileImageUrl ? (
                                                        <img
                                                            src={profileImageUrl}
                                                            alt={user?.name}
                                                            className="w-full h-full object-cover rounded-full"
                                                        />
                                                    ) : (
                                                        <User className="w-12 h-12 text-slate-300 dark:text-slate-600" strokeWidth={1} />
                                                    )}
                                                </div>

                                                {isEditing && (
                                                    <button
                                                        onClick={() => fileInputRef.current.click()}
                                                        className="absolute bottom-0 right-0 p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full hover:scale-105 active:scale-95 transition-all z-10 border border-slate-800 dark:border-white/20"
                                                    >
                                                        <Camera className="w-5 h-5" strokeWidth={1.5} />
                                                    </button>
                                                )}

                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    hidden
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                />
                                            </div>

                                            {!isEditing ? (
                                                <>
                                                    <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                                                        {user?.name}
                                                    </h3>
                                                    <div className="flex flex-col items-center gap-1.5 mb-8">
                                                        <p className="text-[10px] md:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                            {user?.role === 'owner' ? 'Institution Admin' : user?.role === 'instructor' ? 'Instructor' : user?.role === 'student' ? 'Student' : user?.role === 'super_admin' ? 'Platform Admin' : 'User'}
                                                        </p>
                                                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                            {user?.institutionName || "TESTFLOW"}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] text-slate-600 dark:text-slate-300 text-sm font-medium">
                                                        <Mail className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                                                        {user?.email}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full space-y-6 bg-slate-50/50 dark:bg-white/[0.02] p-6 md:p-8 rounded-[24px] border border-slate-200/60 dark:border-white/[0.06]">
                                                    <div className="space-y-2 text-left">
                                                        <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                                        <input
                                                            value={editName}
                                                            onChange={(e) => setEditName(e.target.value)}
                                                            className="w-full px-5 py-3.5 rounded-xl border border-slate-200 dark:border-white/[0.06] focus:border-slate-400 dark:focus:border-white/20 outline-none bg-white dark:bg-white/[0.02] text-slate-900 dark:text-white text-sm transition-all"
                                                            placeholder="Enter your name"
                                                        />
                                                    </div>

                                                    <div className="flex gap-3 pt-2">
                                                        <button
                                                            onClick={() => {
                                                                setIsEditing(false);
                                                                setEditName(user?.name);
                                                                setSelectedFile(null);
                                                                setPreviewUrl(null);
                                                            }}
                                                            className="flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all"
                                                        >
                                                            Cancel
                                                        </button>

                                                        <button
                                                            onClick={handleSaveProfile}
                                                            disabled={isSaving}
                                                            className="flex-1 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold text-xs uppercase tracking-wider hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center justify-center gap-2 disabled:opacity-70 transition-all active:scale-[0.98]"
                                                        >
                                                            {isSaving ? (
                                                                <Loader className="animate-spin w-4 h-4" />
                                                            ) : (
                                                                <Save className="w-4 h-4" strokeWidth={1.8} />
                                                            )}
                                                            Save Changes
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "security" && (
                                    <div className="max-w-md mx-auto py-8">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-center shrink-0">
                                                <Lock className="w-5 h-5 text-slate-600 dark:text-slate-400" strokeWidth={1.5} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Security</h3>
                                                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Update credentials</p>
                                            </div>
                                        </div>

                                        <form onSubmit={handlePasswordUpdate} className="space-y-5">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                                                    Current Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showCurrentPassword ? "text" : "password"}
                                                        required
                                                        value={passwordData.current}
                                                        onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                                                        className="w-full px-5 py-3.5 rounded-xl border border-slate-200 dark:border-white/[0.06] focus:border-slate-400 dark:focus:border-white/20 outline-none bg-slate-50/50 dark:bg-white/[0.02] text-slate-900 dark:text-white text-sm transition-all pr-12"
                                                        placeholder="••••••••"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                                    >
                                                        {showCurrentPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                                                    New Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showNewPassword ? "text" : "password"}
                                                        required
                                                        value={passwordData.new}
                                                        onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                                        className="w-full px-5 py-3.5 rounded-xl border border-slate-200 dark:border-white/[0.06] focus:border-slate-400 dark:focus:border-white/20 outline-none bg-slate-50/50 dark:bg-white/[0.02] text-slate-900 dark:text-white text-sm transition-all pr-12"
                                                        placeholder="••••••••"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                                    >
                                                        {showNewPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-widest mt-2 ml-1">
                                                    Min. 6 characters
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                                                    Confirm New Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        required
                                                        value={passwordData.confirm}
                                                        onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                                        className="w-full px-5 py-3.5 rounded-xl border border-slate-200 dark:border-white/[0.06] focus:border-slate-400 dark:focus:border-white/20 outline-none bg-slate-50/50 dark:bg-white/[0.02] text-slate-900 dark:text-white text-sm transition-all pr-12"
                                                        placeholder="••••••••"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                                    >
                                                        {showConfirmPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="pt-4">
                                                <button
                                                    type="submit"
                                                    disabled={isUpdatingPassword}
                                                    className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold text-xs uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center justify-center gap-2 disabled:opacity-70 transition-all active:scale-[0.98]"
                                                >
                                                    {isUpdatingPassword ? (
                                                        <>
                                                            <Loader className="animate-spin w-4 h-4" />
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="w-4 h-4" strokeWidth={1.8} />
                                                            Update Password
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ProfileModal;
