import { useState, useEffect } from 'react';
import { FaSave, FaQrcode, FaUpload, FaGamepad, FaGift, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { adminAPI } from '../services/api';

const Settings = () => {
  const [paymentSettings, setPaymentSettings] = useState({
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
    noticeBoard: '',
    telegramGroup: '',
    whatsappGroup: '',
    ludoEnabled: true,
    snakeLadderEnabled: true
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchPaymentSettings();
    fetchGameSettings();
  }, []);

  const fetchGameSettings = async () => {
    try {
      const adminStorage = localStorage.getItem('admin-storage');
      const token = adminStorage ? JSON.parse(adminStorage).state.token : null;
      
      const [commissionRes, referralRes, signupRes, noticeRes, telegramRes, whatsappRes, ludoRes, snakeLadderRes] = await Promise.all([
        axios.get('/config/commissionRate', { baseURL: import.meta.env.VITE_API_URL, headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/config/referralBonus', { baseURL: import.meta.env.VITE_API_URL, headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/config/signupBonus', { baseURL: import.meta.env.VITE_API_URL, headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/config/noticeBoard', { baseURL: import.meta.env.VITE_API_URL, headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/config/telegramGroup', { baseURL: import.meta.env.VITE_API_URL, headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/config/whatsappGroup', { baseURL: import.meta.env.VITE_API_URL, headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/config/ludoEnabled', { baseURL: import.meta.env.VITE_API_URL, headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: { value: true } } })),
        axios.get('/config/snakeLadderEnabled', { baseURL: import.meta.env.VITE_API_URL, headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: { value: true } } }))
      ]);

      setGameSettings({
        commissionRate: commissionRes.data.data?.value || 5,
        referralBonus: referralRes.data.data?.value || 50,
        signupBonus: signupRes.data.data?.value || 50,
        noticeBoard: noticeRes.data.data?.value || '',
        telegramGroup: telegramRes.data.data?.value || '',
        whatsappGroup: whatsappRes.data.data?.value || '',
        ludoEnabled: ludoRes.data.data?.value !== false,
        snakeLadderEnabled: snakeLadderRes.data.data?.value !== false
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
    } catch (error) {
      console.error('Failed to fetch payment settings');
    } finally {
      setLoading(false);
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
    setGameSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveGameSettings = async () => {
    setSaving(true);
    try {
      const adminStorage = localStorage.getItem('admin-storage');
      const token = adminStorage ? JSON.parse(adminStorage).state.token : null;

      await Promise.all([
        axios.put('/config', { key: 'commissionRate', value: Number(gameSettings.commissionRate), description: 'Game commission rate in percentage', category: 'game' }, { baseURL: import.meta.env.VITE_API_URL, headers: { Authorization: `Bearer ${token}` } }),
        axios.put('/config', { key: 'referralBonus', value: Number(gameSettings.referralBonus), description: 'Referral bonus amount in rupees', category: 'referral' }, { baseURL: import.meta.env.VITE_API_URL, headers: { Authorization: `Bearer ${token}` } }),
        axios.put('/config', { key: 'signupBonus', value: Number(gameSettings.signupBonus), description: 'Signup bonus amount in rupees for new users', category: 'referral' }, { baseURL: import.meta.env.VITE_API_URL, headers: { Authorization: `Bearer ${token}` } }),
        axios.put('/config', { key: 'noticeBoard', value: gameSettings.noticeBoard, description: 'Notice board text displayed on home page', category: 'general' }, { baseURL: import.meta.env.VITE_API_URL, headers: { Authorization: `Bearer ${token}` } }),
        axios.put('/config', { key: 'telegramGroup', value: gameSettings.telegramGroup, description: 'Telegram group link for support', category: 'general' }, { baseURL: import.meta.env.VITE_API_URL, headers: { Authorization: `Bearer ${token}` } }),
        axios.put('/config', { key: 'whatsappGroup', value: gameSettings.whatsappGroup, description: 'WhatsApp group link for support', category: 'general' }, { baseURL: import.meta.env.VITE_API_URL, headers: { Authorization: `Bearer ${token}` } }),
        axios.put('/config', { key: 'ludoEnabled', value: gameSettings.ludoEnabled, description: 'Enable or disable Ludo game', category: 'game' }, { baseURL: import.meta.env.VITE_API_URL, headers: { Authorization: `Bearer ${token}` } }),
        axios.put('/config', { key: 'snakeLadderEnabled', value: gameSettings.snakeLadderEnabled, description: 'Enable or disable Snake & Ladder game', category: 'game' }, { baseURL: import.meta.env.VITE_API_URL, headers: { Authorization: `Bearer ${token}` } })
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2 font-semibold">Telegram Group Link</label>
              <input
                type="text"
                value={gameSettings.telegramGroup}
                onChange={(e) => setGameSettings(prev => ({ ...prev, telegramGroup: e.target.value }))}
                placeholder="https://t.me/yourgroup"
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-purple-500"
              />
              <p className="text-gray-500 text-xs mt-1">Telegram link for the customer support page</p>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2 font-semibold">WhatsApp Group Link</label>
              <input
                type="text"
                value={gameSettings.whatsappGroup}
                onChange={(e) => setGameSettings(prev => ({ ...prev, whatsappGroup: e.target.value }))}
                placeholder="https://wa.me/yourgroup"
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-purple-500"
              />
              <p className="text-gray-500 text-xs mt-1">WhatsApp link for the customer support page</p>
            </div>
          </div>

          {/* Game Enable/Disable Toggles */}
          <div>
            <label className="block text-gray-400 text-sm mb-3 font-semibold">Game Availability</label>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="flex items-center justify-between bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎲</span>
                  <div>
                    <p className="text-white font-semibold">Ludo Game</p>
                    <p className="text-gray-400 text-xs">Enable or disable Ludo battles</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gameSettings.ludoEnabled}
                    onChange={(e) => handleGameChange('ludoEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🐍</span>
                  <div>
                    <p className="text-white font-semibold">Snake & Ladder</p>
                    <p className="text-gray-400 text-xs">Enable or disable S&L battles</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gameSettings.snakeLadderEnabled}
                    onChange={(e) => handleGameChange('snakeLadderEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
            </div>
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
          <h2 className="text-lg font-semibold text-white">Payment Settings (Automatic Gateway)</h2>
        </div>

        <div className="p-4 lg:p-6 space-y-6">
          {/* Info Message */}
          <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
            <p className="text-blue-400 text-sm">
              💡 Deposits are now processed automatically through payment gateway. No manual UPI/QR code needed.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
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
