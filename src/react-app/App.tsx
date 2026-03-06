import { BrowserRouter as Router, Routes, Route } from "react-router";
import LandingPage from "@/react-app/pages/Landing";
import HomePage from "@/react-app/pages/Home";
import MoneyPage from "@/react-app/pages/Money";
import DashboardPage from "@/react-app/pages/Dashboard";
import UserPanel from "@/react-app/pages/UserPanel";
import AdminPanel from "@/react-app/pages/AdminPanel";
import LoginPage from "@/react-app/pages/Login";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/parking" element={<HomePage />} />
        <Route path="/money" element={<MoneyPage />} />
        <Route path="/user" element={<UserPanel />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}
