const crypto = require('crypto');

/**
 * Generate a secure random password
 * @param {number} length - Length of the password (default: 12)
 * @returns {string} - Generated password
 */
const generatePassword = (length = 12) => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';

    const allChars = uppercase + lowercase + numbers + symbols;

    let password = '';

    
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    
    return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Generate a unique student ID
 * @param {number} count - Current student count
 * @returns {string} - Generated student ID (e.g., STU001, STU002)
 */
const generateStudentId = (count) => {
    const paddedNumber = String(count + 1).padStart(3, '0');
    return `STU${paddedNumber}`;
};

module.exports = {
    generatePassword,
    generateStudentId
};
