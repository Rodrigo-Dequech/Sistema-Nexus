import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Service extends Model {}

Service.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    modelName: 'Service',
    tableName: 'services',
    underscored: true,
  }
);

export default Service;
