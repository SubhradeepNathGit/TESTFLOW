import React, { useState, useRef, useEffect, useContext, useCallback } from "react";
import {
    X,
    Camera,
    Package,
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
import AuthContext from "../../context/AuthContext";
import api from "../../api/axiosInstance";
import { toast } from "react-toastify";

const ProfileModal = ({ isOpen, onClose }) => {
    const { user, updatePassword, setUser } = useContext(AuthContext);

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

    // Handle profile updates instead

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
                onClose();
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
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=0f172a&color=fff&size=200`);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            { }
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            { }
            <div className="relative w-full max-w-5xl bg-white dark:bg-black rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-full max-h-[100dvh] md:h-[85vh] md:min-h-[500px]">
                { }
                <div className="flex items-center justify-between px-5 py-4 md:px-8 md:py-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.03] dark:backdrop-blur-xl border-white/5 shadow-none/50">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-slate-900 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">My Profile</h2>
                            <p className="text-[9px] md:text-xs font-semibold text-slate-400 uppercase tracking-widest line-clamp-1">
                                Manage account configuration
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {activeTab === "info" && !isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-3 bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl border-white/5 shadow-none border border-slate-100 dark:border-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group"
                                title="Edit Profile"
                            >
                                <Pencil className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all group shadow-sm hover:shadow-md border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                        >
                            <X className="w-5 h-5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 group-hover:rotate-90 transition-all" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    { }
                    <div className="w-full md:w-72 bg-slate-50/30 dark:bg-white/[0.03] dark:backdrop-blur-xl border-white/5 shadow-none/30 border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/5 p-4 md:p-6 shrink-0 flex flex-row md:flex-col overflow-x-auto gap-2 md:gap-2 no-scrollbar">
                        <button
                            onClick={() => setActiveTab("info")}
                            className={`flex items-center gap-2 md:gap-3 px-4 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all font-bold text-[10px] md:text-xs uppercase tracking-wider whitespace-nowrap ${activeTab === "info"
                                ? "bg-slate-900 text-white shadow-xl shadow-slate-200 dark:shadow-none"
                                : "text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 hover:shadow-sm"
                                }`}
                        >
                            <User className="w-4 h-4 shrink-0" />
                            <span className="flex-1 text-left">Personal Info</span>
                            {activeTab === "info" && (
                                <ChevronRight className="w-4 h-4 hidden md:block" />
                            )}
                        </button>


                        {user?.role === 'student' && (
                            <button
                                onClick={() => setActiveTab("security")}
                                className={`flex items-center gap-2 md:gap-3 px-4 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all font-bold text-[10px] md:text-xs uppercase tracking-wider whitespace-nowrap ${activeTab === "security"
                                    ? "bg-slate-900 text-white shadow-xl shadow-slate-200 dark:shadow-none"
                                    : "text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 hover:shadow-sm"
                                    }`}
                            >
                                <Lock className="w-4 h-4 shrink-0" />
                                <span className="flex-1 text-left">Security</span>
                                {activeTab === "security" && (
                                    <ChevronRight className="w-4 h-4 hidden md:block" />
                                )}
                            </button>
                        )}
                    </div>


                    { }
                    <div className="flex-1 overflow-y-auto bg-white/50 dark:bg-black/50">
                        { }
                        {activeTab === "info" && (
                            <div className="p-5 md:p-12">
                                <div className="max-w-2xl mx-auto space-y-6 md:space-y-10">
                                    <div className="flex flex-col items-center text-center pb-6 md:pb-10">
                                        <div className="relative group mb-6 md:mb-8">
                                            <div className="w-28 h-28 md:w-40 md:h-40 rounded-full overflow-hidden border-4 md:border-8 border-white dark:border-white/5 ring-1 ring-slate-100 dark:ring-white/10 shadow-none dark:shadow-none">
                                                <img
                                                    src={profileImageUrl}
                                                    alt={user?.name}
                                                    className="w-full h-full object-cover rounded-full"
                                                />
                                            </div>

                                            {isEditing && (
                                                <button
                                                    onClick={() => fileInputRef.current.click()}
                                                    className="absolute bottom-1 right-1 p-2.5 bg-slate-800 text-white rounded-full border-2 border-white shadow-2xl hover:scale-110 hover:bg-slate-900 transition-all z-10"
                                                >
                                                    <Camera className="w-5 h-5" />
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
                                                <h3 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-1 tracking-tight">
                                                    {user?.name}
                                                </h3>
                                                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                    {user?.role === 'owner' ? 'Institution Admin' : user?.role === 'instructor' ? 'Instructor' : user?.role === 'student' ? 'Student' : user?.role === 'super_admin' ? 'Platform Admin' : 'User'}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                                                    {user?.institutionName || "TESTFLOW"}
                                                </p>
                                                <p className="text-slate-400 font-medium flex items-center justify-center gap-2 mb-10">
                                                    <Mail className="w-4 h-4 text-slate-300" />
                                                    {user?.email}
                                                </p>
                                            </>
                                        ) : (
                                            <div className="w-full space-y-4 md:space-y-6 bg-slate-50/50 dark:bg-white/[0.03] dark:backdrop-blur-xl border-white/5 shadow-none/50 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 dark:border-white/5">
                                                <div className="space-y-2 text-left">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                                    <input
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 focus:border-slate-900 dark:focus:border-slate-100 outline-none bg-white dark:bg-white/10 text-slate-900 dark:text-slate-100 font-medium transition-all"
                                                        placeholder="Enter your name"
                                                    />
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-4">
                                                    <button
                                                        onClick={() => {
                                                            setIsEditing(false);
                                                            setEditName(user?.name);
                                                            setSelectedFile(null);
                                                            setPreviewUrl(null);
                                                        }}
                                                        className="w-full sm:flex-1 py-3 md:py-4 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl md:rounded-2xl hover:bg-white dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 font-bold text-xs uppercase tracking-wider transition-all"
                                                    >
                                                        Cancel
                                                    </button>

                                                    <button
                                                        onClick={handleSaveProfile}
                                                        disabled={isSaving}
                                                        className="flex-1 py-4 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-wider hover:bg-slate-900 dark:hover:bg-white disabled:opacity-70 shadow-lg shadow-slate-200 dark:shadow-none transition-all"
                                                    >
                                                        {isSaving ? (
                                                            <Loader className="animate-spin w-5 h-5" />
                                                        ) : (
                                                            <Save className="w-5 h-5" />
                                                        )}
                                                        Save Changes
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        { }
                        {activeTab === "security" && (
                            <div className="p-5 md:p-12">
                                <div className="max-w-md mx-auto">
                                    <div className="bg-white dark:bg-white/5 dark:backdrop-blur-xl border-white/10 shadow-none">
                                        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-10">
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                                                <Lock className="w-5 h-5 md:w-6 md:h-6 text-slate-900" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100">Security</h3>
                                                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update credentials</p>
                                            </div>
                                        </div>

                                        <form onSubmit={handlePasswordUpdate} className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                                    Current Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showCurrentPassword ? "text" : "password"}
                                                        required
                                                        value={passwordData.current}
                                                        onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                                                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 focus:border-slate-900 dark:focus:border-slate-100 outline-none bg-slate-50/30 dark:bg-white/10/50 text-slate-900 dark:text-slate-100 font-medium transition-all pr-12"
                                                        placeholder="••••••••"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-900 transition-colors"
                                                    >
                                                        {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                                    New Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showNewPassword ? "text" : "password"}
                                                        required
                                                        value={passwordData.new}
                                                        onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 focus:border-slate-900 dark:focus:border-slate-100 outline-none bg-slate-50/30 dark:bg-white/10/50 text-slate-900 dark:text-slate-100 font-medium transition-all pr-12"
                                                        placeholder="••••••••"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-900 transition-colors"
                                                    >
                                                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2 ml-1">
                                                    Min. 6 alphanumeric characters
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                                    Confirm New Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        required
                                                        value={passwordData.confirm}
                                                        onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 focus:border-slate-900 dark:focus:border-slate-100 outline-none bg-slate-50/30 dark:bg-white/10/50 text-slate-900 dark:text-slate-100 font-medium transition-all pr-12"
                                                        placeholder="••••••••"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-900 transition-colors"
                                                    >
                                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="pt-6">
                                                <button
                                                    type="submit"
                                                    disabled={isUpdatingPassword}
                                                    className="w-full py-5 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-900 dark:hover:bg-white flex items-center justify-center gap-3 disabled:opacity-70 shadow-xl shadow-slate-200 dark:shadow-none transition-all"
                                                >
                                                    {isUpdatingPassword ? (
                                                        <>
                                                            <Loader className="animate-spin w-5 h-5" />
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="w-4 h-4" />
                                                            Update Password
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
