export default (sequelize, DataTypes) => sequelize.define('leitura_sensor', { 

    leitura: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    id_sensor: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

});