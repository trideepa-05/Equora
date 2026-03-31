import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Safety fallback for external libraries that may call mgt.clearMarks
declare global {
  interface Window {
    mgt?: { clearMarks?: () => void };
  }
}

window.mgt = window.mgt || {};
if (typeof window.mgt.clearMarks !== "function") {
  window.mgt.clearMarks = () => {
    // no-op fallback for compatibility
  };
}

createRoot(document.getElementById("root")!).render(<App />);
