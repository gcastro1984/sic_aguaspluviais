// import Express
import express from 'express';
import 'dotenv/config';

import utilizadorRoutes from './src/routes/utilizador.routes.js';
import sensorRoutes from './src/routes/sensor.routes.js';
import alertasRoutes from './src/routes/alerta.routes.js';


// create Express application

const app = express();
const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3001;


app.use(express.json()); //enable parsing JSON body data



// sets the server response to a GET request on URI /

app.post('/login', utilizadorRoutes);
app.use('/sensores', sensorRoutes);
app.use('/alertas', alertasRoutes);

// server creation and listening for any incoming requests
app.listen(port, host, (error) => {
console.log(`Server running on  http://${host}:${port}/`)
})