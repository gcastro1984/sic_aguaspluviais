

import { Sensor } from '../models/db.config.js';
import { sequelizeValidationError, validationError, notFoundError, genericError } from '../utils/error.utils.js';


export const getAllSensors = async (req, res, next) => {
    try {
        const sensores = await Sensor.findAll();
        return res.status(200).json(sensores);
    } catch (error) {
        return next(genericError(error.message));
    }
}

export const createNewSensor = async (req, res, next) => {
    try {
        const {
            tipo,
            localizacao,
            status,
            idinfraestrutura_urbana,
            data_proxima_manutencao,
        } = req.body;

        if (!tipo || !localizacao) {
            return next(validationError({
                tipo: 'Campo tipo é obrigatório.',
                localizacao: 'Campo localizacao é obrigatório.'
            }));
        }

        const newSensor = await Sensor.create({
            tipo,
            localizacao,
            status: status ?? 'offline',
            idinfraestrutura_urbana: idinfraestrutura_urbana ??  null,
            data_proxima_manutencao: data_proxima_manutencao ??  null
        });

        return res.status(201).json(newSensor);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return next(sequelizeValidationError(error.errors));
        }
        return next(genericError(error.message));
    }
}



export const getSensorById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const sensor = await Sensor.findByPk(id);
        if (!sensor) {
            return next(notFoundError('sensor', id));
        }

        return res.status(200).json(sensor);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return next(sequelizeValidationError(error.errors));
        }
        return next(genericError(error.message));
    }
}

export const updateStatusSensor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatus = ['online', 'offline', 'manutencao'];
        if (!validStatus.includes(status)) {
            return next(validationError({
                status: 'Status inválido. Use online, offline ou manutencao.'
            }));
        }

        const sensor = await Sensor.findByPk(id);
        if (!sensor) {
            return next(notFoundError('sensor', id));
        }

        await sensor.update({ status });
        return res.status(200).json(sensor);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return next(sequelizeValidationError(error.errors));
        }
        return next(genericError(error.message));
    }
}

