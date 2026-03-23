import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHome, FaWallet, FaUserFriends, FaHeadset, FaUser } from 'react-icons/fa';

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: FaHome, label: 'Home' },
    { path: '/wallet', icon: FaWallet, label: 'Wallet' },
    { path: '/refer', icon: FaUserFriends, label: 'Refer' },
    { path: '/support', icon: FaHeadset, label: 'Support' },
    { path: '/profile', icon: FaUser, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-gray-900 to-gray-900/95 backdrop-blur-xl border-t border-gray-700 z-50 w-full max-w-[480px] mx-auto shadow-2xl">
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center px-2 py-2 rounded-2xl transition-all relative min-w-[60px] ${
                isActive 
                  ? 'scale-105' 
                  : 'text-gray-400 hover:text-white scale-100'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl shadow-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center">
                <Icon className={`text-2xl ${isActive ? 'text-white mb-1' : 'text-gray-400'}`} />
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-white text-xs font-bold"
                  >
                    {item.label}
                  </motion.span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
