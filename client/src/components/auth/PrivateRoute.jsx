import { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import Sidebar from "../layout/Sidebar";
import useSidebarStore from "../../store/useSidebarStore";

const PrivateRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    const { isOpen } = useSidebarStore();

    if (loading) return null;

    if (!user) {
        return <Navigate to="/login" />;
    }

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-black overflow-x-hidden">
            <Sidebar />
            <main className={`flex-1 transition-all duration-300 w-full ${isOpen ? 'lg:ml-64' : 'lg:ml-20'} pt-16 lg:pt-0`}>
                {children}
            </main>
        </div>
    );
};

export default PrivateRoute;
