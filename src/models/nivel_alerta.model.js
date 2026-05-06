export default (sequelize, DataTypes) => sequelize.define('nivel_alerta', { 

    descricao: {
        type: DataTypes.STRING,
        allowNull: false
    },

});