import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

let connection;

export async function connectDatabase() {
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });
    
    console.log('✅ Database connected successfully');
    return connection;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function initializeDatabase() {
  try {
    // Create admin table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin (
        id_admin INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Add password column to client table if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE client ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT ''
      `);
      console.log('✅ Password column added to client table');
    } catch (error) {
      // Column might already exist, ignore error
      if (!error.message.includes('Duplicate column name')) {
        console.log('ℹ️ Password column already exists in client table');
      }
    }

    // Check if admin exists, if not create default admin
    const [existingAdmin] = await connection.execute(
      'SELECT * FROM admin WHERE email = ?',
      [process.env.ADMIN_EMAIL]
    );

    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      await connection.execute(
        'INSERT INTO admin (email, password, nom, prenom) VALUES (?, ?, ?, ?)',
        [process.env.ADMIN_EMAIL, hashedPassword, 'Admin', 'GameZone']
      );
      console.log('🔐 Default admin created');
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

export function getConnection() {
  return connection;
}