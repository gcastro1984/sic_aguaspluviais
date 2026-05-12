export default (sequelize, DataTypes) => sequelize.define('plano_acao', {

    idplano_acao: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    tipo_destinatario: {
        type: DataTypes.STRING(100),
        allowNull: false
    }

},{
    tableName: 'plano_acao',
    timestamps: false
});