import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import Login from './pages/Login';
import Home from './pages/Home';
import Header from './components/Header';
import './styles/index.css';
import ComplexDetail from './pages/ComplexDetail';
import Profile from './pages/Profile';
import Booking from './pages/Booking';

// Route bảo vệ
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import OwnerRoute from './routes/OwnerRoute';
import ComplexList from './pages/owner/complex/ComplexList';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import PitchList from './pages/owner/pitch/PitchList';
import PitchGroupList from './pages/owner/pitchgroup/PitchGroupList';
import TimeSlotList from './pages/owner/timeslot/TimeSlotList';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/user/UserManagement';
import RoleManagement from './pages/admin/role/RoleManagement';
import BookingManagement from './pages/owner/booking/BookingManagement';
// Thêm imports
import PayPalCheckout from './pages/PayPalCheckout';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import PaymentResult from './pages/PaymentResult';

const { Content } = Layout;

function App() {
  return (
    <Router>
      <Layout>
        <Header />
        <Content style={{ padding: '20px' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/complexes/:id" element={<ComplexDetail />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/booking/pitch/:pitchId" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
            <Route path="/booking/pitch-group/:groupId" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
            // Thêm routes trong Routes component
            <Route path="/paypal-checkout/:paymentId" element={<ProtectedRoute><PayPalCheckout /></ProtectedRoute>} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
            <Route path="/payment/error" element={<PaymentResult />} />
            {/* Role-based */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            >
              <Route index element={<div>Chào mừng đến với Admin Dashboard</div>} />
              <Route path="users" element={<UserManagement />} />
              <Route path="roles" element={<RoleManagement />} />
            </Route>
            <Route
              path="/owner/dashboard"
              element={
                <OwnerRoute>
                  <OwnerDashboard />
                </OwnerRoute>
              }
            >
              <Route path="complexes" element={<ComplexList />} />
              <Route index element={<div>Chào mừng đến với Owner Dashboard</div>} />
              <Route path="pitches" element={<PitchList />} />
              <Route path="pitch-groups" element={<PitchGroupList />} />
              <Route path="timeslots" element={<TimeSlotList />} />
              <Route path="bookings" element={<BookingManagement />} />
            </Route>
          </Routes>
        </Content>
      </Layout>
    </Router>
  );
}

export default App;
