import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUserShield, FaPlus, FaEdit, FaTrash, FaKey, FaCheck, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';

const SubAdmins = () => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'admin',
    permissions: []
  });

  const availablePermissions = [
    { value: 'manage_users', label: 'Manage Users' },
    { value: 'manage_games', label: 'Manage Games' },
    { value: 'manage_deposits', label: 'Manage Deposits' },
    { value: 'manage_withdrawals', label: 'Manage Withdrawals' },
    { value: 'manage_support', label: 'Manage Support' },
    { value: 'manage_settings', label: 'Manage Settings' },
    { value: 'view_analytics', label: 'View Analytics' }
  ];

  useEffect(() => {
    fetchSubAdmins();
  }, []);

  const fetchSubAdmins = async () => {
    try {
      const adminStorage = localStorage.getItem('admin-storage');
      const token = adminStorage ? JSON.parse(adminStorage).state.token : null;

      const response = await axios.get('/sub-admins', {
        baseURL: import.meta.env.VITE_API_URL + '/admin',
        headers: { Authorization: `Bearer ${token}` }
      });

      setSubAdmins(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch sub-admins');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const adminStorage = localStorage.getItem('admin-storage');
      const token = adminStorage ? JSON.parse(adminStorage).state.token : null;

      if (editingAdmin) {
        await axios.put(`/sub-admins/${editingAdmin._id}`, formData, {
          baseURL: import.meta.env.VITE_API_URL + '/admin',
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Sub-admin updated successfully');
      } else {
        await axios.post('/sub-admins', formData, {
          baseURL: import.meta.env.VITE_API_URL + '/admin',
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Sub-admin created successfully');
      }

      setShowModal(false);
      setEditingAdmin(null);
      setFormData({ email: '', password: '', name: '', role: 'admin', permissions: [] });
      fetchSubAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this sub-admin?')) return;

    try {
      const adminStorage = localStorage.getItem('admin-storage');
      const token = adminStorage ? JSON.parse(adminStorage).state.token : null;

      await axios.delete(`/sub-admins/${id}`, {
        baseURL: import.meta.env.VITE_API_URL + '/admin',
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Sub-admin deleted successfully');
      fetchSubAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete sub-admin');
    }
  };

  const handleResetPassword = async (id) => {
    const newPassword = prompt('Enter new password (min 6 characters):');
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const adminStorage = localStorage.getItem('admin-storage');
      const token = adminStorage ? JSON.parse(adminStorage).state.token : null;

      await axios.put(`/sub-admins/${id}/reset-password`, { newPassword }, {
        baseURL: import.meta.env.VITE_API_URL + '/admin',
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Password reset successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  const togglePermission = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      email: admin.email,
      password: '',
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions || []
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingAdmin(null);
    setFormData({ email: '', password: '', name: '', role: 'admin', permissions: [] });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <FaUserShield className="text-purple-400" />
          Sub-Admin Management
        </h1>
        <button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2"
        >
          <FaPlus /> Add Sub-Admin
        </button>
      </div>

      <div className="grid gap-4">
        {subAdmins.map((admin, index) => (
          <motion.div
            key={admin._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-white">{admin.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    admin.role === 'admin' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                  }`}>
                    {admin.role.toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    admin.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {admin.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-gray-400 mb-3">{admin.email}</p>
                <div className="flex flex-wrap gap-2">
                  {admin.permissions && admin.permissions.length > 0 ? (
                    admin.permissions.map(perm => (
                      <span key={perm} className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg text-xs">
                        {availablePermissions.find(p => p.value === perm)?.label || perm}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No permissions assigned</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(admin)}
                  className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-all"
                  title="Edit"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleResetPassword(admin._id)}
                  className="bg-yellow-500 text-white p-3 rounded-lg hover:bg-yellow-600 transition-all"
                  title="Reset Password"
                >
                  <FaKey />
                </button>
                <button
                  onClick={() => handleDelete(admin._id)}
                  className="bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 transition-all"
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {subAdmins.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FaUserShield className="text-6xl mx-auto mb-4 opacity-50" />
            <p className="text-xl">No sub-admins found</p>
            <p className="text-sm mt-2">Click "Add Sub-Admin" to create one</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingAdmin ? 'Edit Sub-Admin' : 'Create Sub-Admin'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-purple-500"
                  required
                  disabled={editingAdmin}
                />
              </div>

              {!editingAdmin && (
                <div>
                  <label className="block text-gray-300 mb-2">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-purple-500"
                    required
                    minLength={6}
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-300 mb-2">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-purple-500"
                >
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-3">Permissions</label>
                <div className="grid grid-cols-2 gap-3">
                  {availablePermissions.map(perm => (
                    <label
                      key={perm.value}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        formData.permissions.includes(perm.value)
                          ? 'bg-purple-500/30 border-2 border-purple-500'
                          : 'bg-gray-700 border-2 border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.value)}
                        onChange={() => togglePermission(perm.value)}
                        className="hidden"
                      />
                      <div className={`w-5 h-5 rounded flex items-center justify-center ${
                        formData.permissions.includes(perm.value)
                          ? 'bg-purple-500'
                          : 'bg-gray-600'
                      }`}>
                        {formData.permissions.includes(perm.value) && (
                          <FaCheck className="text-white text-xs" />
                        )}
                      </div>
                      <span className="text-white text-sm">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingAdmin(null);
                  }}
                  className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-bold hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-bold hover:scale-105 transition-all"
                >
                  {editingAdmin ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SubAdmins;
