import { Service, ServiceType } from '../models/index.js';
import { registerAudit } from '../services/auditService.js';

const SERVICE_TYPE_CATEGORIES = ['professional', 'equipment', 'medication'];

export async function listServices(req, res) {
  const services = await Service.findAll({
    order: [
      ['name', 'ASC'],
      [ServiceType, 'name', 'ASC'],
    ],
    include: [{ model: ServiceType }],
  });
  return res.json(services);
}

export async function createService(req, res) {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Nome e obrigatorio.' });
  }

  const existing = await Service.findOne({ where: { name } });
  if (existing) {
    return res.status(409).json({ message: 'Servico ja cadastrado.' });
  }

  const service = await Service.create({ name });
  await registerAudit({
    entity: 'Service',
    entityId: service.id,
    action: 'create',
    performedBy: req.user.email,
    payload: { name },
  });
  return res.status(201).json(service);
}

export async function updateService(req, res) {
  const { id } = req.params;
  const service = await Service.findByPk(id);
  if (!service) {
    return res.status(404).json({ message: 'Servico nao encontrado.' });
  }

  const { name } = req.body;
  if (name && name !== service.name) {
    const duplicate = await Service.findOne({ where: { name } });
    if (duplicate) {
      return res.status(409).json({ message: 'Servico ja cadastrado.' });
    }
  }

  await service.update({ name });
  await registerAudit({
    entity: 'Service',
    entityId: service.id,
    action: 'update',
    performedBy: req.user.email,
    payload: { name },
  });
  return res.json(service);
}

export async function deleteService(req, res) {
  const { id } = req.params;
  const service = await Service.findByPk(id);
  if (!service) {
    return res.status(404).json({ message: 'Servico nao encontrado.' });
  }

  const serviceTypes = await service.countServiceTypes();
  if (serviceTypes > 0) {
    return res.status(400).json({ message: 'Servico nao pode ser removido pois possui tipos associados.' });
  }

  await service.destroy();
  await registerAudit({
    entity: 'Service',
    entityId: service.id,
    action: 'delete',
    performedBy: req.user.email,
    payload: null,
  });
  return res.status(204).send();
}

export async function createServiceType(req, res) {
  const { serviceId } = req.params;
  const { name, averageValue, category = 'professional' } = req.body;
  if (!name || !averageValue) {
    return res.status(400).json({ message: 'Nome e valor medio sao obrigatorios.' });
  }
  if (!SERVICE_TYPE_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: 'Categoria invalida.' });
  }

  const service = await Service.findByPk(serviceId);
  if (!service) {
    return res.status(404).json({ message: 'Servico nao encontrado.' });
  }

  const serviceType = await ServiceType.create({ name, averageValue, serviceId, category });
  await registerAudit({
    entity: 'ServiceType',
    entityId: serviceType.id,
    action: 'create',
    performedBy: req.user.email,
    payload: { name, averageValue, serviceId, category },
  });
  return res.status(201).json(serviceType);
}

export async function updateServiceType(req, res) {
  const { serviceTypeId } = req.params;
  const { name, averageValue, category } = req.body;
  const serviceType = await ServiceType.findByPk(serviceTypeId);
  if (!serviceType) {
    return res.status(404).json({ message: 'Tipo de servico nao encontrado.' });
  }

  if (category && !SERVICE_TYPE_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: 'Categoria invalida.' });
  }

  await serviceType.update({
    name,
    averageValue,
    ...(category ? { category } : {}),
  });
  await registerAudit({
    entity: 'ServiceType',
    entityId: serviceType.id,
    action: 'update',
    performedBy: req.user.email,
    payload: { name, averageValue, category: category || serviceType.category },
  });
  return res.json(serviceType);
}

export async function deleteServiceType(req, res) {
  const { serviceTypeId } = req.params;
  const serviceType = await ServiceType.findByPk(serviceTypeId);
  if (!serviceType) {
    return res.status(404).json({ message: 'Tipo de servico nao encontrado.' });
  }

  const hasQuotations = await serviceType.countQuotations();
  if (hasQuotations > 0) {
    return res.status(400).json({ message: 'Tipo de servico nao pode ser removido pois esta vinculado a cotacoes.' });
  }

  await serviceType.destroy();
  await registerAudit({
    entity: 'ServiceType',
    entityId: serviceType.id,
    action: 'delete',
    performedBy: req.user.email,
    payload: null,
  });
  return res.status(204).send();
}

