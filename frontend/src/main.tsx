import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Connect } from "@stacks/connect-react";
import App from "./app/app";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <Connect
      authOptions={{
        appDetails: {
          name: "Chessxu",
          icon: window.location.origin + "/logo.png",
        },
        redirectTo: "/",
        onFinish: () => {
          window.location.reload();
        },
        userSession: undefined, // Will use default
      }}
    >
      <App />
    </Connect>
  </StrictMode>
);
