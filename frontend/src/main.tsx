import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { seedAllDemoData } from "./api/smb";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

try {
  seedAllDemoData();
} catch (err) {
  console.warn("Demo data seed skipped:", err);
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing #root element");
}

ReactDOM.createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
