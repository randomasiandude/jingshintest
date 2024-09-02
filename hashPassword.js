const bcrypt = require('bcryptjs');

// Replace 'yourPassword' with the password you want to hash
const passwordToHash = 'yourPassword';

// Hash the password
bcrypt.hash(passwordToHash, 10, (err, hash) => {
    if (err) throw err;
    console.log('Hashed password:', hash);
});
