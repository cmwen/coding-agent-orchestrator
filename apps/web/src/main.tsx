import "katex/dist/katex.min.css";
import { registerSW } from "virtual:pwa-register";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | undefined;
updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.info(
      "A new version of coding-agent-orchestrator is available. Reload to update."
    );
    void updateServiceWorker?.(true);
  },
  onOfflineReady() {
    console.info("coding-agent-orchestrator is ready to work offline.");
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
