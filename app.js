// import Express
import express from 'express';
import utilizadorRoutes from './src/routes/utilizador.routes.js';
import sensorRoutes from './src/routes/sensor.routes.js';


// create Express application

const app = express();
const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3001;


app.use(express.json()); //enable parsing JSON body data


// sets the server response to a GET request on URI /

app.post('/login', utilizadorRoutes);
app.use('/sensores', sensorRoutes);
app.get('/', (req, res) => {
    
res.send('<html><body><h1>Hello World</h1></body></html>');
})
app
// server creation and listening for any incoming requests
app.listen(port, host, (error) => {
console.log(`App listening at http://${host}:${port}/`)
})