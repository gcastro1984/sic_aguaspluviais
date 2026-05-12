
export default (sequelize, DataTypes) =>
  sequelize.define('sensor', {

    idsensor: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },


    tipo: {
      type: DataTypes.STRING,
      allowNull: false
    },

    localizacao: {
      type: DataTypes.STRING,
      allowNull: false
    },

    //  (online/offline/manutencao)
    status: {
      type: DataTypes.ENUM('online', 'offline', 'manutencao'),
      allowNull: false,
      defaultValue: 'online'
    },

    // 
    idinfraestrutura_urbana: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    data_proxima_manutencao: {
      type: DataTypes.DATE,
      allowNull: true
    }

  }, {
    tableName: 'sensor',
    timestamps: false

  });
