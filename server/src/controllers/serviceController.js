import { Service, ServiceType } from '../models/index.js';
import { registerAudit } from '../services/auditService.js';

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
    return res.status(400).json({ message: 'Nome é obrigatório.' });
  }

  const existing = await Service.findOne({ where: { name } });
  if (existing) {
    return res.status(409).json({ message: 'Serviço já cadastrado.' });
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
    return res.status(404).json({ message: 'Serviço não encontrado.' });
  }

  const { name } = req.body;
  if (name && name !== service.name) {
    const duplicate = await Service.findOne({ where: { name } });
    if (duplicate) {
      return res.status(409).json({ message: 'Serviço já cadastrado.' });
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
    return res.status(404).json({ message: 'Serviço não encontrado.' });
  }

  const serviceTypes = await service.countServiceTypes();
  if (serviceTypes > 0) {
    return res.status(400).json({ message: 'Serviço não pode ser removido pois possui tipos associados.' });
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
  const { name, averageValue } = req.body;
  if (!name || !averageValue) {
    return res.status(400).json({ message: 'Nome e valor médio são obrigatórios.' });
  }

  const service = await Service.findByPk(serviceId);
  if (!service) {
    return res.status(404).json({ message: 'Serviço não encontrado.' });
  }

  const serviceType = await ServiceType.create({ name, averageValue, serviceId });
  await registerAudit({
    entity: 'ServiceType',
    entityId: serviceType.id,
    action: 'create',
    performedBy: req.user.email,
    payload: { name, averageValue, serviceId },
  });
  return res.status(201).json(serviceType);
}

export async function updateServiceType(req, res) {
  const { serviceTypeId } = req.params;
  const { name, averageValue } = req.body;
  const serviceType = await ServiceType.findByPk(serviceTypeId);
  if (!serviceType) {
    return res.status(404).json({ message: 'Tipo de serviço não encontrado.' });
  }

  await serviceType.update({ name, averageValue });
  await registerAudit({
    entity: 'ServiceType',
    entityId: serviceType.id,
    action: 'update',
    performedBy: req.user.email,
    payload: { name, averageValue },
  });
  return res.json(serviceType);
}

export async function deleteServiceType(req, res) {
  const { serviceTypeId } = req.params;
  const serviceType = await ServiceType.findByPk(serviceTypeId);
  if (!serviceType) {
    return res.status(404).json({ message: 'Tipo de serviço não encontrado.' });
  }

  const hasQuotations = await serviceType.countQuotations();
  if (hasQuotations > 0) {
    return res.status(400).json({ message: 'Tipo de serviço não pode ser removido pois está vinculado a cotações.' });
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
