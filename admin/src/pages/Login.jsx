import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from '../services/api';
import useAdminStore from '../store/adminStore';

const Login = () => {
  const navigate = useNavigate();
  const { setAuth } = useAdminStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const response = await adminAPI.login(email, password);
      setAuth(response.data.admin, response.data.token);
      toast.success(response.data.message);
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm lg:max-w-md">
        <div className="text-center mb-6 lg:mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">A2Z Ludo</h1>
          <p className="text-gray-400 text-sm lg:text-base">Admin Panel</p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 lg:p-8 border border-gray-700">
          <h2 className="text-xl lg:text-2xl font-bold text-white mb-4 lg:mb-6">Admin Login</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2 text-sm lg:text-base">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-blue-500 text-sm lg:text-base"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 mb-2 text-sm lg:text-base">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-blue-500 text-sm lg:text-base"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm lg:text-base active:scale-[0.98]"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
