import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.tsx";
import PhotoTranslator from "./pages/PhotoTranslator.tsx";
import PdfTranslator from "./pages/PdfTranslator.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Admin from "./pages/Admin.tsx";
import AdminUsers from "./pages/AdminUsers.tsx";
import SettingsPage from "./pages/Settings.tsx";
import Pricing from "./pages/Pricing.tsx";
import Upgrade from "./pages/Upgrade.tsx";
import Checkout from "./pages/Checkout.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AuthGuard } from "./components/auth/AuthGuard.tsx";
import { VisitTracker } from "./components/VisitTracker.tsx";
import PrivateRoute from "./components/PrivateRoute.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <VisitTracker />
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/photo" element={<AuthGuard><PrivateRoute title="Foto — Speak & Translate Live"><PhotoTranslator /></PrivateRoute></AuthGuard>} />
      <Route path="/pdf" element={<AuthGuard><PrivateRoute title="PDF — Speak & Translate Live"><PdfTranslator /></PrivateRoute></AuthGuard>} />
      <Route path="/login" element={<PrivateRoute title="Login — Speak & Translate Live"><Login /></PrivateRoute>} />
      <Route path="/register" element={<PrivateRoute title="Registrazione — Speak & Translate Live"><Register /></PrivateRoute>} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/upgrade" element={<Upgrade />} />
      <Route path="/checkout" element={<AuthGuard><PrivateRoute title="Checkout — Speak & Translate Live"><Checkout /></PrivateRoute></AuthGuard>} />
      <Route path="/settings" element={<AuthGuard><PrivateRoute title="Impostazioni — Speak & Translate Live"><SettingsPage /></PrivateRoute></AuthGuard>} />
      <Route path="/admin" element={<AuthGuard requiredRole="admin"><PrivateRoute title="Admin — Speak & Translate Live"><Admin /></PrivateRoute></AuthGuard>} />
      <Route path="/admin/users" element={<AuthGuard requiredRole="admin"><PrivateRoute title="Admin Utenti — Speak & Translate Live"><AdminUsers /></PrivateRoute></AuthGuard>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);
