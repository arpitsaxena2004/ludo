import { useState, useEffect } from 'react';
import { 
  FaCheck, FaTimes, FaEye, FaIdCard, FaUser, FaCalendar, 
  FaMapMarkerAlt, FaFileAlt, FaSearch, FaSpinner, FaExclamationTriangle,
  FaCheckCircle, FaClock, FaTimesCircle, FaImage, FaExpand
} from 'react-icons/fa';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

const KYC = () => {
  const [kycRequests, setKycRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [imageModal, setImageModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [allRequests, setAllRequests] = useState([]);

  useEffect(() => {
    fetchKYC();
  }, [filter]);

  const fetchKYC = async () => {
    try {
      setLoading(true);
      
      // Fetch all statuses to calculate stats
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        adminAPI.getKYCRequests(1, 100, 'pending').catch(() => ({ data: { kycRequests: [] } })),
        adminAPI.getKYCRequests(1, 100, 'approved').catch(() => ({ data: { kycRequests: [] } })),
        adminAPI.getKYCRequests(1, 100, 'rejected').catch(() => ({ data: { kycRequests: [] } }))
      ]);

      const extractRequests = (users) => users?.map(user => ({
        _id: user._id,
        userId: {
          phoneNumber: user.phoneNumber,
          username: user.username,
          email: user.email
        },
        ...user.kycDetails,
        createdAt: user.kycDetails?.submittedAt || user.createdAt
      })) || [];

      const pendingRequests = extractRequests(pendingRes.data.kycRequests);
      const approvedRequests = extractRequests(approvedRes.data.kycRequests);
      const rejectedRequests = extractRequests(rejectedRes.data.kycRequests);

      const allReqs = [...pendingRequests, ...approvedRequests, ...rejectedRequests];
      setAllRequests(allReqs);
      
      // Filter based on selected filter
      if (filter === 'all') {
        setKycRequests(allReqs);
      } else if (filter === 'approved') {
        setKycRequests(approvedRequests);
      } else if (filter === 'pending') {
        setKycRequests(pendingRequests);
      } else if (filter === 'rejected') {
        setKycRequests(rejectedRequests);
      }
    } catch (error) {
      console.error('Fetch KYC Error:', error);
      toast.error('Failed to fetch KYC requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this KYC?')) return;
    
    setActionLoading(true);
    try {
      await adminAPI.updateKYC(id, 'approved');
      toast.success('KYC approved successfully');
      fetchKYC();
      setSelectedKyc(null);
    } catch (error) {
      toast.error('Failed to approve KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      await adminAPI.updateKYC(id, 'rejected', rejectionReason);
      toast.success('KYC rejected');
      fetchKYC();
      setShowRejectModal(null);
      setSelectedKyc(null);
      setRejectionReason('');
    } catch (error) {
      toast.error('Failed to reject KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'verified': 
        return 'bg-green-500/20 text-green-400 border-green-500';
      case 'pending': 
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'rejected': 
        return 'bg-red-500/20 text-red-400 border-red-500';
      default: 
        return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
      case 'verified': 
        return <FaCheckCircle />;
      case 'pending': 
        return <FaClock />;
      case 'rejected': 
        return <FaTimesCircle />;
      default: 
        return <FaIdCard />;
    }
  };

  const filteredRequests = kycRequests.filter(kyc => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      kyc.userId?.phoneNumber?.includes(search) ||
      kyc.userId?.username?.toLowerCase().includes(searchLower) ||
      kyc.fullName?.toLowerCase().includes(searchLower) ||
      kyc.documentNumber?.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: allRequests.length,
    pending: allRequests.filter(k => k.status === 'pending').length,
    approved: allRequests.filter(k => k.status === 'approved' || k.status === 'verified').length,
    rejected: allRequests.filter(k => k.status === 'rejected').length,
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">KYC Verification</h1>
        
        {/* Stats Summary */}
        <div className="flex gap-2 text-sm">
          <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-lg border border-yellow-500">
            {stats.pending} Pending
          </div>
          <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg border border-green-500">
            {stats.approved} Approved
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by phone, name, or document number..."
            className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg outline-none border border-gray-700 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['pending', 'approved', 'rejected', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm capitalize transition-all ${
              filter === f
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {f} {f !== 'all' && `(${stats[f] || 0})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <FaSpinner className="text-3xl text-blue-500 animate-spin" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
          <FaIdCard className="text-5xl text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No KYC requests found</p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {filteredRequests.map((kyc) => (
              <div key={kyc._id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FaUser className="text-blue-400 text-sm" />
                      <p className="text-white font-semibold">{kyc.fullName || 'N/A'}</p>
                    </div>
                    <p className="text-gray-400 text-sm">{kyc.userId?.phoneNumber || 'N/A'}</p>
                    <p className="text-gray-500 text-xs mt-1 capitalize">{kyc.documentType}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs border flex items-center gap-1 ${getStatusColor(kyc.status)}`}>
                    {getStatusIcon(kyc.status)}
                    {kyc.status}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                  <p className="text-gray-500 text-xs flex items-center gap-1">
                    <FaCalendar />
                    {new Date(kyc.createdAt).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => setSelectedKyc(kyc)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
                  >
                    <FaEye /> Review
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-white text-sm font-semibold">User Details</th>
                    <th className="px-6 py-4 text-left text-white text-sm font-semibold">Document</th>
                    <th className="px-6 py-4 text-left text-white text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-white text-sm font-semibold">Submitted</th>
                    <th className="px-6 py-4 text-left text-white text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((kyc) => (
                    <tr key={kyc._id} className="border-t border-gray-700 hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{kyc.fullName || 'N/A'}</p>
                          <p className="text-gray-400 text-sm">{kyc.userId?.phoneNumber}</p>
                          {kyc.userId?.email && (
                            <p className="text-gray-500 text-xs">{kyc.userId.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white text-sm capitalize">{kyc.documentType}</p>
                          <p className="text-gray-400 text-xs">{kyc.documentNumber}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-sm border inline-flex items-center gap-2 ${getStatusColor(kyc.status)}`}>
                          {getStatusIcon(kyc.status)}
                          {kyc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {new Date(kyc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedKyc(kyc)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* KYC Detail Modal */}
      {selectedKyc && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedKyc(null)}>
          <div className="bg-gray-800 rounded-2xl w-full max-w-4xl border border-gray-700 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between z-10">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">KYC Verification</h3>
                <p className="text-gray-400 text-sm">Review and verify user documents</p>
              </div>
              <button
                onClick={() => setSelectedKyc(null)}
                className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-6">
              {/* Status Badge */}
              <div className="mb-6">
                <span className={`px-4 py-2 rounded-lg text-sm border inline-flex items-center gap-2 ${getStatusColor(selectedKyc.status)}`}>
                  {getStatusIcon(selectedKyc.status)}
                  <span className="font-semibold capitalize">{selectedKyc.status}</span>
                </span>
              </div>

              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-750 rounded-xl p-4 border border-gray-700">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <FaUser className="text-blue-400" /> Personal Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Full Name</p>
                      <p className="text-white font-medium">{selectedKyc.fullName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Phone Number</p>
                      <p className="text-white">{selectedKyc.userId?.phoneNumber || 'N/A'}</p>
                    </div>
                    {selectedKyc.userId?.email && (
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Email</p>
                        <p className="text-white">{selectedKyc.userId.email}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Date of Birth</p>
                      <p className="text-white">
                        {selectedKyc.dateOfBirth 
                          ? new Date(selectedKyc.dateOfBirth).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Address</p>
                      <p className="text-white text-sm">{selectedKyc.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-750 rounded-xl p-4 border border-gray-700">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <FaIdCard className="text-green-400" /> Document Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Document Type</p>
                      <p className="text-white font-medium capitalize">{selectedKyc.documentType || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Document Number</p>
                      <p className="text-white font-mono">{selectedKyc.documentNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Submitted On</p>
                      <p className="text-white">
                        {new Date(selectedKyc.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {selectedKyc.rejectionReason && (
                      <div>
                        <p className="text-red-400 text-xs mb-1 flex items-center gap-1">
                          <FaExclamationTriangle /> Rejection Reason
                        </p>
                        <p className="text-red-300 text-sm bg-red-500/10 p-2 rounded">
                          {selectedKyc.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Document Images */}
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <FaImage className="text-purple-400" /> Uploaded Documents
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedKyc.documentFront && (
                    <div>
                      <p className="text-gray-400 text-xs mb-2">Document Front</p>
                      <div 
                        className="relative group cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageModal(selectedKyc.documentFront);
                        }}
                      >
                        <img 
                          src={selectedKyc.documentFront} 
                          alt="Document Front" 
                          className="w-full h-48 object-cover rounded-lg border-2 border-gray-700 hover:border-blue-500 transition-colors"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <FaExpand className="text-white text-2xl" />
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedKyc.documentBack && (
                    <div>
                      <p className="text-gray-400 text-xs mb-2">Document Back</p>
                      <div 
                        className="relative group cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageModal(selectedKyc.documentBack);
                        }}
                      >
                        <img 
                          src={selectedKyc.documentBack} 
                          alt="Document Back" 
                          className="w-full h-48 object-cover rounded-lg border-2 border-gray-700 hover:border-blue-500 transition-colors"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <FaExpand className="text-white text-2xl" />
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedKyc.selfie && (
                    <div>
                      <p className="text-gray-400 text-xs mb-2">Selfie with Document</p>
                      <div 
                        className="relative group cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageModal(selectedKyc.selfie);
                        }}
                      >
                        <img 
                          src={selectedKyc.selfie} 
                          alt="Selfie" 
                          className="w-full h-48 object-cover rounded-lg border-2 border-gray-700 hover:border-blue-500 transition-colors"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <FaExpand className="text-white text-2xl" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedKyc.status === 'pending' && (
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-700">
                  <button
                    onClick={() => setSelectedKyc(null)}
                    className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setShowRejectModal(selectedKyc)}
                    disabled={actionLoading}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <FaSpinner className="animate-spin" /> : <FaTimes />}
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedKyc._id)}
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-red-500">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FaExclamationTriangle className="text-red-400" />
              Reject KYC
            </h3>
            <p className="text-gray-400 mb-4 text-sm">
              Please provide a reason for rejection. This will be shown to the user.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-red-500 resize-none mb-4"
              rows="4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason('');
                }}
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal._id)}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <FaSpinner className="animate-spin" /> : <FaTimes />}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {imageModal && (
        <div 
          className="fixed inset-0 bg-black z-[9999] flex items-center justify-center p-4" 
          style={{ zIndex: 9999 }}
          onClick={() => setImageModal(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setImageModal(null);
            }}
            className="absolute top-4 right-4 text-white bg-red-600 hover:bg-red-700 p-3 rounded-full shadow-lg transition-colors"
            style={{ zIndex: 10000 }}
          >
            <FaTimes className="text-xl" />
          </button>
          <img 
            src={imageModal} 
            alt="Document Preview" 
            className="max-w-full max-h-full object-contain"
            style={{ maxWidth: '95vw', maxHeight: '95vh' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default KYC;
