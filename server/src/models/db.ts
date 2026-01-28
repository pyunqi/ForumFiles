import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../database/forum_files.db');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create database connection
export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Initialize database tables
export function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(20) DEFAULT 'user' CHECK(role IN ('user', 'admin')),
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating users table:', err.message);
      });

      // Create indexes for users table
      db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
      db.run('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');

      // Create files table
      db.run(`
        CREATE TABLE IF NOT EXISTS files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          filename VARCHAR(255) NOT NULL,
          original_filename VARCHAR(255) NOT NULL,
          description TEXT,
          file_path VARCHAR(500) NOT NULL,
          file_size INTEGER NOT NULL,
          mime_type VARCHAR(100),
          file_hash VARCHAR(64) NOT NULL,
          download_count INTEGER DEFAULT 0,
          is_deleted BOOLEAN DEFAULT 0,
          is_public BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('Error creating files table:', err.message);
      });

      // Add is_public column if it doesn't exist (migration)
      db.run(`ALTER TABLE files ADD COLUMN is_public BOOLEAN DEFAULT 0`, (err) => {
        // Ignore error if column already exists
      });

      // Create indexes for files table
      db.run('CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_files_hash ON files(file_hash)');
      db.run('CREATE INDEX IF NOT EXISTS idx_files_created ON files(created_at DESC)');

      // Create verification_codes table
      db.run(`
        CREATE TABLE IF NOT EXISTS verification_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email VARCHAR(255) NOT NULL,
          code VARCHAR(6) NOT NULL,
          expires_at DATETIME NOT NULL,
          is_used BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating verification_codes table:', err.message);
      });

      // Create indexes for verification_codes table
      db.run('CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email)');
      db.run('CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at)');

      // Create public_links table
      db.run(`
        CREATE TABLE IF NOT EXISTS public_links (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          file_id INTEGER NOT NULL,
          link_code VARCHAR(32) UNIQUE NOT NULL,
          password VARCHAR(4) NOT NULL,
          created_by INTEGER NOT NULL,
          expires_at DATETIME,
          max_downloads INTEGER DEFAULT NULL,
          download_count INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `, (err) => {
        if (err) console.error('Error creating public_links table:', err.message);
      });

      // Create indexes for public_links table
      db.run('CREATE INDEX IF NOT EXISTS idx_public_links_code ON public_links(link_code)');
      db.run('CREATE INDEX IF NOT EXISTS idx_public_links_file ON public_links(file_id)');

      // Create file_shares table
      db.run(`
        CREATE TABLE IF NOT EXISTS file_shares (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          file_id INTEGER NOT NULL,
          shared_by INTEGER NOT NULL,
          recipient_email VARCHAR(255) NOT NULL,
          message TEXT,
          is_downloaded BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
          FOREIGN KEY (shared_by) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating file_shares table:', err.message);
          reject(err);
        } else {
          console.log('Database tables initialized successfully');
          resolve();
        }
      });

      // Create indexes for file_shares table
      db.run('CREATE INDEX IF NOT EXISTS idx_file_shares_file ON file_shares(file_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_file_shares_recipient ON file_shares(recipient_email)');
    });

    // Create admin user from environment variables if configured
    createAdminUser().then(resolve).catch(reject);
  });
}

// Create admin user from environment variables
async function createAdminUser(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log('No admin credentials configured in environment variables');
    return;
  }

  return new Promise((resolve, reject) => {
    // Check if admin user already exists
    db.get('SELECT id, role FROM users WHERE email = ?', [adminEmail], async (err, row: any) => {
      if (err) {
        console.error('Error checking admin user:', err.message);
        return resolve(); // Don't fail initialization
      }

      if (row) {
        // User exists - update role to admin if not already
        if (row.role !== 'admin') {
          db.run('UPDATE users SET role = ? WHERE email = ?', ['admin', adminEmail], (err) => {
            if (err) {
              console.error('Error updating admin role:', err.message);
            } else {
              console.log(`Updated user ${adminEmail} to admin role`);
            }
            resolve();
          });
        } else {
          console.log(`Admin user ${adminEmail} already exists`);
          resolve();
        }
      } else {
        // Create new admin user
        try {
          const passwordHash = await bcrypt.hash(adminPassword, 10);
          db.run(
            'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
            [adminEmail, passwordHash, 'admin'],
            (err) => {
              if (err) {
                console.error('Error creating admin user:', err.message);
              } else {
                console.log(`Admin user ${adminEmail} created successfully`);
              }
              resolve();
            }
          );
        } catch (hashError) {
          console.error('Error hashing admin password:', hashError);
          resolve();
        }
      }
    });
  });
}

// Query helper functions
export function runQuery(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function getQuery<T>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T | undefined);
    });
  });
}

export function allQuery<T>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}
