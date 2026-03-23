import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  FaHome, FaUsers, FaMoneyBill, FaGamepad, FaIdCard, FaHeadset, 
  FaCog, FaSignOutAlt, FaBars, FaTimes, FaChevronDown, FaFileAlt, FaSlidersH,
  FaDownload, FaUpload, FaChartLine, FaUserShield
} from 'react-icons/fa';
import useAdminStore from '../store/adminStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Layout = () => {
  const location = useLocation();
  const { admin, logout } = useAdminStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // Helper function to check if user has permission
  const hasPermission = (permission) => {
    if (admin?.role === 'super_admin') return true;
    return admin?.permissions?.includes(permission);
  };

  const navItems = [
    { path: '/', icon: FaHome, label: 'Dashboard', permission: null },
    { path: '/users', icon: FaUsers, label: 'Users', permission: 'manage_users' },
    { path: '/deposits', icon: FaDownload, label: 'Deposits', permission: 'manage_deposits' },
    { path: '/withdrawals', icon: FaUpload, label: 'Withdrawals', permission: 'manage_withdrawals' },
    { path: '/games', icon: FaGamepad, label: 'Games', permission: 'manage_games' },
    { path: '/support', icon: FaHeadset, label: 'Support', permission: 'manage_support' },
    { path: '/reports', icon: FaChartLine, label: 'Reports', permission: 'view_analytics' },
    { path: '/sub-admins', icon: FaUserShield, label: 'Sub-Admins', permission: 'manage_admins' },
  ].filter(item => !item.permission || hasPermission(item.permission));

  const settingsSubItems = [
    { path: '/settings', icon: FaSlidersH, label: 'App Config', permission: 'manage_settings' },
    { path: '/settings/policies', icon: FaFileAlt, label: 'Policies', permission: 'manage_settings' },
  ].filter(item => !item.permission || hasPermission(item.permission));

  const bottomNavItems = navItems.filter(item => 
    ['/','/ users', '/deposits', '/withdrawals', '/support'].includes(item.path)
  ).slice(0, 5);
  
  const closeSidebar = () => setSidebarOpen(false);

  const isSettingsActive = location.pathname.startsWith('/settings');

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-white p-2 hover:bg-gray-700 rounded-lg">
            <FaBars size={20} />
          </button>
          <h1 className="text-lg font-bold text-white">A2Z Ludo</h1>
        </div>
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">{admin?.name?.charAt(0)}</span>
        </div>
      </header>

      {/* Overlay */}
      {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={closeSidebar} />}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-800 border-r border-gray-700
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 lg:p-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white mb-1">A2Z Ludo</h1>
            <p className="text-gray-400 text-xs lg:text-sm">Admin Panel</p>
          </div>
          <button onClick={closeSidebar} className="lg:hidden text-gray-400 hover:text-white p-2">
            <FaTimes size={20} />
          </button>
        </div>

        <nav className="px-3 lg:px-4 pb-24 overflow-y-auto max-h-[calc(100vh-200px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-3 lg:px-4 py-3 rounded-lg mb-1 lg:mb-2 transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon className="text-lg" />
                <span className="text-sm lg:text-base">{item.label}</span>
              </Link>
            );
          })}

          {/* Settings Dropdown */}
          <div className="mb-1 lg:mb-2">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`w-full flex items-center justify-between px-3 lg:px-4 py-3 rounded-lg transition-colors ${
                isSettingsActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <FaCog className="text-lg" />
                <span className="text-sm lg:text-base">Settings</span>
              </div>
              <FaChevronDown className={`text-sm transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
            </button>

            {settingsOpen && (
              <div className="mt-1 ml-4 pl-4 border-l border-gray-700 space-y-1">
                {settingsSubItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeSidebar}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive ? 'bg-blue-500/30 text-blue-400' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <Icon className="text-sm" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 w-64 p-3 lg:p-4 border-t border-gray-700 bg-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 lg:w-10 lg:h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">{admin?.name?.charAt(0)}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{admin?.name}</p>
              <p className="text-gray-400 text-xs truncate">{admin?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-14 pb-20 lg:pt-0 lg:pb-0">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-800 border-t border-gray-700 px-2 py-2 safe-area-bottom">
        <div className="flex justify-around items-center">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'text-blue-500' : 'text-gray-400'
                }`}
              >
                <Icon className="text-xl" />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
