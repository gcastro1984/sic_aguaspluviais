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

const Alerta = AlertModel(sequelize, DataTypes);
const LeituraSensor = LeituraSensorModel(sequelize, DataTypes);
const NivelAlerta = NivelAlertaModel(sequelize, DataTypes);
const Sensor = SensorModel(sequelize, DataTypes);


// Sync the models with the database
try {
    await sequelize.sync(); // use { force: true } to drop and recreate tables on every sync (use with caution in production)
    console.log("All models were synchronized successfully.");
} catch (error) {
    console.error("Error synchronizing models:", error);
    process.exit(1);
}   


// export the models for use in other modules
export { Alerta, LeituraSensor, NivelAlerta, Sensor };
