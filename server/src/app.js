import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import './models/index.js';
import authRoutes from './routes/authRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import quotationRoutes from './routes/quotationRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/quotations', quotationRoutes);

export async function initDatabase() {
  await sequelize.authenticate();
  await sequelize.sync();
}

export default app;
