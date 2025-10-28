import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class QuotationServiceType extends Model {}

QuotationServiceType.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
  },
  {
    sequelize,
    modelName: 'QuotationServiceType',
    tableName: 'quotation_service_types',
    underscored: true,
  }
);

export default QuotationServiceType;
