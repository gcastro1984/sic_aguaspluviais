export default (sequelize, DataTypes) =>
    sequelize.define('notificacao', {

        idnotificacao: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },

        idalerta: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        iddestinatario: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        canal: {
            type: DataTypes.STRING(50),
            allowNull: false
        },

        data_envio: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },

        estado_envio: {
            type: DataTypes.STRING(50),
            allowNull: false
        },

        data_confirmacao: {
            type: DataTypes.DATE,
            allowNull: true
        },

        mensagem: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        erro_envio: {
            type: DataTypes.TEXT,
            allowNull: true
        }

    }, {
        tableName: 'notificacao',
        timestamps: false
    });
