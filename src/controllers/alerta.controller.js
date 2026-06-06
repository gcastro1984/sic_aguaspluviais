import { Alerta, AreaRisco, NivelAlerta, PrevisaoMeteorologica, CriterioAlerta, InfraestruturaUrbana, LeituraSensor, AlertaPlanoAcao } from '../models/db.config.js';
import { verificarAlertas } from '../utils/alerta.utils.js';
import { conflictError, validationError, sequelizeValidationError, missingFieldsValidationError, notFoundError, genericError, parsePagination } from '../utils/error.utils.js';

const alertaLinks = (id) => ({
    self:   { href: `/alertas/${id}`,  method: 'GET' },
    update: { href: `/alertas/${id}`,  method: 'PATCH' },
    delete: { href: `/alertas/${id}`,  method: 'DELETE' }
});


// GET /alertas?estado=ativo&page=1&limit=20
export const obterAlertas = async (req, res, next) => {
    try {
        const { estado } = req.query;
        const { limit, offset, page, error } = parsePagination(req);
        if (error) return next(error);

        const estadosValidos = ['ativo', 'registado', 'resolvido', 'cancelado', 'pendente', 'em_execucao', 'concluido'];
        if (estado && !estadosValidos.includes(estado))
            return next(validationError({ estado: `Estado inválido. Use: ${estadosValidos.join(', ')}` }));

        const where = estado ? { estado } : {};
        const { count, rows } = await Alerta.findAndCountAll({ where, limit, offset });

        const data  = rows.map(a => ({ ...a.toJSON(), _links: alertaLinks(a.idalerta) }));
        const pages = Math.ceil(count / limit);

        return res.status(count > limit ? 206 : 200).json({
            data,
            pagination: { total: count, page, limit, pages },
            _links: { self: { href: '/alertas', method: 'GET' } }
        });
    } catch (error) {
        return next(genericError('Erro ao obter alertas'));
    }
};

export const obterAlertaPorId = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0)
            return next(validationError({ id: 'Deve ser um número inteiro positivo.' }));

        const alerta = await Alerta.findByPk(id, {
            include: [
                { model: AreaRisco, include: [{ model: PrevisaoMeteorologica, attributes: ['idprevisao', 'fonte', 'data_emissao', 'data_inicio_previsao', 'data_fim_previsao', 'horizonte_horas', 'precipitacao_prevista_mm', 'confianca'] }] },
                { model: NivelAlerta, include: [{ model: CriterioAlerta, where: { ativo: true }, required: false }] },
                { model: InfraestruturaUrbana }
            ]
        });

        if (!alerta) return next(notFoundError('alerta', id));

        return res.status(200).json({
            ...alerta.toJSON(),
            _links: { ...alertaLinks(id), allAlertas: { href: '/alertas', method: 'GET' } }
        });
    } catch (error) {
        return next(genericError('Erro ao obter alerta'));
    }
};

export const atualizarAlerta = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0)
            return next(validationError({ id: 'Deve ser um número inteiro positivo.' }));

        const { idnivel_alerta, idarea_risco, idinfraestrutura_urbana, data_alerta, descricao, score_risco, estado } = req.body;

        const alerta = await Alerta.findByPk(id);
        if (!alerta) return next(notFoundError('alerta', id));

        if (score_risco !== undefined && (score_risco < 0 || score_risco > 100))
            return next(validationError('score_risco deve estar entre 0 e 100'));

        // descricao: validada apenas quando enviada (não pode ser só espaços nem exceder 500 caracteres)
        if (descricao !== undefined && (descricao.trim().length === 0 || descricao.length > 500))
            return next(validationError({ descricao: 'A descrição deve ter entre 1 e 500 caracteres.' }));

        const estadosValidos = ['ativo', 'registado', 'resolvido', 'cancelado', 'pendente', 'em_execucao', 'concluido'];
        if (estado !== undefined && !estadosValidos.includes(estado))
            return next(validationError({ estado: `Estado inválido. Use: ${estadosValidos.join(', ')}` }));

        if (estado === 'resolvido') {
            const planosAtivos = await AlertaPlanoAcao.count({
                where: { idalerta: id, estado: ['pendente', 'ativo'] }
            });
            if (planosAtivos > 0)
                return next(conflictError(
                    `Não é possível resolver o alerta: existem ${planosAtivos} plano(s) de ação pendente(s) ou ativo(s). Conclua ou cancele-os primeiro.`
                ));
        }

        const updateData = {};
        if (idnivel_alerta !== undefined) updateData.idnivel_alerta = idnivel_alerta;
        if (idarea_risco !== undefined) updateData.idarea_risco = idarea_risco;
        if (idinfraestrutura_urbana !== undefined) updateData.idinfraestrutura_urbana = idinfraestrutura_urbana;
        if (data_alerta !== undefined) updateData.data_alerta = data_alerta;
        if (descricao !== undefined) updateData.descricao = descricao;
        if (score_risco !== undefined) updateData.score_risco = score_risco;
        if (estado !== undefined) updateData.estado = estado;

        await alerta.update(updateData);

        return res.status(200).json({
            message: 'Alerta atualizado com sucesso',
            ...alerta.toJSON(),
            _links: { ...alertaLinks(id), allAlertas: { href: '/alertas', method: 'GET' } }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') return next(sequelizeValidationError(error.errors));
        else if (error.name === 'SequelizeForeignKeyConstraintError') return next(validationError('Referência inválida: verifique idnivel_alerta, idarea_risco ou idleitura_sensor'));
        else return next(genericError('Erro ao atualizar alerta'));
    }
};


export const apagarAlerta = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0)
            return next(validationError({ id: 'Deve ser um número inteiro positivo.' }));

        const alerta = await Alerta.findByPk(id);

        if (!alerta) return next(notFoundError('alerta', id));

        // ATENÇÃO — relações SEM onDelete:CASCADE (bloqueiam se existirem registos dependentes):
        //   • Notificacao       → notificacoes associadas a este alerta
        //   • Relatorio         → relatórios gerados para este alerta
        //   • AlertaPlanoAcao   → associações alerta↔plano ainda activas
        // Se existirem, a BD lança SequelizeForeignKeyConstraintError → devolvemos 409 Conflict
        await alerta.destroy();
        return res.status(204).send();
    } catch (error) {
        // SequelizeForeignKeyConstraintError: o alerta ainda tem registos dependentes
        // (notificações, relatórios ou planos de acção associados)
        if (error.name === 'SequelizeForeignKeyConstraintError')
            return next(conflictError('Não é possível apagar: este alerta tem notificações, relatórios ou planos de acção associados. Remova-os primeiro.'));
        return next(genericError('Erro ao apagar alerta'));
    }
};
