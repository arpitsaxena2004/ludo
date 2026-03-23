import { Navigate } from 'react-router-dom';
import useAdminStore from '../store/adminStore';

const PermissionGuard = ({ children, permission }) => {
  const { admin } = useAdminStore();

  // Super admin has access to everything
  if (admin?.role === 'super_admin') {
    return children;
  }

  // Check if admin has the required permission
  if (permission && !admin?.permissions?.includes(permission)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">You don't have permission to access this page</p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return children;
};

export default PermissionGuard;
