import { v4 as uuid } from 'uuid';
import {
  Quotation,
  QuotationStatusHistory,
  Service,
  ServiceType,
  Supplier,
  STATUSES,
  User,
} from '../models/index.js';
import { registerAudit } from '../services/auditService.js';

function formatQuotation(quotation) {
  if (!quotation) return null;
  return {
    id: quotation.id,
    number: quotation.number,
    status: quotation.status,
    createdAt: quotation.createdAt,
    updatedAt: quotation.updatedAt,
    suppliers: quotation.Suppliers?.map((s) => ({
      id: s.id,
      name: s.name,
      document: s.document,
      email: s.email,
      phone: s.phone,
    })),
    serviceTypes: quotation.ServiceTypes?.map((st) => ({
      id: st.id,
      name: st.name,
      averageValue: st.averageValue,
      service: st.Service ? { id: st.Service.id, name: st.Service.name } : null,
    })),
    statusHistory: quotation.QuotationStatusHistories?.sort(
      (a, b) => new Date(b.changedAt) - new Date(a.changedAt)
    ).map((history) => ({
      id: history.id,
      fromStatus: history.fromStatus,
      toStatus: history.toStatus,
      changedAt: history.changedAt,
      changedBy: history.changedBy ? { id: history.changedBy.id, name: history.changedBy.name } : null,
    })),
  };
}

const quotationIncludes = [
  { model: Supplier },
  { model: ServiceType, include: [{ model: Service }] },
  { model: QuotationStatusHistory, include: [{ model: User, as: 'changedBy' }] },
];

export async function listQuotations(req, res) {
  const quotations = await Quotation.findAll({
    order: [
      ['createdAt', 'DESC'],
      [QuotationStatusHistory, 'changed_at', 'DESC'],
    ],
    include: quotationIncludes,
  });

  return res.json(quotations.map(formatQuotation));
}

export async function getQuotation(req, res) {
  const { id } = req.params;
  const quotation = await Quotation.findByPk(id, { include: quotationIncludes });

  if (!quotation) {
    return res.status(404).json({ message: 'Cotação não encontrada.' });
  }

  return res.json(formatQuotation(quotation));
}

export async function createQuotation(req, res) {
  const { supplierIds = [], serviceTypeIds = [] } = req.body;
  if (supplierIds.length === 0 || serviceTypeIds.length === 0) {
    return res.status(400).json({ message: 'Cotação deve conter pelo menos um fornecedor e um tipo de serviço.' });
  }

  const uniqueSupplierIds = [...new Set(supplierIds)];
  if (uniqueSupplierIds.length !== supplierIds.length) {
    return res.status(400).json({ message: 'Fornecedor não pode ser adicionado mais de uma vez na mesma cotação.' });
  }

  const uniqueServiceTypeIds = [...new Set(serviceTypeIds)];
  if (uniqueServiceTypeIds.length !== serviceTypeIds.length) {
    return res.status(400).json({ message: 'Tipo de serviço duplicado na cotação.' });
  }

  const number = `COT-${new Date().getFullYear()}-${uuid().split('-')[0].toUpperCase()}`;
  const quotation = await Quotation.create({ number });
  await quotation.setSuppliers(uniqueSupplierIds);
  await quotation.setServiceTypes(uniqueServiceTypeIds);

  await registerAudit({
    entity: 'Quotation',
    entityId: quotation.id,
    action: 'create',
    performedBy: req.user.email,
    payload: { supplierIds: uniqueSupplierIds, serviceTypeIds: uniqueServiceTypeIds },
  });

  const createdQuotation = await Quotation.findByPk(quotation.id, { include: quotationIncludes });

  return res.status(201).json(formatQuotation(createdQuotation));
}

export async function updateQuotationStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Status inválido.' });
  }

  const quotation = await Quotation.findByPk(id);
  if (!quotation) {
    return res.status(404).json({ message: 'Cotação não encontrada.' });
  }

  const previousStatus = quotation.status;
  if (previousStatus === status) {
    return res.json(await getQuotationById(id));
  }

  await quotation.update({ status });
  await QuotationStatusHistory.create({
    quotationId: id,
    fromStatus: previousStatus,
    toStatus: status,
    changed_by: req.user.id,
  });

  await registerAudit({
    entity: 'Quotation',
    entityId: id,
    action: 'update-status',
    performedBy: req.user.email,
    payload: { fromStatus: previousStatus, toStatus: status },
  });

  const quotationWithRelations = await Quotation.findByPk(id, { include: quotationIncludes });

  return res.json(formatQuotation(quotationWithRelations));
}

async function getQuotationById(id) {
  const quotation = await Quotation.findByPk(id, { include: quotationIncludes });
  return formatQuotation(quotation);
}
