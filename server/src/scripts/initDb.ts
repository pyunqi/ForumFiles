import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { initializeDatabase, runQuery, getQuery } from '../models/db';

dotenv.config();

async function initDb() {
  try {
    console.log('Initializing database...');

    // Initialize tables
    await initializeDatabase();

    // Create admin account if it doesn't exist
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Check if admin already exists
    const existingAdmin = await getQuery<any>(
      'SELECT id FROM users WHERE email = ?',
      [adminEmail]
    );

    if (!existingAdmin) {
      console.log('Creating default admin account...');
      const passwordHash = await bcrypt.hash(adminPassword, 10);

      await runQuery(
        'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
        [adminEmail, passwordHash, 'admin']
      );

      console.log(`Admin account created successfully!`);
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
      console.log('IMPORTANT: Please change the admin password after first login!');
    } else {
      console.log('Admin account already exists');
    }

    console.log('Database initialization completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDb();
