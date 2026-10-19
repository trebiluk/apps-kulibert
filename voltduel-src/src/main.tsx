import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { VoltDuel } from "./VoltDuel";
import "./styles.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <VoltDuel />
    </StrictMode>,
  );
}
