import { useState, useEffect } from 'react';
import { FaHeadset, FaReply, FaCheck, FaClock, FaCheckCircle, FaTimesCircle, FaSearch, FaUser, FaSpinner, FaPaperPlane, FaWhatsapp, FaSave } from 'react-icons/fa';
import { adminAPI } from '../services/api';
import axios from 'axios';
import toast from 'react-hot-toast';

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  // Support Config State
  const [supportConfig, setSupportConfig] = useState({
    whatsappSupportNumber: '',
    telegramGroup: '',
    whatsappGroup: ''
  });
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    fetchTickets();
    fetchSupportConfig();
  }, [filter]);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm]);

  const fetchSupportConfig = async () => {
    try {
      const adminStorage = localStorage.getItem('admin-storage');
      const token = adminStorage ? JSON.parse(adminStorage).state.token : null;
      
      const [whatsappNumRes, telegramRes, whatsappGroupRes] = await Promise.all([
        axios.get('/config/whatsappSupportNumber', { baseURL: import.meta.env.VITE_API_URL, headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/config/telegramGroup', { baseURL: import.meta.env.VITE_API_URL, headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/config/whatsappGroup', { baseURL: import.meta.env.VITE_API_URL, headers: { Authorization: `Bearer ${token}` } })
      ]);

      setSupportConfig({
        whatsappSupportNumber: whatsappNumRes.data?.data?.value || '',
        telegramGroup: telegramRes.data?.data?.value || '',
        whatsappGroup: whatsappGroupRes.data?.data?.value || ''
      });
    } catch (error) {
      console.error('Failed to fetch support config');
    }
  };

  const handleSaveSupportConfig = async () => {
    setSavingConfig(true);
    try {
      const adminStorage = localStorage.getItem('admin-storage');
      const token = adminStorage ? JSON.parse(adminStorage).state.token : null;
      
      await Promise.all([
        axios.put('/config', { key: 'whatsappSupportNumber', value: supportConfig.whatsappSupportNumber, description: 'WhatsApp number for floating button', category: 'general' }, { baseURL: import.meta.env.VITE_API_URL, headers: { Authorization: `Bearer ${token}` } }),
        axios.put('/config', { key: 'telegramGroup', value: supportConfig.telegramGroup, description: 'Telegram group link', category: 'general' }, { baseURL: import.meta.env.VITE_API_URL, headers: { Authorization: `Bearer ${token}` } }),
        axios.put('/config', { key: 'whatsappGroup', value: supportConfig.whatsappGroup, description: 'WhatsApp group link', category: 'general' }, { baseURL: import.meta.env.VITE_API_URL, headers: { Authorization: `Bearer ${token}` } })
      ]);

      toast.success('Support links saved successfully! ✅');
    } catch (error) {
      toast.error('Failed to save support config');
    } finally {
      setSavingConfig(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSupportTickets(1, 100, filter !== 'all' ? filter : '');
      setTickets(response.data.tickets || []);
    } catch (error) {
      toast.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = tickets;
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.userId?.phoneNumber?.includes(searchTerm) ||
        t.userId?.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredTickets(filtered);
  };

  const handleReply = async () => {
    if (!reply.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSending(true);
    try {
      await adminAPI.replyToTicket(selectedTicket._id, reply);
      toast.success('Reply sent successfully! 📨');
      setReply('');
      
      // Refresh ticket details
      const response = await adminAPI.getSupportTickets(1, 100, '');
      const updatedTicket = response.data.tickets.find(t => t._id === selectedTicket._id);
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
      }
      fetchTickets();
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleClose = async (id) => {
    try {
      await adminAPI.updateTicketStatus(id, 'closed');
      toast.success('Ticket closed successfully! ✅');
      fetchTickets();
      setSelectedTicket(null);
    } catch (error) {
      toast.error('Failed to close ticket');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: FaClock, label: 'Open', border: 'border-yellow-500' },
      closed: { bg: 'bg-green-500/20', text: 'text-green-400', icon: FaCheckCircle, label: 'Closed', border: 'border-green-500' },
      resolved: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: FaCheckCircle, label: 'Resolved', border: 'border-blue-500' }
    };
    const badge = badges[status] || badges.open;
    const Icon = badge.icon;
    return (
      <span className={`${badge.bg} ${badge.text} ${badge.border} border px-3 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1`}>
        <Icon /> {badge.label}
      </span>
    );
  };

  const getCategoryColor = (category) => {
    const colors = {
      general: 'bg-gray-600',
      payment: 'bg-green-600',
      game: 'bg-purple-600',
      account: 'bg-blue-600',
      technical: 'bg-red-600',
      other: 'bg-orange-600'
    };
    return colors[category] || colors.general;
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    closed: tickets.filter(t => t.status === 'closed').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="text-4xl text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Support Tickets</h1>
      </div>


      {/* Filters & Search */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-6">
        {/* Support Settings Section */}
        <div className="space-y-4 mb-4 pb-4 border-b border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1 font-semibold flex items-center gap-2">
                <FaWhatsapp className="text-green-500" /> Floating WhatsApp No.
              </label>
              <input
                type="text"
                value={supportConfig.whatsappSupportNumber}
                onChange={(e) => setSupportConfig(prev => ({ ...prev, whatsappSupportNumber: e.target.value }))}
                placeholder="e.g. +919024608772"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg outline-none border border-gray-600 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1 font-semibold flex items-center gap-2">
                <FaPaperPlane className="text-blue-400" /> Telegram Group
              </label>
              <input
                type="text"
                value={supportConfig.telegramGroup}
                onChange={(e) => setSupportConfig(prev => ({ ...prev, telegramGroup: e.target.value }))}
                placeholder="https://t.me/yourgroup"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg outline-none border border-gray-600 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1 font-semibold flex items-center gap-2">
                <FaWhatsapp className="text-green-400" /> WhatsApp Group
              </label>
              <input
                type="text"
                value={supportConfig.whatsappGroup}
                onChange={(e) => setSupportConfig(prev => ({ ...prev, whatsappGroup: e.target.value }))}
                placeholder="https://wa.me/yourgroup"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg outline-none border border-gray-600 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-gray-500 text-xs mt-1">These details are shown on the user's Contact/Support page and floating icon.</p>
            <button
              onClick={handleSaveSupportConfig}
              disabled={savingConfig}
              className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-bold"
            >
              <FaSave />
              {savingConfig ? 'Saving...' : 'Save Support Config'}
            </button>
          </div>
        </div>

        
      </div>

      {/* Tickets List */}
      
      {/* Ticket Detail Modal */}
      
    </div>
  );
};

export default Support;
