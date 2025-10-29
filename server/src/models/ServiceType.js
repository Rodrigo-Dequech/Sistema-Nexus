import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServiceType extends Model {}

ServiceType.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    averageValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'average_value',
    },
    serviceId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'service_id',
    },
  },
  {
    sequelize,
    modelName: 'ServiceType',
    tableName: 'service_types',
    underscored: true,
  }
);

export default ServiceType;
