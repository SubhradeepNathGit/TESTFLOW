import { BookOpen } from "lucide-react";

const Logo = ({
    className = "",
    size = 28,
    iconClassName = "text-white/70",
    textClassName = "text-white/70",
    hideText = false
}) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>

            <BookOpen size={size} className={iconClassName} />
            {!hideText && (
                <span className={`text-2xl font-bold tracking-tight ${textClassName || "text-slate-900"} drop-shadow-sm`}>
                    TESTFLOW
                </span>
            )}
        </div>
    );
};

export default Logo;
