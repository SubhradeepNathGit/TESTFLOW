import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ThemeProvider } from "./context/ThemeContext";
import Routing from "./routes/Routing";
import ErrorBoundary from "./components/common/ErrorBoundary";
import ThemeToggle from "./components/common/ThemeToggle";

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
        <AuthProvider>
          <SocketProvider>
            <ErrorBoundary>
              <Routing />
              <ThemeToggle />
            </ErrorBoundary>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              theme="colored"
            />
          </SocketProvider>
        </AuthProvider>
      </div>
    </ThemeProvider>
  );
}

export default App;
