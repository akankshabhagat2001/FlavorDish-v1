// generate-hash.js
// Usage: node generate-hash.js <yourNewPassword>

const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
    console.error('Usage: node generate-hash.js admin123');
    process.exit(1);
}

bcrypt.hash(password, 10, (err, hash) => {
    if (err) throw err;
    console.log('Bcrypt hash for password:', password);
    console.log(hash);
});