import PDFDocument from 'pdfkit';
import { v4 as uuid } from 'uuid';
import {
  Patient,
  Quotation,
  QuotationStatusHistory,
  Service,
  ServiceType,
  Supplier,
  STATUSES,
  User,
} from '../models/index.js';
import { registerAudit } from '../services/auditService.js';
import { sendEmail } from '../utils/sendEmail.js';
import { buildNewQuotationEmail } from '../utils/templates/newQuotationEmail.js';

const SERVICE_TYPE_LABELS = {
  professional: 'Atendimento Profissional / Diarias',
  equipment: 'Equipamentos / Taxas',
  medication: 'Medicamentos / Materiais',
};

function formatQuotation(quotation) {
  if (!quotation) return null;
  return {
    id: quotation.id,
    number: quotation.number,
    status: quotation.status,
    createdAt: quotation.createdAt,
    updatedAt: quotation.updatedAt,
    patient: quotation.Patient
      ? {
          id: quotation.Patient.id,
          name: quotation.Patient.name,
          cpf: quotation.Patient.cpf,
          insurance: quotation.Patient.insurance,
          cardNumber: quotation.Patient.cardNumber,
          address: quotation.Patient.address,
        }
      : null,
    suppliers: quotation.Suppliers?.map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
      document: supplier.document,
      email: supplier.email,
      phone: supplier.phone,
    })),
    authorizedSupplier: quotation.authorizedSupplier
      ? {
          id: quotation.authorizedSupplier.id,
          name: quotation.authorizedSupplier.name,
          document: quotation.authorizedSupplier.document,
          email: quotation.authorizedSupplier.email,
          phone: quotation.authorizedSupplier.phone,
        }
      : null,
    serviceTypes: quotation.ServiceTypes?.map((type) => ({
      id: type.id,
      name: type.name,
      averageValue: type.averageValue,
      category: type.category,
      service: type.Service ? { id: type.Service.id, name: type.Service.name } : null,
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
  { model: Patient },
  { model: Supplier },
  { model: Supplier, as: 'authorizedSupplier' },
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
    return res.status(404).json({ message: 'Cotacao nao encontrada.' });
  }

  return res.json(formatQuotation(quotation));
}

export async function createQuotation(req, res) {
  const { supplierIds = [], serviceTypeIds = [], patientId } = req.body;

  if (!patientId) {
    return res.status(400).json({ message: 'Paciente e obrigatorio para a cotacao.' });
  }
  if (supplierIds.length === 0 || serviceTypeIds.length === 0) {
    return res.status(400).json({ message: 'Cotacao deve conter pelo menos um fornecedor e um tipo de servico.' });
  }

  const patient = await Patient.findByPk(patientId);
  if (!patient) {
    return res.status(404).json({ message: 'Paciente nao encontrado.' });
  }

  const uniqueSupplierIds = [...new Set(supplierIds)];
  if (uniqueSupplierIds.length !== supplierIds.length) {
    return res.status(400).json({ message: 'Fornecedor nao pode ser adicionado mais de uma vez na mesma cotacao.' });
  }

  const uniqueServiceTypeIds = [...new Set(serviceTypeIds)];
  if (uniqueServiceTypeIds.length !== serviceTypeIds.length) {
    return res.status(400).json({ message: 'Tipo de servico duplicado na cotacao.' });
  }

  const number = `COT-${new Date().getFullYear()}-${uuid().split('-')[0].toUpperCase()}`;
  const quotation = await Quotation.create({ number, patientId });
  await quotation.setSuppliers(uniqueSupplierIds);
  await quotation.setServiceTypes(uniqueServiceTypeIds);

  await registerAudit({
    entity: 'Quotation',
    entityId: quotation.id,
    action: 'create',
    performedBy: req.user.email,
    payload: { supplierIds: uniqueSupplierIds, serviceTypeIds: uniqueServiceTypeIds, patientId },
  });

  const createdQuotation = await Quotation.findByPk(quotation.id, { include: quotationIncludes });

  const suppliers = await Supplier.findAll({
    where: { id: uniqueSupplierIds },
    attributes: ['id', 'name', 'email'],
  });

  const quotationLinkBase = process.env.APP_BASE_URL || 'http://localhost:5173';
  const quotationLink = `${quotationLinkBase}/cotacoes/${quotation.id}`;

  await Promise.allSettled(
    suppliers
      .filter((supplier) => supplier.email)
      .map((supplier) => {
        const html = buildNewQuotationEmail({
          supplierName: supplier.name,
          quotationId: quotation.number,
          quotationDate: createdQuotation.createdAt,
          quotationLink,
        });

        return sendEmail({
          to: supplier.email,
          subject: 'Nova cotacao disponivel - Portal de Cotacoes',
          html,
        });
      })
  );

  return res.status(201).json(formatQuotation(createdQuotation));
}

export async function updateQuotationStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Status invalido.' });
  }
  if (status === 'autorizado') {
    return res.status(400).json({ message: 'Selecione o fornecedor vencedor para autorizar a cotacao.' });
  }

  const quotation = await Quotation.findByPk(id);
  if (!quotation) {
    return res.status(404).json({ message: 'Cotacao nao encontrada.' });
  }
  if (quotation.status === 'autorizado') {
    return res.status(400).json({ message: 'Cotacao ja autorizada e nao permite mudanca de status.' });
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

export async function authorizeQuotation(req, res) {
  const { id } = req.params;
  const { supplierId } = req.body;

  if (!supplierId) {
    return res.status(400).json({ message: 'Fornecedor vencedor e obrigatorio.' });
  }

  const quotation = await Quotation.findByPk(id, { include: quotationIncludes });
  if (!quotation) {
    return res.status(404).json({ message: 'Cotacao nao encontrada.' });
  }

  if (quotation.status === 'autorizado') {
    return res.status(400).json({ message: 'Cotacao ja esta autorizada.' });
  }

  const supplierParticipates = quotation.Suppliers?.some((supplier) => supplier.id === supplierId);
  if (!supplierParticipates) {
    return res.status(400).json({ message: 'Fornecedor nao faz parte desta cotacao.' });
  }

  const previousStatus = quotation.status;
  await quotation.update({ status: 'autorizado', authorizedSupplierId: supplierId });
  await QuotationStatusHistory.create({
    quotationId: id,
    fromStatus: previousStatus,
    toStatus: 'autorizado',
    changed_by: req.user.id,
  });

  await registerAudit({
    entity: 'Quotation',
    entityId: id,
    action: 'authorize',
    performedBy: req.user.email,
    payload: { authorizedSupplierId: supplierId },
  });

  const updatedQuotation = await Quotation.findByPk(id, { include: quotationIncludes });
  return res.json(formatQuotation(updatedQuotation));
}

function groupItemsByCategory(serviceTypes = []) {
  return serviceTypes.reduce((acc, item) => {
    const key = item.category || 'professional';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
}

export async function generateQuotationBudget(req, res) {
  const { id } = req.params;
  const quotation = await Quotation.findByPk(id, { include: quotationIncludes });
  if (!quotation) {
    return res.status(404).json({ message: 'Cotacao nao encontrada.' });
  }

  if (quotation.status !== 'autorizado') {
    return res.status(400).json({ message: 'Cotacao precisa estar autorizada para gerar o orcamento.' });
  }

  const formatted = formatQuotation(quotation);
  const grouped = groupItemsByCategory(formatted.serviceTypes || []);
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const filename = `ORCAMENTO_${formatted.number}_${formatted.patient?.name || 'PACIENTE'}.pdf`.replace(
    /\s+/g,
    '_'
  );

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

  doc.pipe(res);

  doc
    .fontSize(18)
    .fillColor('#1f2937')
    .text('ORCAMENTO', { align: 'center' })
    .moveDown(1.5);

  doc
    .fontSize(12)
    .fillColor('#111827')
    .text(`Numero da Cotacao: ${formatted.number}`)
    .text(`Data de Emissao: ${new Date(formatted.createdAt).toLocaleDateString('pt-BR')}`)
    .moveDown(1);

  doc
    .fontSize(12)
    .text('Dados do Paciente', { underline: true })
    .moveDown(0.5)
    .fontSize(11);

  doc.text(`Nome: ${formatted.patient?.name || 'Nao informado'}`);
  doc.text(`CPF: ${formatted.patient?.cpf || 'Nao informado'}`);
  doc.text(`Convenio: ${formatted.patient?.insurance || 'Nao informado'}`);
  doc.text(`Carteirinha: ${formatted.patient?.cardNumber || 'Nao informado'}`);
  doc.text(`Endereco: ${formatted.patient?.address || 'Nao informado'}`).moveDown(1);

  doc
    .fontSize(12)
    .text('Fornecedor Autorizado', { underline: true })
    .moveDown(0.5)
    .fontSize(11);

  doc.text(`Nome: ${formatted.authorizedSupplier?.name || 'Nao informado'}`);
  doc.text(`Documento: ${formatted.authorizedSupplier?.document || 'Nao informado'}`);
  doc.text(`Contato: ${formatted.authorizedSupplier?.email || 'Nao informado'}`);
  doc.moveDown(1);

  let totalGeneral = 0;

  Object.entries(grouped).forEach(([category, items]) => {
    const categoryLabel = SERVICE_TYPE_LABELS[category] || SERVICE_TYPE_LABELS.professional;
    doc
      .fontSize(12)
      .fillColor('#1f2937')
      .text(categoryLabel, { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .fillColor('#111827')
      .text('Item', 40, doc.y, { continued: true })
      .text('Descricao', 140, doc.y, { continued: true })
      .text('Valor Unitario', 320, doc.y, { continued: true })
      .text('Qtde', 430, doc.y, { continued: true })
      .text('Valor Total', 480, doc.y)
      .moveDown(0.4);

    let subtotal = 0;
    items.forEach((item, index) => {
      const unitValue = Number(item.averageValue || 0);
      const quantity = item.quantity || 1;
      const total = unitValue * quantity;
      subtotal += total;

      doc
        .fontSize(10)
        .text(String(index + 1), 40, doc.y, { continued: true })
        .text(item.name, 140, doc.y, { continued: true })
        .text(unitValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 320, doc.y, {
          continued: true,
        })
        .text(String(quantity), 430, doc.y, { continued: true })
        .text(total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 480, doc.y)
        .moveDown(0.3);
    });

    doc
      .fontSize(11)
      .fillColor('#111827')
      .text(
        `Subtotal ${categoryLabel}: ${subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
        { align: 'right' }
      )
      .moveDown(1);

    totalGeneral += subtotal;
  });

  doc
    .fontSize(12)
    .fillColor('#1f2937')
    .text(
      `Total do Orcamento: ${totalGeneral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      { align: 'right' }
    )
    .moveDown(1.5);

  doc
    .fontSize(10)
    .fillColor('#6b7280')
    .text(
      'Este orcamento foi gerado automaticamente pelo Portal de Cotacoes. Para validacao, utilize a assinatura digital do responsavel tecnico.',
      { align: 'center' }
    );

  doc.end();
}

async function getQuotationById(id) {
  const quotation = await Quotation.findByPk(id, { include: quotationIncludes });
  return formatQuotation(quotation);
}

