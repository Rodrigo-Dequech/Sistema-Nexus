import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

const STATUSES = ['em_cotacao', 'em_analise', 'negada', 'autorizado'];

class Quotation extends Model {}

Quotation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM(...STATUSES),
      defaultValue: 'em_cotacao',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    modelName: 'Quotation',
    tableName: 'quotations',
    underscored: true,
    timestamps: true,
  }
);

export { STATUSES };
export default Quotation;
