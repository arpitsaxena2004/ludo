import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import FloatingWhatsAppButton from './FloatingWhatsAppButton';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex justify-center">
      <div className="w-full max-w-md relative bg-gradient-to-b from-gray-900 via-gray-800 to-black">
        <Header />
        <main className="pb-24 pt-20 sm:pt-24 relative min-h-screen">
          <Outlet />
          <FloatingWhatsAppButton />
        </main>
        <BottomNav />
      </div>
    </div>
  );
};

export default Layout;
