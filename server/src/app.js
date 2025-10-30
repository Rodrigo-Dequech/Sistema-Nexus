import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import './models/index.js';
import authRoutes from './routes/authRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import quotationRoutes from './routes/quotationRoutes.js';
import patientRoutes from './routes/patientRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});


app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/patients', patientRoutes);

export async function initDatabase() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
}

export default app;
