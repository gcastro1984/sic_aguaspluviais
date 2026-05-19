
export default (sequelize, DataTypes) =>
    sequelize.define('destinatario', {

        iddestinatario: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },

        tipo: {
            type: DataTypes.STRING(80),
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },

        nome: {
            type: DataTypes.STRING(150),
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },

        email: {
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
                notEmpty: true
            }
        },
        contato: {
            type: DataTypes.STRING(20),
            allowNull: true
        }

    }, {
        tableName: 'destinatario',
        timestamps: false
    });
