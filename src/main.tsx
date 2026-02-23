import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ApiSmokeTest from "./ApiSmokeTest";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ApiSmokeTest />
  </StrictMode>
);