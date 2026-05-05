export default (sequelize, DataTypes) => sequelize.define('alerta', { 

    descricao: {
        type: DataTypes.STRING,
        allowNull: false
    },

});