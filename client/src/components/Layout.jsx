import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import FloatingWhatsAppButton from './FloatingWhatsAppButton';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex justify-center">
      <div className="w-full max-w-md relative bg-gradient-to-b from-gray-900 via-gray-800 to-black">
        <Header />
        <main className="pb-20 pt-16 relative">
          <Outlet />
          <FloatingWhatsAppButton />
        </main>
        <BottomNav />
      </div>
    </div>
  );
};

export default Layout;
