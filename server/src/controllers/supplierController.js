import { Supplier } from '../models/index.js';
import { registerAudit } from '../services/auditService.js';

export async function listSuppliers(req, res) {
  const suppliers = await Supplier.findAll({ order: [['name', 'ASC']] });
  return res.json(suppliers);
}

export async function createSupplier(req, res) {
  const { name, document, address, phone, email } = req.body;
  if (!name || !document || !address || !phone || !email) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  const existing = await Supplier.findOne({ where: { document } });
  if (existing) {
    return res.status(409).json({ message: 'Já existe fornecedor com esse CPF/CNPJ.' });
  }

  const supplier = await Supplier.create({ name, document, address, phone, email });
  await registerAudit({
    entity: 'Supplier',
    entityId: supplier.id,
    action: 'create',
    performedBy: req.user.email,
    payload: { name, document, address, phone, email },
  });

  return res.status(201).json(supplier);
}

export async function updateSupplier(req, res) {
  const { id } = req.params;
  const supplier = await Supplier.findByPk(id);
  if (!supplier) {
    return res.status(404).json({ message: 'Fornecedor não encontrado.' });
  }

  const { name, document, address, phone, email } = req.body;
  if (document && document !== supplier.document) {
    const duplicate = await Supplier.findOne({ where: { document } });
    if (duplicate) {
      return res.status(409).json({ message: 'Já existe fornecedor com esse CPF/CNPJ.' });
    }
  }

  await supplier.update({ name, document, address, phone, email });
  await registerAudit({
    entity: 'Supplier',
    entityId: supplier.id,
    action: 'update',
    performedBy: req.user.email,
    payload: { name, document, address, phone, email },
  });

  return res.json(supplier);
}

export async function deleteSupplier(req, res) {
  const { id } = req.params;
  const supplier = await Supplier.findByPk(id);
  if (!supplier) {
    return res.status(404).json({ message: 'Fornecedor não encontrado.' });
  }

  const hasQuotations = (await supplier.countQuotations()) > 0;
  if (hasQuotations) {
    return res.status(400).json({ message: 'Fornecedor não pode ser removido pois possui cotações associadas.' });
  }

  await supplier.destroy();
  await registerAudit({
    entity: 'Supplier',
    entityId: supplier.id,
    action: 'delete',
    performedBy: req.user.email,
    payload: null,
  });

  return res.status(204).send();
}
