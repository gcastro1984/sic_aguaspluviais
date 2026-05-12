export default (sequelize, DataTypes) => sequelize.define('leitura_sensor', {

    idleitura_sensor: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    // FK para Sensor
    idsensor: {
        type: DataTypes.INTEGER,
        allowNull: false,


references: {
  model: 'sensor',  
  key: 'idsensor'
}

    },

    // exemplo:
    // nivel_agua
    // precipitacao
    // temperatura

    tipo_variavel: {
        type: DataTypes.STRING,
        allowNull: false
    },

    // valor da leitura
    valor: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false
    },

    // mm, %, ºC, etc
    unidade: {
        type: DataTypes.STRING,
        allowNull: false
    },

    // instante observado no sensor
    data_observacao: {
        type: DataTypes.DATE,
        allowNull: false
    },

    // instante registado na BD
    data_registo: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },

    // origem do dado
    // sensor_fisico, simulador, API_IPMA...
    origem_dado: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // qualidade da leitura
    // boa, media, fraca...
    qualidade_dado: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "boa"
    },

    // leitura validada?
    validada: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }

},
{
    tableName: 'leitura_sensor',

    timestamps: false
});