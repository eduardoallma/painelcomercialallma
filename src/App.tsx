import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Calculator from "@/pages/Calculator";
import Playbooks from "@/pages/Playbooks";
import Roleplay from "@/pages/Roleplay";
import RoleplayHistory from "@/pages/RoleplayHistory";
import NotFound from "@/pages/NotFound";

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/roleplay" element={<Roleplay />} />
          <Route path="/playbooks" element={<Playbooks />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
