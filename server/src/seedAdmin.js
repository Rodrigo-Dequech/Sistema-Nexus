import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import './models/index.js';
import { User } from './models/index.js';

dotenv.config();

async function seed() {
  const email = process.env.ADMIN_EMAIL || 'admin@homecare.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const name = process.env.ADMIN_NAME || 'Administrador';

  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log('Usuário administrador já existe.');
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ name, email, passwordHash, role: 'admin' });
    console.log(`Usuário administrador criado com email ${email} e senha padrão.`);
  } catch (error) {
    console.error('Erro ao criar usuário administrador', error);
  } finally {
    await sequelize.close();
  }
}

seed();
