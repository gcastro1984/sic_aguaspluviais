export default (sequelize, DataTypes) =>
    sequelize.define('alerta_destinatario', {

        idalerta: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            references: {
                model: 'alerta',
                key: 'idalerta'
            }
        },

        iddestinatario: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            references: {
                model: 'destinatario',
                key: 'iddestinatario'
            }
        }

    }, {
        tableName: 'alerta_destinatario',
        timestamps: false
    });
