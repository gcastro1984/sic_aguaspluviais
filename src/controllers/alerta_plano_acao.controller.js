import { AlertaPlanoAcao, Alerta, PlanoAcao, InfraestruturaUrbana } from '../models/db.config.js';
import { missingFieldsValidationError, notFoundError, sequelizeValidationError, validationError, genericError } from '../utils/error.utils.js';

const apaLinks = (idalerta, idplano) => ({
    self:   { href: `/alertas-planos/${idalerta}/${idplano}`,  method: 'GET' },
    update: { href: `/alertas-planos/${idalerta}/${idplano}`,  method: 'PATCH' },
    delete: { href: `/alertas-planos/${idalerta}/${idplano}`,  method: 'DELETE' }
});

export const criarAlertaPlanoAcao = async (req, res, next) => {
    try {
        const { idalerta, idplano_acao, estado, responsavel, data_inicio, data_conclusao, observacoes } = req.body;

        if (!idalerta || !idplano_acao || !estado || !responsavel)
            return next(missingFieldsValidationError(['idalerta', 'idplano_acao', 'estado', 'responsavel']));

        const estadosValidos = ['pendente', 'ativo', 'concluido', 'cancelado'];
        if (!estadosValidos.includes(estado))
            return next(validationError({ estado: `Estado inválido. Use: ${estadosValidos.join(', ')}` }));

        const alerta = await Alerta.findByPk(idalerta);
        if (!alerta) return next(notFoundError('alerta', idalerta));

        const planoAcao = await PlanoAcao.findByPk(idplano_acao);
        if (!planoAcao) return next(notFoundError('plano_acao', idplano_acao));

        if (data_inicio && data_conclusao && new Date(data_conclusao) < new Date(data_inicio))
            return next(validationError({ data_conclusao: 'data_conclusao não pode ser anterior a data_inicio' }));

        const alertaPlanoAcao = await AlertaPlanoAcao.create({
            idalerta, idplano_acao, estado, responsavel,
            data_inicio: data_inicio || null,
            data_conclusao: data_conclusao || null,
            observacoes: observacoes || null
        });

        return res.status(201).json({
            _self: `/alertas-planos/${idalerta}/${idplano_acao}`
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError')
            return next(validationError({ association: 'Esta associação de alerta e plano de ação já existe' }));
        return next(genericError('Erro ao criar alerta plano ação'));
    }
};

// GET /alertas-planos?estado=X&idalerta=1&idplano_acao=2&page=1&limit=20
export const obterAlertasPlanos = async (req, res, next) => {
    try {
        const { estado, idalerta, idplano_acao } = req.query;
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        let offset, page;
        if (req.query.offset !== undefined) {
            offset = Math.max(0, parseInt(req.query.offset) || 0);
            page   = Math.floor(offset / limit) + 1;
        } else {
            page   = Math.max(1, parseInt(req.query.page) || 1);
            offset = (page - 1) * limit;
        }

        const where = {};
        if (estado) where.estado = estado;
        if (idalerta) where.idalerta = parseInt(idalerta);
        if (idplano_acao) where.idplano_acao = parseInt(idplano_acao);

        const { count, rows } = await AlertaPlanoAcao.findAndCountAll({
            where,
            include: [
                {
                    model: Alerta,
                    attributes: ['idalerta', 'descricao', 'estado', 'idinfraestrutura_urbana']
                    // sem nested include — buscamos o nome da infra separadamente abaixo
                },
                { model: PlanoAcao, attributes: ['idplano_acao', 'descricao', 'tipo_destinatario'] }
            ],
            limit,
            offset
        });

        // Recolhe os IDs de infraestrutura únicos presentes nos alertas
        // .filter(Boolean) remove null/undefined
        // .filter((id, i, self) => self.indexOf(id) === i) remove duplicados
        const infraIds = rows
            .map(r => r.alerta?.idinfraestrutura_urbana)
            .filter(Boolean)
            .filter((id, i, self) => self.indexOf(id) === i);

        // Busca as infraestruturas de uma só vez (evita N queries)
        const infraMap = {};
        if (infraIds.length > 0) {
            const infraList = await InfraestruturaUrbana.findAll({
                where: { idinfraestrutura_urbana: infraIds },
                attributes: ['idinfraestrutura_urbana', 'nome']
            });
            infraList.forEach(i => { infraMap[i.idinfraestrutura_urbana] = i.nome; });
        }

        // Adiciona infra_nome directamente no nível raiz de cada registo
        const data = rows.map(r => {
            const json = r.toJSON();
            const infraId = json.alerta?.idinfraestrutura_urbana;
            return {
                ...json,
                infra_nome: infraId ? (infraMap[infraId] || null) : null,
                _links: apaLinks(r.idalerta, r.idplano_acao)
            };
        });
        const pages = Math.ceil(count / limit);

        return res.status(count > limit ? 206 : 200).json({
            data,
            pagination: { total: count, page, limit, pages },
            _links: { self: { href: '/alertas-planos', method: 'GET' }, create: { href: '/alertas-planos', method: 'POST' } }
        });
    } catch (error) {
        return next(genericError('Erro ao obter alertas planos ação'));
    }
};

export const obterAlertaPlanoAcaoPorIds = async (req, res, next) => {
    try {
        const { idalerta, idplano_acao } = req.params;

        const apa = await AlertaPlanoAcao.findOne({
            where: { idalerta, idplano_acao },
            include: [
                {
                    model: Alerta,
                    attributes: ['idalerta', 'descricao', 'estado', 'idinfraestrutura_urbana'],
                    include: [{ model: InfraestruturaUrbana, attributes: ['idinfraestrutura_urbana', 'nome'] }]
                },
                { model: PlanoAcao, attributes: ['idplano_acao', 'descricao', 'tipo_destinatario'] }
            ]
        });

        if (!apa) return next(notFoundError('alerta_plano_acao', `${idalerta}/${idplano_acao}`));

        return res.status(200).json({
            ...apa.toJSON(),
            _links: { ...apaLinks(idalerta, idplano_acao), allAlertasPlanos: { href: '/alertas-planos', method: 'GET' } }
        });
    } catch (error) {
        return next(genericError('Erro ao obter alerta plano ação'));
    }
};

export const atualizarAlertaPlanoAcao = async (req, res, next) => {
    try {
        const { idalerta, idplano_acao } = req.params;
        const { estado, responsavel, data_inicio, data_conclusao, observacoes } = req.body;

        const apa = await AlertaPlanoAcao.findOne({ where: { idalerta, idplano_acao } });
        if (!apa) return next(notFoundError('alerta_plano_acao', `${idalerta}/${idplano_acao}`));

        const estadosValidos = ['pendente', 'ativo', 'concluido', 'cancelado'];
        if (estado !== undefined && !estadosValidos.includes(estado))
            return next(validationError({ estado: `Estado inválido. Use: ${estadosValidos.join(', ')}` }));

        // Impede re-activação: se já está 'ativo', não pode voltar a 'ativo'
        // Evita que a data_inicio seja sobrescrita acidentalmente
        if (estado === 'ativo' && apa.estado === 'ativo')
            return next(validationError({ estado: 'O plano já se encontra ativo. data_inicio não pode ser alterada.' }));

        if (data_inicio && data_conclusao && new Date(data_conclusao) < new Date(data_inicio))
            return next(validationError({ data_conclusao: 'data_conclusao não pode ser anterior a data_inicio' }));

        const updateData = {};
        if (estado !== undefined) updateData.estado = estado;
        if (responsavel !== undefined) updateData.responsavel = responsavel;
        if (observacoes !== undefined) updateData.observacoes = observacoes;

        // Datas manuais têm prioridade; se não forem enviadas, o sistema define automaticamente
        if (data_inicio !== undefined) {
            updateData.data_inicio = data_inicio;
        } else if (estado === 'ativo' && !apa.data_inicio) {
            // Registo automático da data de início quando o plano passa para activo
            updateData.data_inicio = new Date();
        }

        if (data_conclusao !== undefined) {
            updateData.data_conclusao = data_conclusao;
        } else if (estado === 'concluido' && !apa.data_conclusao) {
            // Registo automático da data de conclusão quando o plano é concluído
            updateData.data_conclusao = new Date();
        }

        await apa.update(updateData);

        return res.status(200).json({
            message: 'Alerta Plano Ação atualizado com sucesso',
            ...apa.toJSON(),
            _links: { ...apaLinks(idalerta, idplano_acao), allAlertasPlanos: { href: '/alertas-planos', method: 'GET' } }
        });
    } catch (error) {
        return next(genericError('Erro ao atualizar alerta plano ação'));
    }
};

export const apagarAlertaPlanoAcao = async (req, res, next) => {
    try {
        const { idalerta, idplano_acao } = req.params;

        const apa = await AlertaPlanoAcao.findOne({ where: { idalerta, idplano_acao } });
        if (!apa) return next(notFoundError('alerta_plano_acao', `${idalerta}/${idplano_acao}`));

        await apa.destroy();
        return res.status(204).send();
    } catch (error) {
        return next(genericError('Erro ao deletar alerta plano ação'));
    }
};
