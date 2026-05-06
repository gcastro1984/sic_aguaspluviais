export default (sequelize, DataTypes) => sequelize.define('sensor', { 

    tipo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    localizacao: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    idinfrastrutura_urbana: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    data_proxima_manutencao: {
        type: DataTypes.DATE,
        allowNull: false,
    }   

});