import { useEffect } from "react";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { selectTheme } from "./store/themeSlice";
import Routing from "./routes/Routing";
import ErrorBoundary from "./components/common/ErrorBoundary";
import ThemeToggle from "./components/common/ThemeToggle";
import AppInit from "./components/common/AppInit";

function App() {
  const theme = useSelector(selectTheme);

  // Apply the persisted theme class to <html> on every render/change
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    root.style.colorScheme = theme;
  }, [theme]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* AppInit handles auth bootstrap + global auth-error listener */}
      <AppInit />
      <ErrorBoundary>
        <Routing />
        <ThemeToggle />
      </ErrorBoundary>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="colored"
      />
    </div>
  );
}

export default App;
