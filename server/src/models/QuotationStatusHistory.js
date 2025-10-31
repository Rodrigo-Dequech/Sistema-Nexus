import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class QuotationStatusHistory extends Model {}

QuotationStatusHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fromStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'from_status',
    },
    toStatus: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'to_status',
    },
    changedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'changed_at',
    },
    quotationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'quotation_id',
    },
    changed_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'QuotationStatusHistory',
    tableName: 'quotation_status_history',
    underscored: true,
    timestamps: false,
  }
);

export default QuotationStatusHistory;
