import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAdminStore from './store/adminStore';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Transactions from './pages/Transactions';
import Deposits from './pages/Deposits';
import Withdrawals from './pages/Withdrawals';
import Games from './pages/Games';
import Support from './pages/Support';
import Settings from './pages/Settings';
import Policies from './pages/Policies';
import Reports from './pages/Reports';
import SubAdmins from './pages/SubAdmins';

// Layout & Components
import Layout from './components/Layout';
import PermissionGuard from './components/PermissionGuard';

function App() {
  const { isAuthenticated } = useAdminStore();

  return (
    <Router>
      <Toaster position="top-right" />
      
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        
        <Route element={<Layout />}>
          <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          
          <Route path="/users" element={
            isAuthenticated ? (
              <PermissionGuard permission="manage_users">
                <Users />
              </PermissionGuard>
            ) : <Navigate to="/login" />
          } />
          
          <Route path="/deposits" element={
            isAuthenticated ? (
              <PermissionGuard permission="manage_deposits">
                <Deposits />
              </PermissionGuard>
            ) : <Navigate to="/login" />
          } />
          
          <Route path="/withdrawals" element={
            isAuthenticated ? (
              <PermissionGuard permission="manage_withdrawals">
                <Withdrawals />
              </PermissionGuard>
            ) : <Navigate to="/login" />
          } />
          
          <Route path="/games" element={
            isAuthenticated ? (
              <PermissionGuard permission="manage_games">
                <Games />
              </PermissionGuard>
            ) : <Navigate to="/login" />
          } />
          
          <Route path="/support" element={
            isAuthenticated ? (
              <PermissionGuard permission="manage_support">
                <Support />
              </PermissionGuard>
            ) : <Navigate to="/login" />
          } />
          
          <Route path="/reports" element={
            isAuthenticated ? (
              <PermissionGuard permission="view_analytics">
                <Reports />
              </PermissionGuard>
            ) : <Navigate to="/login" />
          } />
          
          <Route path="/settings" element={
            isAuthenticated ? (
              <PermissionGuard permission="manage_settings">
                <Settings />
              </PermissionGuard>
            ) : <Navigate to="/login" />
          } />
          
          <Route path="/settings/policies" element={
            isAuthenticated ? (
              <PermissionGuard permission="manage_settings">
                <Policies />
              </PermissionGuard>
            ) : <Navigate to="/login" />
          } />
          
          <Route path="/sub-admins" element={
            isAuthenticated ? (
              <PermissionGuard permission="manage_admins">
                <SubAdmins />
              </PermissionGuard>
            ) : <Navigate to="/login" />
          } />
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
