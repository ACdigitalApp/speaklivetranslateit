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
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <VisitTracker />
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/photo" element={<AuthGuard><PhotoTranslator /></AuthGuard>} />
      <Route path="/pdf" element={<AuthGuard><PdfTranslator /></AuthGuard>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/upgrade" element={<Upgrade />} />
      <Route path="/checkout" element={<AuthGuard><Checkout /></AuthGuard>} />
      <Route path="/settings" element={<AuthGuard><SettingsPage /></AuthGuard>} />
      <Route path="/admin" element={<AuthGuard requiredRole="admin"><Admin /></AuthGuard>} />
      <Route path="/admin/users" element={<AuthGuard requiredRole="admin"><AdminUsers /></AuthGuard>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);
