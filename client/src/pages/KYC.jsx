import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCamera, FaIdCard, FaUser, FaTimes, FaSpinner, FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { kycAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const KYC = () => {
  const { user, updateUser } = useAuthStore();
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    address: '',
    documentType: 'aadhaar',
    documentNumber: '',
  });
  const [files, setFiles] = useState({
    documentFront: null,
    documentBack: null,
    selfie: null,
  });
  const [previews, setPreviews] = useState({
    documentFront: null,
    documentBack: null,
    selfie: null,
  });
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const frontRef = useRef(null);
  const backRef = useRef(null);
  const selfieRef = useRef(null);

  useEffect(() => {
    checkKYCStatus();
  }, []);

  const checkKYCStatus = async () => {
    try {
      const response = await kycAPI.getStatus();
      setKycStatus(response.data);
    } catch (error) {
      console.error('Failed to check KYC status');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleFileChange = (type, file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setFiles(prev => ({ ...prev, [type]: file }));
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews(prev => ({ ...prev, [type]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (type) => {
    setFiles(prev => ({ ...prev, [type]: null }));
    setPreviews(prev => ({ ...prev, [type]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!files.documentFront) {
      toast.error('Please upload document front image');
      return;
    }

    if (!files.selfie) {
      toast.error('Please upload a selfie');
      return;
    }

    if (formData.documentType === 'aadhaar' && !files.documentBack) {
      toast.error('Please upload document back image for Aadhaar');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      formDataToSend.append('documentFront', files.documentFront);
      formDataToSend.append('selfie', files.selfie);
      if (files.documentBack) {
        formDataToSend.append('documentBack', files.documentBack);
      }

      const response = await kycAPI.submitKYC(formDataToSend);
      toast.success(response.data.message);
      setKycStatus({ status: 'pending' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit KYC');
    } finally {
      setLoading(false);
    }
  };

  const FileUploadBox = ({ type, label, icon: Icon, required = true, inputRef }) => (
    <div className="mb-4">
      <label className="block text-gray-700 mb-2 text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="file"
        ref={inputRef}
        accept="image/*"
        onChange={(e) => handleFileChange(type, e.target.files[0])}
        className="hidden"
      />
      {previews[type] ? (
        <div className="relative">
          <img
            src={previews[type]}
            alt={label}
            className="w-full h-40 object-cover rounded-xl border-2 border-green-500"
          />
          <button
            type="button"
            onClick={() => removeFile(type)}
            className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"
          >
            <FaTimes />
          </button>
          <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1 shadow-lg">
            <FaCheckCircle /> Uploaded
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50 transition-all bg-gray-50"
        >
          <Icon className="text-3xl text-gray-400" />
          <span className="text-gray-500 text-sm font-medium">Tap to upload</span>
        </button>
      )}
    </div>
  );

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-[#e8f5d0] p-4 pb-24 flex items-center justify-center">
        <FaSpinner className="text-4xl text-gray-800 animate-spin" />
      </div>
    );
  }

  // Already verified
  if (user?.isKYCVerified || user?.kycDetails?.status === 'approved' || kycStatus?.status === 'approved') {
    const displayName = kycStatus?.fullName || user?.kycDetails?.fullName || 'N/A';
    const displayDocType = kycStatus?.documentType || user?.kycDetails?.documentType || 'N/A';
    
    return (
      <div className="min-h-screen bg-[#e8f5d0] p-4 pb-24 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center bg-white rounded-3xl p-8 border-2 border-green-500 shadow-xl max-w-md w-full"
        >
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheckCircle className="text-4xl text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">KYC Verified ✓</h2>
          <p className="text-gray-600 mb-4">Your identity has been verified successfully</p>
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <p className="text-sm text-gray-700 mb-1">
              <span className="font-semibold">Name:</span> {displayName}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Document:</span> {displayDocType.toUpperCase()}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Pending verification - only show if explicitly pending
  if (kycStatus?.status === 'pending') {
    return (
      <div className="min-h-screen bg-[#e8f5d0] p-4 pb-24 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center bg-white rounded-3xl p-8 border-2 border-yellow-500 shadow-xl max-w-md w-full"
        >
          <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <FaClock className="text-4xl text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Pending</h2>
          <p className="text-gray-600 mb-2">Your documents are under review</p>
          <p className="text-yellow-600 text-sm font-semibold">Usually takes 24-48 hours</p>
        </motion.div>
      </div>
    );
  }

  // Check if rejected
  const isRejected = kycStatus?.status === 'rejected';
  const rejectionReason = kycStatus?.rejectionReason || user?.kycDetails?.rejectionReason;

  // Show form for not submitted or rejected status
  return (
    <div className="min-h-screen bg-[#e8f5d0] p-4 pb-24">
      {isRejected && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-red-50 border-2 border-red-400 rounded-2xl p-4 mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <FaTimesCircle className="text-red-600 text-xl" />
            <h3 className="text-red-600 font-bold">KYC Rejected</h3>
          </div>
          <p className="text-gray-700 text-sm">{rejectionReason || 'Please resubmit with valid documents'}</p>
        </motion.div>
      )}
      <h1 className="text-2xl font-bold text-gray-800 mb-6">KYC Verification</h1>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-3xl p-6 border-2 border-gray-200 shadow-lg"
      >
        <form onSubmit={handleSubmit}>
          {/* Personal Info */}
          <h3 className="text-gray-800 font-bold text-lg mb-4 flex items-center gap-2">
            <FaUser className="text-blue-500" /> Personal Information
          </h3>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 text-sm font-medium">Full Name (as per document) <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              className="w-full bg-gray-50 text-gray-800 px-4 py-3 rounded-xl outline-none border-2 border-gray-300 focus:border-blue-500"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2 text-sm font-medium">Date of Birth <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
              className="w-full bg-gray-50 text-gray-800 px-4 py-3 rounded-xl outline-none border-2 border-gray-300 focus:border-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 text-sm font-medium">Address <span className="text-red-500">*</span></label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full bg-gray-50 text-gray-800 px-4 py-3 rounded-xl outline-none border-2 border-gray-300 focus:border-blue-500 resize-none"
              rows="2"
              placeholder="Enter your full address"
              required
            />
          </div>

          {/* Document Info */}
          <h3 className="text-gray-800 font-bold text-lg mb-4 flex items-center gap-2">
            <FaIdCard className="text-green-500" /> Document Details
          </h3>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2 text-sm font-medium">Document Type <span className="text-red-500">*</span></label>
            <select
              value={formData.documentType}
              onChange={(e) => setFormData({...formData, documentType: e.target.value})}
              className="w-full bg-gray-50 text-gray-800 px-4 py-3 rounded-xl outline-none border-2 border-gray-300 focus:border-blue-500"
            >
              <option value="aadhaar">Aadhaar Card</option>
              <option value="pan">PAN Card</option>
              <option value="driving_license">Driving License</option>
              <option value="voter_id">Voter ID</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 text-sm font-medium">Document Number <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.documentNumber}
              onChange={(e) => setFormData({...formData, documentNumber: e.target.value.toUpperCase()})}
              className="w-full bg-gray-50 text-gray-800 px-4 py-3 rounded-xl outline-none border-2 border-gray-300 focus:border-blue-500"
              placeholder="Enter document number"
              required
            />
          </div>

          {/* Document Upload */}
          <h3 className="text-gray-800 font-bold text-lg mb-4 flex items-center gap-2">
            <FaCamera className="text-purple-500" /> Upload Documents
          </h3>

          <FileUploadBox
            type="documentFront"
            label="Document Front"
            icon={FaIdCard}
            inputRef={frontRef}
          />

          {formData.documentType === 'aadhaar' && (
            <FileUploadBox
              type="documentBack"
              label="Document Back"
              icon={FaIdCard}
              inputRef={backRef}
            />
          )}

          <FileUploadBox
            type="selfie"
            label="Selfie with Document"
            icon={FaUser}
            inputRef={selfieRef}
          />

          <p className="text-gray-600 text-xs mb-6">
            * Hold your document next to your face for the selfie. Make sure both your face and document are clearly visible.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" /> Uploading...
              </>
            ) : (
              'Submit for Verification'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default KYC;
