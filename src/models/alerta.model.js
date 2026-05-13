export default (sequelize, DataTypes) => sequelize.define('alerta', {

    idalerta: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    idnivel_alerta: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'nivel_alerta',
            key: 'idnivel_alerta'
        }
    },
    idarea_risco: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'area_risco',
            key: 'idarea_risco'
        }
    },

    idinfraestrutura_urbana: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'infraestrutura_urbana',
            key: 'idinfraestrutura_urbana'
        }
    },

    idleitura_sensor: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'leitura_sensor',
            key: 'idleitura_sensor'
        }
    },

    data_alerta: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    descricao: {
        type: DataTypes.STRING,
        allowNull: false
    },
    score_risco: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: {
            min: 0,
            max: 100
        }
    },
    estado: {
        type: DataTypes.ENUM('ativo', 'registado', 'resolvido', 'cancelado', 'pendente', 'em_execucao', 'concluido'),
        allowNull: false,
        defaultValue: 'ativo'
    }

},
    {
        tableName: 'alerta',
        timestamps: false
    },);