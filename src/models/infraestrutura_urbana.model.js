export default (sequelize, DataTypes) => sequelize.define('infraestrutura_urbana', {

    idinfraestrutura_urbana: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nome: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    tipo: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    localizacao: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    idarea_risco: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'area_risco',
            key: 'idarea_risco'
        }
    },
},
    {
    tableName: 'infraestrutura_urbana',
    timestamps: false
    },

);
