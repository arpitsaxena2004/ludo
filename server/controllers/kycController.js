import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

// Helper to upload file to Cloudinary
const uploadToCloudinary = async (filePath, folder, publicId) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    // Development fallback
    return { secure_url: `https://via.placeholder.com/400x300?text=KYC+Document` };
  }

  const result = await cloudinary.uploader.upload(filePath, {
    folder: folder,
    public_id: publicId,
    resource_type: 'image',
    quality: 'auto:good',
    format: 'webp'
  });

  // Delete temp file
  fs.unlink(filePath, (err) => {
    if (err) console.log('Failed to delete temp file:', err.message);
  });

  return result;
};

// @desc    Submit KYC documents
// @route   POST /api/kyc/submit
// @access  Private
export const submitKYC = async (req, res) => {
  try {
    const { fullName, dateOfBirth, address, documentType, documentNumber } = req.body;

    if (!fullName || !dateOfBirth || !address || !documentType || !documentNumber) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!req.files || !req.files.documentFront || !req.files.selfie) {
      return res.status(400).json({ message: 'Document front and selfie are required' });
    }

    const user = await User.findById(req.user._id);

    if (user.isKYCVerified) {
      return res.status(400).json({ message: 'KYC already verified' });
    }

    const userId = user._id.toString();
    const timestamp = Date.now();

    // Upload document front
    const documentFrontUpload = await uploadToCloudinary(
      req.files.documentFront[0].path,
      'a2z-ludo/kyc',
      `${userId}_front_${timestamp}`
    );

    // Upload selfie
    const selfieUpload = await uploadToCloudinary(
      req.files.selfie[0].path,
      'a2z-ludo/kyc',
      `${userId}_selfie_${timestamp}`
    );

    // Upload document back if provided
    let documentBackUrl = null;
    if (req.files.documentBack && req.files.documentBack[0]) {
      const documentBackUpload = await uploadToCloudinary(
        req.files.documentBack[0].path,
        'a2z-ludo/kyc',
        `${userId}_back_${timestamp}`
      );
      documentBackUrl = documentBackUpload.secure_url;
    }

    // Update user KYC details
    user.kycDetails = {
      fullName,
      dateOfBirth: new Date(dateOfBirth),
      address,
      documentType,
      documentNumber: documentNumber.toUpperCase(),
      documentFront: documentFrontUpload.secure_url,
      documentBack: documentBackUrl,
      selfie: selfieUpload.secure_url,
      status: 'pending',
      submittedAt: new Date(),
      rejectionReason: null
    };

    await user.save();

    res.status(200).json({
      message: 'KYC submitted successfully! Verification usually takes 24-48 hours.',
      kycStatus: user.kycDetails.status
    });
  } catch (error) {
    console.error('Submit KYC Error:', error);
    
    // Clean up temp files on error
    if (req.files) {
      Object.values(req.files).forEach(fileArray => {
        fileArray.forEach(file => {
          fs.unlink(file.path, () => {});
        });
      });
    }
    
    res.status(500).json({ message: 'Failed to submit KYC', error: error.message });
  }
};

// @desc    Get KYC status
// @route   GET /api/kyc/status
// @access  Private
export const getKYCStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.kycDetails || !user.kycDetails.submittedAt) {
      return res.status(200).json({
        status: 'not_submitted',
        message: 'KYC not submitted yet'
      });
    }

    res.status(200).json({
      status: user.kycDetails.status,
      isVerified: user.isKYCVerified,
      fullName: user.kycDetails.fullName,
      documentType: user.kycDetails.documentType,
      documentNumber: user.kycDetails.documentNumber,
      submittedAt: user.kycDetails.submittedAt,
      verifiedAt: user.kycDetails.verifiedAt,
      rejectionReason: user.kycDetails.rejectionReason
    });
  } catch (error) {
    console.error('Get KYC Status Error:', error);
    res.status(500).json({ message: 'Failed to get KYC status', error: error.message });
  }
};
