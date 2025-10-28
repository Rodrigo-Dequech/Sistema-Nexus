import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class QuotationSupplier extends Model {}

QuotationSupplier.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
  },
  {
    sequelize,
    modelName: 'QuotationSupplier',
    tableName: 'quotation_suppliers',
    underscored: true,
  }
);

export default QuotationSupplier;
