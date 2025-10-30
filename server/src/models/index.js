import User from './User.js';
import Supplier from './Supplier.js';
import Service from './Service.js';
import ServiceType from './ServiceType.js';
import Quotation, { STATUSES } from './Quotation.js';
import QuotationSupplier from './QuotationSupplier.js';
import QuotationServiceType from './QuotationServiceType.js';
import QuotationStatusHistory from './QuotationStatusHistory.js';
import AuditLog from './AuditLog.js';
import Patient from './Patient.js';

Service.hasMany(ServiceType, {
  foreignKey: { name: 'serviceId', field: 'service_id', allowNull: false },
  onDelete: 'CASCADE',
});
ServiceType.belongsTo(Service, {
  foreignKey: { name: 'serviceId', field: 'service_id', allowNull: false },
});

Quotation.belongsTo(Patient, {
  foreignKey: { name: 'patientId', field: 'patient_id', allowNull: false },
});
Patient.hasMany(Quotation, {
  foreignKey: { name: 'patientId', field: 'patient_id', allowNull: false },
});

Quotation.belongsToMany(Supplier, { through: QuotationSupplier });
Supplier.belongsToMany(Quotation, { through: QuotationSupplier });

Quotation.belongsToMany(ServiceType, { through: QuotationServiceType });
ServiceType.belongsToMany(Quotation, { through: QuotationServiceType });

Quotation.belongsTo(Supplier, {
  as: 'authorizedSupplier',
  foreignKey: { name: 'authorizedSupplierId', field: 'authorized_supplier_id', allowNull: true },
});
Supplier.hasMany(Quotation, {
  as: 'authorizedQuotations',
  foreignKey: { name: 'authorizedSupplierId', field: 'authorized_supplier_id', allowNull: true },
});

Quotation.hasMany(QuotationStatusHistory, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
QuotationStatusHistory.belongsTo(Quotation);

QuotationStatusHistory.belongsTo(User, { as: 'changedBy', foreignKey: { name: 'changed_by', allowNull: false } });
User.hasMany(QuotationStatusHistory, { as: 'statusChanges', foreignKey: 'changed_by' });

export {
  AuditLog,
  Quotation,
  QuotationServiceType,
  QuotationStatusHistory,
  QuotationSupplier,
  Patient,
  Service,
  ServiceType,
  Supplier,
  STATUSES,
  User,
};
