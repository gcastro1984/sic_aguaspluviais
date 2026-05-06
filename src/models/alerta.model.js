export default (sequelize, DataTypes) => sequelize.define('alerta', { 

    descricao: {
        type: DataTypes.STRING,
        allowNull: false
    },
    idnivel_alerta: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    idleitura_sensor: {
        type: DataTypes.INTEGER,
        allowNull: false
    }

});