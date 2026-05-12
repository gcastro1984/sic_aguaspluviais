export default (sequelize, DataTypes) =>
  sequelize.define('alerta_plano_acao', {

    idalerta: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },

    idplano_acao: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },

    estado: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },

    responsavel: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },

    data_inicio: {
      type: DataTypes.DATE,
      allowNull: true
    },

    data_conclusao: {
      type: DataTypes.DATE,
      allowNull: true
    },

    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true
    }

  }, {
    tableName: 'alerta_plano_acao',
    timestamps: false
  });
