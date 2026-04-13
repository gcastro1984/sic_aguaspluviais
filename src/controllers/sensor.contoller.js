

import { sensores } from '../models/sensores.model.js';

export const getAllSensors = (req, res) => {
    res.status(200).json(sensores);
}


export const createNewSensor = (req, res) => {

    const { tipo, localizacao, status, infraUrb, dataProxmanutencao } = req.body;



    const newSensor = {
        id: sensores.length + 1,
        tipo,
        localizacao,
        status: status ? status : 'offline',
        infraUrb,
        dataProxmanutencao
    };

    sensores.push(newSensor);

    res.status(201).json(newSensor);
}



export const updateStatusSensor = (req, res) => {
    const { id } = req.params.id;
    const { status } = req.body;

    // Validar se o status é válido
    const validStatus = ['online', 'offline', 'manutencao'];
    if (!validStatus.includes(status)) {
        const error = new Error('Status inválido. Status deve ser "online", "offline" ou "manutencao".');
        error.status = 400;
        throw error;
    }

    //Validar se o sensor existe
    const sensor = sensores.find(s => s.id === parseInt(id));

    if (!sensor) {
        const error = new Error('Sensor não encontrado');
        error.status = 404;
        throw error;
    }

    sensor.status = status;
    res.status(200).json(sensor);
}

