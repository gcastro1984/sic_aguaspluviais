// using sequelize with MySQL
// create a connection to the database using environment variables for configuration
import { Sequelize, DataTypes } from "sequelize";

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT
    }
);




//test the database connection

try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
} catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);

}

//add models here
import SensorModel from './sensores.model.js';
import AlertModel from './alerta.model.js';
import LeituraSensorModel from './leitura_sensor.model.js';
import NivelAlertaModel from './nivel_alerta.model.js';
import area_riscoModel from "./area_risco.model.js";
import InfraestruturaUrbanaModel from "./infraestrutura_urbana.model.js";
import PlanoAcaoModel from "./plano_acao.model.js";
import UtilizadorModel from "./utilizador.model.js";
import DestinatariosModel from "./destinatarios.model.js";
import AlertaPlanoAcaoModel from "./alerta_plano_acao.model.js";
import alertaDestinatarioModel from "./alerta_destinatario.model.js";
import criterio_alertaModel from "./criterio_alerta.model.js";
import PrevisaoMeteorologicaModel from "./previsao_meteorologica.model.js";
import NotificacaoModel from "./notificacao.model.js";

const Sensor = SensorModel(sequelize, DataTypes);
const InfraestruturaUrbana = InfraestruturaUrbanaModel(sequelize, DataTypes);
const LeituraSensor = LeituraSensorModel(sequelize, DataTypes);
const NivelAlerta = NivelAlertaModel(sequelize, DataTypes);
const AreaRisco = area_riscoModel(sequelize, DataTypes);
const CriterioAlerta = criterio_alertaModel(sequelize, DataTypes);
const Alerta = AlertModel(sequelize, DataTypes);
const PlanoAcao = PlanoAcaoModel(sequelize, DataTypes);
const AlertaPlanoAcao = AlertaPlanoAcaoModel(sequelize, DataTypes);
const Utilizador = UtilizadorModel(sequelize, DataTypes);
const Destinatarios = DestinatariosModel(sequelize, DataTypes);
const AlertaDestinatario = alertaDestinatarioModel(sequelize, DataTypes);
const PrevisaoMeteorologica = PrevisaoMeteorologicaModel(sequelize, DataTypes);
const Notificacao = NotificacaoModel(sequelize, DataTypes);




// define associations between models here if needed


// SENSOR → LEITURAS
Sensor.hasMany(LeituraSensor, {
    foreignKey: 'idsensor',
    onDelete: 'CASCADE'
});

LeituraSensor.belongsTo(Sensor, {
    foreignKey: 'idsensor'
});


// LEITURA → ALERTA (1:1)
LeituraSensor.hasOne(Alerta, {
    foreignKey: 'idleitura_sensor',
    onDelete: 'CASCADE'
});

Alerta.belongsTo(LeituraSensor, {
    foreignKey: 'idleitura_sensor'
});



// NÍVEL ALERTA → ALERTAS
NivelAlerta.hasMany(Alerta, {
    foreignKey: 'idnivel_alerta'
});

Alerta.belongsTo(NivelAlerta, {
    foreignKey: 'idnivel_alerta'
});

AreaRisco.hasMany(Alerta, {
    foreignKey: 'idarea_risco'
});

Alerta.belongsTo(AreaRisco, {
    foreignKey: 'idarea_risco'
});

InfraestruturaUrbana.hasMany(Alerta, {
    foreignKey: 'idinfraestrutura_urbana'
});
Alerta.belongsTo(InfraestruturaUrbana, {
    foreignKey: 'idinfraestrutura_urbana'
});


AlertaPlanoAcao.belongsTo(Alerta, {
    foreignKey: 'idalerta'
});

AlertaPlanoAcao.belongsTo(PlanoAcao, {
    foreignKey: 'idplano_acao'
});

Alerta.hasMany(AlertaPlanoAcao, {
    foreignKey: 'idalerta'
});

PlanoAcao.hasMany(AlertaPlanoAcao, {
    foreignKey: 'idplano_acao'
});

Alerta.belongsToMany(Destinatarios, {
    through: AlertaDestinatario,
    foreignKey: 'idalerta',
    otherKey: 'iddestinatario'
});

Destinatarios.belongsToMany(Alerta, {
    through: AlertaDestinatario,
    foreignKey: 'iddestinatario',
    otherKey: 'idalerta'
});

NivelAlerta.hasMany(CriterioAlerta, {
    foreignKey: 'idnivel_alerta'
});

CriterioAlerta.belongsTo(NivelAlerta, {
    foreignKey: 'idnivel_alerta'
});


// SENSOR → INFRAESTRUTURA
Sensor.belongsTo(InfraestruturaUrbana, {
    foreignKey: 'idinfraestrutura_urbana'
});

InfraestruturaUrbana.hasMany(Sensor, {
    foreignKey: 'idinfraestrutura_urbana'
});


// INFRAESTRUTURA → AREA
InfraestruturaUrbana.belongsTo(AreaRisco, {
    foreignKey: 'idarea_risco'
});

AreaRisco.hasMany(InfraestruturaUrbana, {
    foreignKey: 'idarea_risco'
});


// AREA RISCO → PREVISAO METEOROLOGICA
AreaRisco.hasMany(PrevisaoMeteorologica, {
    foreignKey: 'idarea_risco',
    onDelete: 'CASCADE'
});

PrevisaoMeteorologica.belongsTo(AreaRisco, {
    foreignKey: 'idarea_risco'
});

// NOTIFICACAO -> ALERTA / DESTINATARIO / SENSOR
Notificacao.belongsTo(Alerta, {
    foreignKey: 'idalerta'
});

Alerta.hasMany(Notificacao, {
    foreignKey: 'idalerta'
});

Notificacao.belongsTo(Destinatarios, {
    foreignKey: 'iddestinatario'
});

Destinatarios.hasMany(Notificacao, {
    foreignKey: 'iddestinatario'
});

// Notificações de calibração/manutenção ligadas diretamente ao sensor
Notificacao.belongsTo(Sensor, {
    foreignKey: 'idsensor',
    constraints: false   // a FK é opcional — não existe na tabela de alertas normais
});

Sensor.hasMany(Notificacao, {
    foreignKey: 'idsensor',
    constraints: false
});

// Sync the models with the database
try {
    await sequelize.sync(); // use { force: true } to drop and recreate tables on every sync (use with caution in production)
    console.log("All models were synchronized successfully.");
} catch (error) {
    console.error("Error synchronizing models:", error);
    process.exit(1);
}





// export the models for use in other modules
export { Alerta, LeituraSensor, NivelAlerta, Sensor, AreaRisco, InfraestruturaUrbana, PlanoAcao, Utilizador, Destinatarios, PrevisaoMeteorologica, CriterioAlerta, AlertaPlanoAcao, AlertaDestinatario, Notificacao };
