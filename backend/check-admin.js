import { connectDatabase, getConnection } from './config/database.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function checkAdmin() {
  try {
    await connectDatabase();
    const connection = getConnection();
    
    console.log('🔍 Checking admin in database...');
    const [admins] = await connection.execute('SELECT * FROM admin');
    console.log('👥 Admins found:', admins.length);
    
    if (admins.length > 0) {
      const admin = admins[0];
      console.log('📧 Admin email:', admin.email);
      console.log('🆔 Admin ID:', admin.id_admin);
      
      // Test the password from .env
      const envPassword = process.env.ADMIN_PASSWORD || 'admin123';
      console.log('🔐 Testing password:', envPassword);
      const isValid = await bcrypt.compare(envPassword, admin.password);
      console.log('✅ Password valid:', isValid);
      
      if (!isValid) {
        console.log('🔄 Recreating admin with correct password...');
        const hashedPassword = await bcrypt.hash(envPassword, 10);
        await connection.execute(
          'UPDATE admin SET password = ? WHERE id_admin = ?',
          [hashedPassword, admin.id_admin]
        );
        console.log('✅ Admin password updated');
      }
    } else {
      console.log('❌ No admin found, creating one...');
      const envPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const envEmail = process.env.ADMIN_EMAIL || 'admin@gamezone.com';
      const hashedPassword = await bcrypt.hash(envPassword, 10);
      
      await connection.execute(
        'INSERT INTO admin (email, password, nom, prenom) VALUES (?, ?, ?, ?)',
        [envEmail, hashedPassword, 'Admin', 'GameZone']
      );
      console.log('✅ Admin created');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAdmin();
