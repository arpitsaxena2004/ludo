import { useState, useEffect } from 'react';
import { FaSave, FaQrcode, FaUpload, FaGamepad, FaGift, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { adminAPI } from '../services/api';

const Settings = () => {
  const [paymentSettings, setPaymentSettings] = useState({
    upiId: '',
    upiNumber: '',
    qrCode: '',
    minDeposit: 50,
    maxDeposit: 100000,
    minWithdrawal: 100,
    maxWithdrawal: 50000,
    isDepositEnabled: true,
    isWithdrawalEnabled: true
  });
  const [gameSettings, setGameSettings] = useState({
    commissionRate: 5,
    referralBonus: 50,
    signupBonus: 50,
    noticeBoard: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchPaymentSettings();
    fetchGameSettings();
  }, []);

  const fetchGameSettings = async () => {
    try {
      const adminStorage = localStorage.getItem('admin-storage');
      const token = adminStorage ? JSON.parse(adminStorage).state.token : null;
      
      const [commissionRes, referralRes, signupRes, noticeRes] = await Promise.all([
        axios.get('/config/commissionRate', {
          baseURL: import.meta.env.VITE_API_URL,
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/config/referralBonus', {
          baseURL: import.meta.env.VITE_API_URL,
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/config/signupBonus', {
          baseURL: import.meta.env.VITE_API_URL,
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/config/noticeBoard', {
          baseURL: import.meta.env.VITE_API_URL,
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setGameSettings({
        commissionRate: commissionRes.data.data?.value || 5,
        referralBonus: referralRes.data.data?.value || 50,
        signupBonus: signupRes.data.data?.value || 50,
        noticeBoard: noticeRes.data.data?.value || ''
      });
    } catch (error) {
      console.error('Failed to fetch game settings');
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const adminStorage = localStorage.getItem('admin-storage');
      const token = adminStorage ? JSON.parse(adminStorage).state.token : null;
      const response = await axios.get('/payment/settings', {
        baseURL: import.meta.env.VITE_API_URL,
        headers: { Authorization: `Bearer ${token}` }
      });
      setPaymentSettings(response.data.data);
      setQrPreview(response.data.data.qrCode);
    } catch (error) {
      console.error('Failed to fetch payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleQrFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setQrFile(file);
      setQrPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadQr = async () => {
    if (!qrFile) {
      toast.error('Please select a QR code image');
      return;
    }

    setUploadingQr(true);
    try {
      const formData = new FormData();
      formData.append('qrCode', qrFile);

      const adminStorage = localStorage.getItem('admin-storage');
      const token = adminStorage ? JSON.parse(adminStorage).state.token : null;
      const response = await axios.post(
        '/payment/qr-code',
        formData,
        {
          baseURL: import.meta.env.VITE_API_URL,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setPaymentSettings(prev => ({ ...prev, qrCode: response.data.data.qrCode }));
      setQrFile(null);
      toast.success('QR code uploaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload QR code');
    } finally {
      setUploadingQr(false);
    }
  };

  const handleSavePaymentSettings = async () => {
    setSaving(true);
    try {
      const adminStorage = localStorage.getItem('admin-storage');
      const token = adminStorage ? JSON.parse(adminStorage).state.token : null;
      await axios.put(
        '/payment/settings',
        paymentSettings,
        {
          baseURL: import.meta.env.VITE_API_URL,
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Payment settings saved successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentChange = (key, value) => {
    setPaymentSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleGameChange = (key, value) => {
    setGameSettings(prev => ({ ...prev, [key]: Number(value) }));
  };

  const handleSaveGameSettings = async () => {
    setSaving(true);
    try {
      const adminStorage = localStorage.getItem('admin-storage');
      const token = adminStorage ? JSON.parse(adminStorage).state.token : null;

      await Promise.all([
        axios.put(
          '/config',
          {
            key: 'commissionRate',
            value: gameSettings.commissionRate,
            description: 'Game commission rate in percentage',
            category: 'game'
          },
          {
            baseURL: import.meta.env.VITE_API_URL,
            headers: { Authorization: `Bearer ${token}` }
          }
        ),
        axios.put(
          '/config',
          {
            key: 'referralBonus',
            value: gameSettings.referralBonus,
            description: 'Referral bonus amount in rupees',
            category: 'referral'
          },
          {
            baseURL: import.meta.env.VITE_API_URL,
            headers: { Authorization: `Bearer ${token}` }
          }
        ),
        axios.put(
          '/config',
          {
            key: 'signupBonus',
            value: gameSettings.signupBonus,
            description: 'Signup bonus amount in rupees for new users',
            category: 'referral'
          },
          {
            baseURL: import.meta.env.VITE_API_URL,
            headers: { Authorization: `Bearer ${token}` }
          }
        ),
        axios.put(
          '/config',
          {
            key: 'noticeBoard',
            value: gameSettings.noticeBoard,
            description: 'Notice board text displayed on home page',
            category: 'general'
          },
          {
            baseURL: import.meta.env.VITE_API_URL,
            headers: { Authorization: `Bearer ${token}` }
          }
        )
      ]);

      toast.success('Game settings saved successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save game settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      await adminAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl lg:text-3xl font-bold text-white mb-4 lg:mb-8">Settings</h1>

      {/* Password Change Section */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-gray-700 flex items-center gap-3">
          <FaLock className="text-blue-500" />
          <h2 className="text-lg font-semibold text-white">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="p-4 lg:p-6 space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2 font-semibold">Current Password</label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                required
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-blue-500 pr-12"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2 font-semibold">New Password</label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                required
                minLength={6}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-blue-500 pr-12"
                placeholder="Enter new password (min 6 characters)"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2 font-semibold">Confirm New Password</label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                minLength={6}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-blue-500 pr-12"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="w-full lg:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold"
          >
            <FaLock />
            {changingPassword ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Game Settings */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden mb-6">
        <div className="p-4 lg:p-6 border-b border-gray-700 flex items-center gap-3">
          <FaGamepad className="text-purple-500" />
          <h2 className="text-lg font-semibold text-white">Game Settings</h2>
        </div>

        <div className="p-4 lg:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2 font-semibold">Commission Rate (%)</label>
              <input
                type="number"
                value={gameSettings.commissionRate}
                onChange={(e) => handleGameChange('commissionRate', e.target.value)}
                min="0"
                max="100"
                step="0.1"
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-purple-500"
              />
              <p className="text-gray-500 text-xs mt-1">Platform commission on game winnings</p>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2 font-semibold flex items-center gap-2">
                <FaGift className="text-orange-400" /> Referral Bonus (₹)
              </label>
              <input
                type="number"
                value={gameSettings.referralBonus}
                onChange={(e) => handleGameChange('referralBonus', e.target.value)}
                min="0"
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-purple-500"
              />
              <p className="text-gray-500 text-xs mt-1">Bonus amount for successful referrals</p>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2 font-semibold flex items-center gap-2">
                <FaGift className="text-green-400" /> Signup Bonus (₹)
              </label>
              <input
                type="number"
                value={gameSettings.signupBonus}
                onChange={(e) => handleGameChange('signupBonus', e.target.value)}
                min="0"
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-purple-500"
              />
              <p className="text-gray-500 text-xs mt-1">Bonus amount for new user registration</p>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2 font-semibold">Notice Board Text</label>
            <textarea
              value={gameSettings.noticeBoard}
              onChange={(e) => setGameSettings(prev => ({ ...prev, noticeBoard: e.target.value }))}
              placeholder="Enter notice board text..."
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-purple-500 min-h-[100px]"
            />
            <p className="text-gray-500 text-xs mt-1">Text displayed in green notice box on home page</p>
          </div>

          <button
            onClick={handleSaveGameSettings}
            disabled={saving}
            className="w-full lg:w-auto flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-semibold"
          >
            <FaSave />
            {saving ? 'Saving...' : 'Save Game Settings'}
          </button>
        </div>
      </div>

      {/* Payment Settings */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-gray-700 flex items-center gap-3">
          <FaQrcode className="text-green-500" />
          <h2 className="text-lg font-semibold text-white">Payment Settings</h2>
        </div>

        <div className="p-4 lg:p-6 space-y-6">
          {/* QR Code Upload */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Payment QR Code</label>
            <div className="flex flex-col lg:flex-row gap-4">
              {qrPreview && (
                <div className="bg-white p-4 rounded-lg w-fit">
                  <img src={qrPreview} alt="QR Code" className="w-48 h-48 object-contain" />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrFileChange}
                  className="hidden"
                  id="qr-upload"
                />
                <label
                  htmlFor="qr-upload"
                  className="block w-full lg:w-auto bg-gray-700 text-white px-4 py-3 rounded-lg cursor-pointer hover:bg-gray-600 text-center"
                >
                  <FaUpload className="inline mr-2" />
                  Choose QR Code Image
                </label>
                {qrFile && (
                  <button
                    onClick={handleUploadQr}
                    disabled={uploadingQr}
                    className="mt-2 w-full lg:w-auto bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {uploadingQr ? 'Uploading...' : 'Upload QR Code'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2">UPI ID</label>
              <input
                type="text"
                value={paymentSettings.upiId}
                onChange={(e) => handlePaymentChange('upiId', e.target.value)}
                placeholder="yourname@upi"
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">UPI Number</label>
              <input
                type="text"
                value={paymentSettings.upiNumber}
                onChange={(e) => handlePaymentChange('upiNumber', e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Min Deposit (₹)</label>
              <input
                type="number"
                value={paymentSettings.minDeposit}
                onChange={(e) => handlePaymentChange('minDeposit', Number(e.target.value))}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Max Deposit (₹)</label>
              <input
                type="number"
                value={paymentSettings.maxDeposit}
                onChange={(e) => handlePaymentChange('maxDeposit', Number(e.target.value))}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Min Withdrawal (₹)</label>
              <input
                type="number"
                value={paymentSettings.minWithdrawal}
                onChange={(e) => handlePaymentChange('minWithdrawal', Number(e.target.value))}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Max Withdrawal (₹)</label>
              <input
                type="number"
                value={paymentSettings.maxWithdrawal}
                onChange={(e) => handlePaymentChange('maxWithdrawal', Number(e.target.value))}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="depositEnabled"
                checked={paymentSettings.isDepositEnabled}
                onChange={(e) => handlePaymentChange('isDepositEnabled', e.target.checked)}
                className="w-5 h-5 bg-gray-700 border-gray-600 rounded"
              />
              <label htmlFor="depositEnabled" className="text-gray-300">Enable Deposits</label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="withdrawalEnabled"
                checked={paymentSettings.isWithdrawalEnabled}
                onChange={(e) => handlePaymentChange('isWithdrawalEnabled', e.target.checked)}
                className="w-5 h-5 bg-gray-700 border-gray-600 rounded"
              />
              <label htmlFor="withdrawalEnabled" className="text-gray-300">Enable Withdrawals</label>
            </div>
          </div>

          <button
            onClick={handleSavePaymentSettings}
            disabled={saving}
            className="w-full lg:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <FaSave />
            {saving ? 'Saving...' : 'Save Payment Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
