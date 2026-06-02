
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
      allowNull: false
    },

    data_proxima_manutencao: {
      type: DataTypes.DATEONLY, // armazena só YYYY-MM-DD, sem hora/timezone
      allowNull: true
    }

  }, {
    tableName: 'sensor',
    timestamps: false

  });
