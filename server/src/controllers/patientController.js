import { Op } from 'sequelize';
import Patient from '../models/Patient.js';
import { registerAudit } from '../services/auditService.js';

const SEARCHABLE_FIELDS = ['name', 'cpf', 'cardNumber'];

function sanitizeCpf(value = '') {
  return value.replace(/\D/g, '');
}

export async function listPatients(req, res) {
  const { q, name, cpf, cardNumber } = req.query;
  const where = {};

  if (q) {
    const term = `%${q.trim().toLowerCase()}%`;
    where[Op.or] = [
      { name: { [Op.iLike]: term } },
      { cpf: { [Op.iLike]: term.replace(/\D/g, '%') } },
      { cardNumber: { [Op.iLike]: term } },
    ];
  }

  const filters = { name, cpf, cardNumber };
  SEARCHABLE_FIELDS.forEach((field) => {
    if (filters[field]) {
      const value = filters[field].trim();
      if (field === 'cpf') {
        where[field] = { [Op.iLike]: `%${sanitizeCpf(value)}%` };
      } else {
        where[field] = { [Op.iLike]: `%${value}%` };
      }
    }
  });

  const patients = await Patient.findAll({
    where,
    order: [['name', 'ASC']],
  });
  return res.json(patients);
}

export async function createPatient(req, res) {
  const { name, cpf, insurance, cardNumber, address } = req.body;
  if (!name || !cpf) {
    return res.status(400).json({ message: 'Nome e CPF sao obrigatorios.' });
  }

  const normalizedCpf = sanitizeCpf(cpf);
  const existing = await Patient.findOne({ where: { cpf: normalizedCpf } });
  if (existing) {
    return res.status(409).json({ message: 'Paciente com este CPF ja cadastrado.' });
  }

  const patient = await Patient.create({
    name,
    cpf: normalizedCpf,
    insurance: insurance || null,
    cardNumber: cardNumber || null,
    address: address || null,
  });

  await registerAudit({
    entity: 'Patient',
    entityId: patient.id,
    action: 'create',
    performedBy: req.user.email,
    payload: patient.toJSON(),
  });

  return res.status(201).json(patient);
}

export async function updatePatient(req, res) {
  const { id } = req.params;
  const patient = await Patient.findByPk(id);
  if (!patient) {
    return res.status(404).json({ message: 'Paciente nao encontrado.' });
  }

  const { name, cpf, insurance, cardNumber, address } = req.body;
  if (!name || !cpf) {
    return res.status(400).json({ message: 'Nome e CPF sao obrigatorios.' });
  }

  const normalizedCpf = sanitizeCpf(cpf);
  if (normalizedCpf !== patient.cpf) {
    const duplicate = await Patient.findOne({ where: { cpf: normalizedCpf } });
    if (duplicate) {
      return res.status(409).json({ message: 'Paciente com este CPF ja cadastrado.' });
    }
  }

  await patient.update({
    name,
    cpf: normalizedCpf,
    insurance: insurance || null,
    cardNumber: cardNumber || null,
    address: address || null,
  });

  await registerAudit({
    entity: 'Patient',
    entityId: patient.id,
    action: 'update',
    performedBy: req.user.email,
    payload: patient.toJSON(),
  });

  return res.json(patient);
}

export async function deletePatient(req, res) {
  const { id } = req.params;
  const patient = await Patient.findByPk(id);
  if (!patient) {
    return res.status(404).json({ message: 'Paciente nao encontrado.' });
  }

  const quotationsCount = await patient.countQuotations();
  if (quotationsCount > 0) {
    return res.status(400).json({ message: 'Paciente vinculado a cotacoes nao pode ser removido.' });
  }

  await patient.destroy();

  await registerAudit({
    entity: 'Patient',
    entityId: patient.id,
    action: 'delete',
    performedBy: req.user.email,
    payload: null,
  });

  return res.status(204).send();
}

