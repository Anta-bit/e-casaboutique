const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

(async () => {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'casa_boutique',
    });

    console.log('Testing bcrypt match for database users...');

    const [users] = await pool.query('SELECT email, password FROM users');
    for (const u of users) {
      console.log(`User in DB: ${u.email}`);
      const testPasswords = ['admin123', 'client123'];
      for (const p of testPasswords) {
        const match = await bcrypt.compare(p, u.password);
        if (match) {
          console.log(`  -> Password "${p}" MATCHES!`);
        }
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
