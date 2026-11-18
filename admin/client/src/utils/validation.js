export function validatePassword(password) {
  const errors = [];
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  if (password && password.length > 30) {
    errors.push('Password must be no more than 30 characters');
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
    return 'Mobile number can only contain digits (0-9) with no spaces or symbols';
  }
  if (str.length !== 10) {
    return 'Mobile number must be exactly 10 digits';
  }
  return '';
}
