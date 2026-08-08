import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatWidget from "./components/ChatWidget";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Explore from "./pages/Explore";
import MapPage from "./pages/MapPage";
import TripPlanner from "./pages/TripPlanner";
import Hotels from "./pages/Hotels";
import Restaurants from "./pages/Restaurants";
import Attractions from "./pages/Attractions";
import Emergency from "./pages/Emergency";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/planner" element={<TripPlanner />} />
                <Route path="/hotels" element={<Hotels />} />
                <Route path="/restaurants" element={<Restaurants />} />
                <Route path="/attractions" element={<Attractions />} />
                <Route path="/emergency" element={<Emergency />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            <ChatWidget />
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-24 text-center">
      <h1 className="text-3xl font-display font-bold text-ink mb-2">Page not found</h1>
      <p className="text-ink/60">The page you're looking for doesn't exist.</p>
    </div>
  );
}
