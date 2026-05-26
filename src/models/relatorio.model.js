export default (sequelize, DataTypes) => sequelize.define('relatorio', {

    idrelatorio: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    data: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    idutilizador: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'utilizador',
            key: 'idutilizador'
        }
    },
    idalerta: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'alerta',
            key: 'idalerta'
        }
    }

}, {
    tableName: 'relatorio',
    timestamps: false
});
