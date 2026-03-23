import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black">
      <Header />
      <main className="pb-20 pt-16">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default Layout;
