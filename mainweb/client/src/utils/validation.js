export function validateName(name, fieldLabel = 'Full Name') {
  if (!name || !String(name).trim()) {
    return `Please enter ${fieldLabel.toLowerCase()}`;
  }
  const str = String(name).trim();
  if (str.length > 100) {
    return `${fieldLabel} cannot exceed 100 characters`;
  }
  if (!/^[a-zA-Z\s]+$/.test(str)) {
    return 'Only alphabets allowed';
  }
  return '';
}

export function validateNgoName(name, fieldLabel = 'NGO Name') {
  if (!name || !String(name).trim()) {
    return `Please enter ${fieldLabel.toLowerCase()}`;
  }
  const str = String(name).trim();
  if (str.length > 100) {
    return `${fieldLabel} cannot exceed 100 characters`;
  }
  if (!/^[a-zA-Z0-9\s,\-]+$/.test(str)) {
    return 'Only letters, numbers, commas, and hyphens allowed';
  }
  return '';
}

export function validateAddress(address) {
  if (!address || !String(address).trim()) {
    return 'Please enter address';
  }
  const str = String(address).trim();
  if (str.length > 1000) {
    return 'Address cannot exceed 1000 characters';
  }
  if (!/^[a-zA-Z0-9\s,.\-]+$/.test(str)) {
    return 'Only letters, numbers, commas, hyphens, and periods allowed';
  }
  return '';
}

export function validatePassword(password) {
  const errors = [];
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  if (password && password.length > 15) {
    errors.push('Password must be at most 15 characters');
  }
  if (password && /\s/.test(password)) {
    errors.push('Password cannot contain spaces');
  }
  if (password && /[^a-zA-Z0-9@]/.test(password)) {
    errors.push('Password can only contain letters, numbers, and @');
  }
  return errors;
}

export function validateMobile(mobile) {
  if (!mobile || !String(mobile).trim()) {
    return 'Please enter mobile number';
  }
  const str = String(mobile).trim();
  if (/[^0-9]/.test(str)) {
    return 'Only numbers allowed';
  }
  if (str.length !== 10) {
    return 'Mobile number must be exactly 10 digits';
  }
  return '';
}

export function validateFoodItemName(name) {
  if (!name || !String(name).trim()) {
    return 'Please enter food item name';
  }
  const str = String(name).trim();
  if (str.length > 100) {
    return 'Food item name cannot exceed 100 characters';
  }
  if (!/^[a-zA-Z0-9\s,.\-]+$/.test(str)) {
    return 'Only letters, numbers, commas, hyphens, and periods allowed';
  }
  return '';
}

export function validateQuantity(quantity) {
  if (!quantity || !String(quantity).trim()) {
    return 'Please enter quantity';
  }
  const str = String(quantity).trim();
  if (!/^[0-9]+(\.[0-9]+)?$/.test(str) || parseFloat(str) <= 0) {
    return 'Only numbers allowed';
  }
  return '';
}
