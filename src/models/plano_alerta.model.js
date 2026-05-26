export default (sequelize, DataTypes) =>
    sequelize.define('plano_alerta', {

        idplano_acao: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'plano_acao',
                key: 'idplano_acao'
            }
        },

        idnivel_alerta: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'nivel_alerta',
                key: 'idnivel_alerta'
            }
        }

    }, {
        tableName: 'plano_alerta',
        timestamps: false
    });
