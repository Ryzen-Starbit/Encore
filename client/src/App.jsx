import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Profile from './pages/Profile.jsx';
import EventDetails from './pages/EventDetails.jsx';
import AdminHome from './pages/admin/AdminHome.jsx';
import ManageEvents from './pages/admin/ManageEvents.jsx';
import ScannerPage from './pages/admin/ScannerPage.jsx';
import AdminAnalytics from './pages/admin/AdminAnalytics.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import FloatingDecor from './components/FloatingDecor.jsx';
import CurtainTransition from './components/CurtainTransition.jsx';

export default function App() {
  return (
    <div className="min-h-screen">
      <CurtainTransition />
      <FloatingDecor />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminHome /></AdminRoute>} />
        <Route path="/admin/events" element={<AdminRoute><ManageEvents /></AdminRoute>} />
        <Route path="/admin/scanner" element={<AdminRoute><ScannerPage /></AdminRoute>} />
        <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
      </Routes>
    </div>
  );
}