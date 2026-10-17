import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/public/Home';
import Track from './pages/public/Track';
import Services from './pages/public/Services';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Faq from './pages/public/Faq';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PortalLayout from './pages/portal/PortalLayout';
import PortalHome from './pages/portal/PortalHome';
import MyShipments from './pages/portal/MyShipments';
import ShipmentDetail from './pages/portal/ShipmentDetail';
import Charges from './pages/portal/Charges';
import Activity from './pages/portal/Activity';
import Profile from './pages/portal/Profile';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Shipments from './pages/admin/Shipments';
import ShipmentEditor from './pages/admin/ShipmentEditor';
import Customers from './pages/admin/Customers';
import ChatInbox from './pages/admin/ChatInbox';
import Analytics from './pages/admin/Analytics';
import AuditLog from './pages/admin/AuditLog';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/track" element={<Track />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/portal" element={<PortalLayout />}>
            <Route index element={<PortalHome />} />
            <Route path="shipments" element={<MyShipments />} />
            <Route path="shipments/:id" element={<ShipmentDetail />} />
            <Route path="charges" element={<Charges />} />
            <Route path="activity" element={<Activity />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Home />} />
        </Route>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="shipments" element={<Shipments />} />
          <Route path="shipments/new" element={<ShipmentEditor />} />
          <Route path="shipments/:id" element={<ShipmentEditor />} />
          <Route path="customers" element={<Customers />} />
          <Route path="chat" element={<ChatInbox />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="audit" element={<AuditLog />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
