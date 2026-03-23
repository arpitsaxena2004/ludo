import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import Wallet from './pages/Wallet';
import Deposit from './pages/Deposit';
import Withdrawal from './pages/Withdrawal';
import PaymentHistory from './pages/PaymentHistory';
import Refer from './pages/Refer';
import Support from './pages/Support';
import Profile from './pages/Profile';
import GameLobby from './pages/GameLobby';
import BattleRoom from './pages/BattleRoom';
import Transactions from './pages/Transactions';
import KYC from './pages/KYC';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import TDSPolicy from './pages/TDSPolicy';
import ResponsibleGaming from './pages/ResponsibleGaming';
import About from './pages/About';
import Contact from './pages/Contact';

// Layout
import Layout from './components/Layout';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        
        <Route element={<Layout />}>
          <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
          <Route path="/wallet" element={isAuthenticated ? <Wallet /> : <Navigate to="/login" />} />
          <Route path="/deposit" element={isAuthenticated ? <Deposit /> : <Navigate to="/login" />} />
          <Route path="/withdrawal" element={isAuthenticated ? <Withdrawal /> : <Navigate to="/login" />} />
          <Route path="/payment-history" element={isAuthenticated ? <PaymentHistory /> : <Navigate to="/login" />} />
          <Route path="/refer" element={isAuthenticated ? <Refer /> : <Navigate to="/login" />} />
          <Route path="/support" element={isAuthenticated ? <Support /> : <Navigate to="/login" />} />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/game-lobby" element={isAuthenticated ? <GameLobby /> : <Navigate to="/login" />} />
          <Route path="/battle/:roomCode" element={isAuthenticated ? <BattleRoom /> : <Navigate to="/login" />} />
          <Route path="/transactions" element={isAuthenticated ? <Transactions /> : <Navigate to="/login" />} />
          <Route path="/kyc" element={isAuthenticated ? <KYC /> : <Navigate to="/login" />} />
          <Route path="/privacy-policy" element={isAuthenticated ? <PrivacyPolicy /> : <Navigate to="/login" />} />
          <Route path="/terms-conditions" element={isAuthenticated ? <TermsConditions /> : <Navigate to="/login" />} />
          <Route path="/tds-policy" element={isAuthenticated ? <TDSPolicy /> : <Navigate to="/login" />} />
          <Route path="/responsible-gaming" element={isAuthenticated ? <ResponsibleGaming /> : <Navigate to="/login" />} />
          <Route path="/about" element={isAuthenticated ? <About /> : <Navigate to="/login" />} />
          <Route path="/contact" element={isAuthenticated ? <Contact /> : <Navigate to="/login" />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
