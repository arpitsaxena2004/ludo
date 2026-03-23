import axios from 'axios';

// Cache for config values
const configCache = {};

/**
 * Get configuration value from server
 * @param {string} key - Configuration key
 * @param {number} defaultValue - Default value if not found
 * @returns {Promise<number>} Configuration value
 */
export const getConfig = async (key, defaultValue = 0) => {
  // Return cached value if available
  if (configCache[key] !== undefined) {
    return configCache[key];
  }

  try {
    const response = await axios.get(`/config/public/${key}`, {
      baseURL: import.meta.env.VITE_API_URL
    });
    
    const value = response.data.data?.value || defaultValue;
    configCache[key] = value;
    return value;
  } catch (error) {
    console.error(`Failed to fetch config ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Get commission rate
 * @returns {Promise<number>} Commission rate percentage
 */
export const getCommissionRate = async () => {
  return await getConfig('commissionRate', 5);
};

/**
 * Get referral bonus
 * @returns {Promise<number>} Referral bonus amount
 */
export const getReferralBonus = async () => {
  return await getConfig('referralBonus', 50);
};

/**
 * Clear config cache (useful after settings update)
 */
export const clearConfigCache = () => {
  Object.keys(configCache).forEach(key => delete configCache[key]);
};
