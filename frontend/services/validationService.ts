// Data validation utilities

export const validators = {
  // Email validation
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Phone validation (for India)
  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  },

  // Password strength (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
  isValidPassword: (password: string): boolean => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  },

  // Pin code validation (for India)
  isValidPinCode: (pinCode: string): boolean => {
    const pinRegex = /^[0-9]{6}$/;
    return pinRegex.test(pinCode);
  },

  // Text validation
  isValidName: (name: string): boolean => {
    return name.trim().length >= 2 && name.trim().length <= 100;
  },

  // Address validation
  isValidAddress: (address: string): boolean => {
    return address.trim().length >= 5 && address.trim().length <= 500;
  },

  // Price validation
  isValidPrice: (price: number): boolean => {
    return price > 0 && price <= 999999;
  },

  // Quantity validation
  isValidQuantity: (qty: number): boolean => {
    return Number.isInteger(qty) && qty > 0 && qty <= 100;
  },

  // URLs
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Latitude/Longitude
  isValidCoordinates: (lat: number, lng: number): boolean => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  },
};

// Input sanitization
export const sanitize = {
  // Remove HTML tags
  removeHtml: (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Trim and remove extra spaces
  normalizeText: (text: string): string => {
    return text.trim().replace(/\s+/g, ' ');
  },

  // Remove special characters except allowed ones
  sanitizeInput: (text: string, allowedChars = 'a-zA-Z0-9 ._-'): string => {
    const regex = new RegExp(`[^${allowedChars}]`, 'g');
    return text.replace(regex, '');
  },

  // Convert to lowercase and remove special chars (for search)
  normalizeSearch: (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/gi, '');
  },
};

// Form validation
export const formValidation = {
  validateEmail: (email: string): { valid: boolean; error?: string } => {
    if (!email) return { valid: false, error: 'Email is required' };
    if (!validators.isValidEmail(email)) return { valid: false, error: 'Invalid email format' };
    return { valid: true };
  },

  validatePassword: (password: string): { valid: boolean; error?: string } => {
    if (!password) return { valid: false, error: 'Password is required' };
    if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters' };
    if (!/[A-Z]/.test(password)) return { valid: false, error: 'Password must contain uppercase letter' };
    if (!/[a-z]/.test(password)) return { valid: false, error: 'Password must contain lowercase letter' };
    if (!/[0-9]/.test(password)) return { valid: false, error: 'Password must contain number' };
    return { valid: true };
  },

  validatePhone: (phone: string): { valid: boolean; error?: string } => {
    if (!phone) return { valid: false, error: 'Phone is required' };
    if (!validators.isValidPhone(phone)) return { valid: false, error: 'Invalid phone number' };
    return { valid: true };
  },

  validateName: (name: string): { valid: boolean; error?: string } => {
    if (!name) return { valid: false, error: 'Name is required' };
    if (!validators.isValidName(name)) return { valid: false, error: 'Name must be 2-100 characters' };
    return { valid: true };
  },

  validateAddress: (address: string): { valid: boolean; error?: string } => {
    if (!address) return { valid: false, error: 'Address is required' };
    if (!validators.isValidAddress(address)) return { valid: false, error: 'Address must be 5-500 characters' };
    return { valid: true };
  },
};

export default { validators, sanitize, formValidation };
