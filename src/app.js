// import Express
import express from 'express';

// create Express application

const app = express();
const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;


// sets the server response to a GET request on URI /
app.get('/', (req, res) => {
    
res.send('<html><body><h1>Hello World</h1></body></html>');
})

// server creation and listening for any incoming requests
app.listen(port, host, (error) => {
console.log(`App listening at http://${host}:${port}/`)
})