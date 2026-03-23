import { useState, useEffect } from 'react';
import { FaHeadset, FaReply, FaCheck, FaClock, FaCheckCircle, FaTimesCircle, FaSearch, FaUser, FaSpinner, FaPaperPlane } from 'react-icons/fa';
import { adminAPI } from '../services/api';
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

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm]);

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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500 rounded-xl p-4">
          <p className="text-blue-400 text-sm font-semibold mb-1">Total Tickets</p>
          <p className="text-3xl font-black text-white">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500 rounded-xl p-4">
          <p className="text-yellow-400 text-sm font-semibold mb-1">Open</p>
          <p className="text-3xl font-black text-white">{stats.open}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500 rounded-xl p-4">
          <p className="text-green-400 text-sm font-semibold mb-1">Closed</p>
          <p className="text-3xl font-black text-white">{stats.closed}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by subject, phone, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('open')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                filter === 'open'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setFilter('closed')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                filter === 'closed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              Closed
            </button>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
            <FaHeadset className="text-6xl text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No tickets found</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div
              key={ticket._id}
              onClick={() => setSelectedTicket(ticket)}
              className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-blue-500/50 transition-all cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaUser className="text-white text-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg mb-1 line-clamp-1">{ticket.subject}</h3>
                      <p className="text-gray-400 text-sm line-clamp-2">{ticket.message}</p>
                    </div>
                    {getStatusBadge(ticket.status)}
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <span className={`${getCategoryColor(ticket.category)} text-white text-xs px-2 py-1 rounded-full capitalize`}>
                      {ticket.category}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {ticket.userId?.phoneNumber || 'N/A'}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                    {ticket.replies && ticket.replies.length > 0 && (
                      <span className="text-blue-400 text-sm">
                        💬 {ticket.replies.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}>
          <div className="bg-gray-800 rounded-2xl w-full max-w-3xl border border-gray-700 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-800 p-6 border-b border-gray-700 z-10">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">{selectedTicket.subject}</h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-gray-400 flex items-center gap-2">
                      <FaUser /> {selectedTicket.userId?.username || 'User'}
                    </span>
                    <span className="text-gray-400">{selectedTicket.userId?.phoneNumber}</span>
                    <span className={`${getCategoryColor(selectedTicket.category)} text-white text-xs px-3 py-1 rounded-full capitalize`}>
                      {selectedTicket.category}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-400 hover:text-white text-3xl ml-4"
                >
                  ×
                </button>
              </div>
              {getStatusBadge(selectedTicket.status)}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Original Message */}
              <div className="bg-gray-750 rounded-xl p-4 border border-gray-700">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaUser className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold mb-1">{selectedTicket.userId?.username || 'User'}</p>
                    <p className="text-gray-300">{selectedTicket.message}</p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs ml-13">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
              </div>
              
              {/* Replies */}
              {selectedTicket.replies?.map((r, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-4 border ${
                    r.isAdmin
                      ? 'bg-blue-600/10 border-blue-500/30 ml-8'
                      : 'bg-gray-750 border-gray-700 mr-8'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      r.isAdmin ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-blue-500 to-purple-600'
                    }`}>
                      {r.isAdmin ? '👨‍💼' : <FaUser className="text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold mb-1">{r.isAdmin ? 'Admin' : selectedTicket.userId?.username || 'User'}</p>
                      <p className="text-gray-300">{r.message}</p>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs ml-13">{new Date(r.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>

            {selectedTicket.status === 'open' && (
              <div className="sticky bottom-0 bg-gray-800 p-6 border-t border-gray-700">
                <div className="flex gap-3 mb-3">
                  <input
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                    placeholder="Type your reply..."
                    className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-xl outline-none border-2 border-gray-600 focus:border-blue-500"
                  />
                  <button
                    onClick={handleReply}
                    disabled={sending}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2 font-bold"
                  >
                    {sending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                    Send
                  </button>
                </div>
                <button
                  onClick={() => handleClose(selectedTicket._id)}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-bold flex items-center justify-center gap-2"
                >
                  <FaCheck /> Close Ticket
                </button>
              </div>
            )}

            {selectedTicket.status !== 'open' && (
              <div className="sticky bottom-0 bg-gray-800 p-6 border-t border-gray-700">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="w-full bg-gray-700 text-white py-3 rounded-xl hover:bg-gray-600 font-bold transition-all"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
