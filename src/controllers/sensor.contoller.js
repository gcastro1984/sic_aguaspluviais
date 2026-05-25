import { Sensor } from '../models/db.config.js';
import { sequelizeValidationError, validationError, notFoundError, genericError } from '../utils/error.utils.js';
import { getPagination, paginationMeta } from '../utils/pagination.utils.js';

const sensorLinks = (id) => ({
    self:   { href: `/sensores/${id}`,  method: 'GET' },
    update: { href: `/sensores/${id}`,  method: 'PATCH' },
    delete: { href: `/sensores/${id}`,  method: 'DELETE' }
});

export const getAllSensors = async (req, res, next) => {
    try {
        const { page, limit, offset } = getPagination(req.query);

        const { count, rows } = await Sensor.findAndCountAll({ limit, offset });

        const data = rows.map(s => ({ ...s.toJSON(), links: sensorLinks(s.idsensor) }));

        return res.status(200).json({
            data,
            pagination: paginationMeta(count, page, limit),
            links: { self: { href: '/sensores', method: 'GET' }, create: { href: '/sensores', method: 'POST' } }
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};

export const getSensorById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const sensor = await Sensor.findByPk(id);

        if (!sensor) return next(notFoundError('sensor', id));

        return res.status(200).json({
            data: sensor,
            links: { ...sensorLinks(id), allSensores: { href: '/sensores', method: 'GET' } }
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};

export const createNewSensor = async (req, res, next) => {
    try {
        const { tipo, localizacao, status, idinfraestrutura_urbana, data_proxima_manutencao } = req.body;

        if (!tipo || !localizacao)
            return next(validationError({ tipo: 'Campo tipo é obrigatório.', localizacao: 'Campo localizacao é obrigatório.' }));

        const newSensor = await Sensor.create({
            tipo,
            localizacao,
            status: status ?? 'offline',
            idinfraestrutura_urbana: idinfraestrutura_urbana ?? null,
            data_proxima_manutencao: data_proxima_manutencao ?? null
        });

        return res.status(201).json({
            data: newSensor,
            links: { ...sensorLinks(newSensor.idsensor), allSensores: { href: '/sensores', method: 'GET' } }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') return next(sequelizeValidationError(error.errors));
        return next(genericError(error.message));
    }
};

export const atualizarSensor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { tipo, localizacao, status, idinfraestrutura_urbana, data_proxima_manutencao } = req.body;

        const validStatus = ['online', 'offline', 'manutencao'];
        if (status !== undefined && !validStatus.includes(status))
            return next(validationError({ status: 'Status inválido. Use online, offline ou manutencao.' }));

        const sensor = await Sensor.findByPk(id);
        if (!sensor) return next(notFoundError('sensor', id));

        const updateData = {};
        if (tipo !== undefined) updateData.tipo = tipo;
        if (localizacao !== undefined) updateData.localizacao = localizacao;
        if (status !== undefined) updateData.status = status;
        if (idinfraestrutura_urbana !== undefined) updateData.idinfraestrutura_urbana = idinfraestrutura_urbana;
        if (data_proxima_manutencao !== undefined) updateData.data_proxima_manutencao = data_proxima_manutencao;

        await sensor.update(updateData);

        return res.status(200).json({
            message: 'Sensor atualizado com sucesso',
            data: sensor,
            links: { ...sensorLinks(id), allSensores: { href: '/sensores', method: 'GET' } }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') return next(sequelizeValidationError(error.errors));
        return next(genericError(error.message));
    }
};

export const deletarSensor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const sensor = await Sensor.findByPk(id);

        if (!sensor) return next(notFoundError('sensor', id));

        await sensor.destroy();
        return res.status(204).send();
    } catch (error) {
        return next(genericError(error.message));
    }
};
