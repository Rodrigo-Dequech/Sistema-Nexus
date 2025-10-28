import User from './User.js';
import Supplier from './Supplier.js';
import Service from './Service.js';
import ServiceType from './ServiceType.js';
import Quotation, { STATUSES } from './Quotation.js';
import QuotationSupplier from './QuotationSupplier.js';
import QuotationServiceType from './QuotationServiceType.js';
import QuotationStatusHistory from './QuotationStatusHistory.js';
import AuditLog from './AuditLog.js';

Service.hasMany(ServiceType, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
ServiceType.belongsTo(Service);

Quotation.belongsToMany(Supplier, { through: QuotationSupplier });
Supplier.belongsToMany(Quotation, { through: QuotationSupplier });

Quotation.belongsToMany(ServiceType, { through: QuotationServiceType });
ServiceType.belongsToMany(Quotation, { through: QuotationServiceType });

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
  Service,
  ServiceType,
  Supplier,
  STATUSES,
  User,
};
