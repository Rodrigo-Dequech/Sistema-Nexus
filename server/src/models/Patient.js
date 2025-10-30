import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Patient extends Model {}

Patient.init(
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
    cpf: {
      type: DataTypes.STRING(14),
      allowNull: false,
      unique: true,
    },
    insurance: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cardNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'card_number',
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Patient',
    tableName: 'patients',
    underscored: true,
  }
);

export default Patient;
