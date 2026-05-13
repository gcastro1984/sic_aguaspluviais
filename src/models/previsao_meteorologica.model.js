export default (sequelize, DataTypes) => sequelize.define('previsao_meteorologica', {

    idprevisao: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
    fonte: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    data_emissao: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    data_inicio_previsao: {
        type: DataTypes.DATE,
        allowNull: false
    },
    data_fim_previsao: {
        type: DataTypes.DATE,
        allowNull: false
    },
    horizonte_horas: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    precipitacao_prevista_mm: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    confianca: {
        type: DataTypes.DECIMAL(5, 3),
        allowNull: false,
        validate: {
            min: 0,
            max: 1
        }
    }
},{
    tableName: 'previsao_meteorologica',
    timestamps: false

});
