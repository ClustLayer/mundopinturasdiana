import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { App } from "./app/App"
import { Providers } from "./app/providers"
import { initInteractionTracker } from "./features/analytics/interaction-tracker"
import "./styles.css"

initInteractionTracker()

const root = document.getElementById("root")
if (!root) throw new Error("No se encontro el nodo raiz")

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <Providers>
        <App />
      </Providers>
    </BrowserRouter>
  </StrictMode>,
)
