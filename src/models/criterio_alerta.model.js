
export default (sequelize, DataTypes) =>
  sequelize.define('criterio_alerta', {

    idcriterio: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },

    idnivel_alerta: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'nivel_alerta',
        key: 'idnivel_alerta'
      }
    },

    variavel: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },

    operador: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['<', '>', '>=', '<=', 'between']]
      }
    },

    limiar_min: {
      type: DataTypes.FLOAT,
      allowNull: true
    },

    limiar_max: {
      type: DataTypes.FLOAT,
      allowNull: true
    },

    janela_temporal_minutos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    descricao: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }

  }, {
    tableName: 'criterio_alerta',
    timestamps: false
  });
