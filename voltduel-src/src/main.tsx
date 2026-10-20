import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { armProof } from "./proof";
import { VoltDuel } from "./VoltDuel";
import "./styles.css";

armProof();

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <VoltDuel />
    </StrictMode>,
  );
}
