// Script to generate bcrypt password hash
// Usage: node scripts/generate-password-hash.js <password>

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('Usage: node generate-password-hash.js <password>');
  process.exit(1);
}

const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

console.log('\nPassword:', password);
console.log('Hash:', hash);
console.log('\nUse this hash in your database INSERT statement.\n');

