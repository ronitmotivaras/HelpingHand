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
