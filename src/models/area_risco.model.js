export default (sequelize, DataTypes) => sequelize.define('area_risco', { 

    idarea_risco: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nome: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    localizacao: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    vulnerabilidade_base: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: true
    }

},
 {
    tableName: 'area_risco',
    timestamps: false
    },);