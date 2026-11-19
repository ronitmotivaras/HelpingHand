export function validateName(name, fieldLabel = 'Full Name') {
  if (!name || !String(name).trim()) {
    return `Please enter ${fieldLabel.toLowerCase()}`;
  }
  const str = String(name).trim();
  if (!/^[a-zA-Z\s]+$/.test(str)) {
    return `${fieldLabel} can only contain alphabets (a-z, A-Z) and spaces`;
  }
  return '';
}

export function validateAddress(address) {
  if (!address || !String(address).trim()) {
    return 'Please enter address';
  }
  const str = String(address).trim();
  if (!/^[a-zA-Z0-9\s]+$/.test(str)) {
    return 'Address can only contain letters, numbers, and spaces (no symbols)';
  }
  return '';
}

export function validatePassword(password) {
  const errors = [];
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  if (password && password.length > 14) {
    errors.push('Password must be at most 14 characters');
  }
  if (password && /[^a-zA-Z0-9@]/.test(password)) {
    errors.push('Password can only contain letters, numbers, and @');
  }
  return errors;
}

export function validateMobile(mobile) {
  if (!mobile || !String(mobile).trim()) {
    return 'Please enter your mobile number';
  }
  const str = String(mobile).trim();
  if (/[^0-9]/.test(str)) {
    return 'Mobile number can only contain digits (0-9) with no spaces or symbols';
  }
  if (str.length !== 10) {
    return 'Mobile number must be exactly 10 digits';
  }
  return '';
}
