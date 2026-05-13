import { AlertaPlanoAcao, Alerta, PlanoAcao } from "../models/db.config.js";

// CREATE - Criar novo alerta plano ação
export const criarAlertaPlanoAcao = async (req, res) => {
    try {
        const { idalerta, idplano_acao, estado, responsavel, data_inicio, data_conclusao, observacoes } = req.body;

        // Validar campos obrigatórios
        if (!idalerta || !idplano_acao || !estado || !responsavel) {
            return res.status(400).json({
                message: "Campos obrigatórios faltando",
                required: ["idalerta", "idplano_acao", "estado", "responsavel"]
            });
        }

        // Verificar se alerta existe
        const alerta = await Alerta.findByPk(idalerta);
        if (!alerta) {
            return res.status(400).json({
                message: "Alerta não encontrado"
            });
        }

        // Verificar se plano de ação existe
        const planoAcao = await PlanoAcao.findByPk(idplano_acao);
        if (!planoAcao) {
            return res.status(400).json({
                message: "Plano de ação não encontrado"
            });
        }

        const alertaPlanoAcao = await AlertaPlanoAcao.create({
            idalerta,
            idplano_acao,
            estado,
            responsavel,
            data_inicio: data_inicio || null,
            data_conclusao: data_conclusao || null,
            observacoes: observacoes || null
        });

        return res.status(201).json({
            message: "Alerta Plano Ação criado com sucesso",
            data: alertaPlanoAcao,
            links: {
                self: `/alertas/${idalerta}/planos/${idplano_acao}`,
                allAlertasPlanos: `/alertas-planos`,
                update: `/alertas/${idalerta}/planos/${idplano_acao}`,
                delete: `/alertas/${idalerta}/planos/${idplano_acao}`
            }
        });
    } catch (error) {
        console.error("Erro ao criar alerta plano ação:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                message: "Esta associação de alerta e plano de ação já existe"
            });
        }
        return res.status(500).json({
            message: "Erro ao criar alerta plano ação",
            error: error.message
        });
    }
};

// READ - Obter todos os alertas planos ação
export const obterAlertasPlanos = async (req, res) => {
    try {
        const alertasPlanos = await AlertaPlanoAcao.findAll({
            include: [
                { model: Alerta, attributes: ['idalerta', 'descricao', 'estado'] },
                { model: PlanoAcao, attributes: ['idplano_acao', 'descricao', 'tipo_destinatario'] }
            ]
        });

        return res.status(200).json({
            message: "Alertas Planos Ação recuperados com sucesso",
            total: alertasPlanos.length,
            data: alertasPlanos,
            links: {
                self: `/alertas-planos`,
                create: { method: "POST", url: `/alertas-planos` }
            }
        });
    } catch (error) {
        console.error("Erro ao obter alertas planos:", error);
        return res.status(500).json({
            message: "Erro ao obter alertas planos ação",
            error: error.message
        });
    }
};

// READ - Obter alertas planos por ID de alerta
export const obterPorIdAlerta = async (req, res) => {
    try {
        const { idalerta } = req.params;

        const alertasPlanos = await AlertaPlanoAcao.findAll({
            where: { idalerta },
            include: [
                { model: Alerta, attributes: ['idalerta', 'descricao', 'estado'] },
                { model: PlanoAcao, attributes: ['idplano_acao', 'descricao', 'tipo_destinatario'] }
            ]
        });

        if (alertasPlanos.length === 0) {
            return res.status(404).json({
                message: "Nenhum plano de ação associado a este alerta"
            });
        }

        return res.status(200).json({
            message: "Planos de ação do alerta recuperados com sucesso",
            total: alertasPlanos.length,
            idalerta,
            data: alertasPlanos,
            links: {
                self: `/alertas/${idalerta}/planos`,
                allAlertasPlanos: `/alertas-planos`
            }
        });
    } catch (error) {
        console.error("Erro ao obter alertas planos por alerta:", error);
        return res.status(500).json({
            message: "Erro ao obter alertas planos por alerta",
            error: error.message
        });
    }
};

// READ - Obter alertas planos por ID de plano
export const obterPorIdPlano = async (req, res) => {
    try {
        const { idplano_acao } = req.params;

        const alertasPlanos = await AlertaPlanoAcao.findAll({
            where: { idplano_acao },
            include: [
                { model: Alerta, attributes: ['idalerta', 'descricao', 'estado'] },
                { model: PlanoAcao, attributes: ['idplano_acao', 'descricao', 'tipo_destinatario'] }
            ]
        });

        if (alertasPlanos.length === 0) {
            return res.status(404).json({
                message: "Nenhum alerta associado a este plano de ação"
            });
        }

        return res.status(200).json({
            message: "Alertas do plano recuperados com sucesso",
            total: alertasPlanos.length,
            idplano_acao,
            data: alertasPlanos,
            links: {
                self: `/planos/${idplano_acao}/alertas`,
                allAlertasPlanos: `/alertas-planos`
            }
        });
    } catch (error) {
        console.error("Erro ao obter alertas planos por plano:", error);
        return res.status(500).json({
            message: "Erro ao obter alertas planos por plano",
            error: error.message
        });
    }
};

// READ - Obter alertas planos por estado
export const obterPorEstado = async (req, res) => {
    try {
        const { estado } = req.params;

        const alertasPlanos = await AlertaPlanoAcao.findAll({
            where: { estado },
            include: [
                { model: Alerta, attributes: ['idalerta', 'descricao', 'estado'] },
                { model: PlanoAcao, attributes: ['idplano_acao', 'descricao', 'tipo_destinatario'] }
            ]
        });

        if (alertasPlanos.length === 0) {
            return res.status(404).json({
                message: `Nenhum alerta plano com estado: ${estado}`
            });
        }

        return res.status(200).json({
            message: "Alertas Planos Ação por estado recuperados com sucesso",
            total: alertasPlanos.length,
            estado,
            data: alertasPlanos,
            links: {
                self: `/alertas-planos/estado/${estado}`,
                allAlertasPlanos: `/alertas-planos`
            }
        });
    } catch (error) {
        console.error("Erro ao obter alertas planos por estado:", error);
        return res.status(500).json({
            message: "Erro ao obter alertas planos por estado",
            error: error.message
        });
    }
};

// UPDATE - Atualizar alertas planos ação
export const atualizarAlertaPlanoAcao = async (req, res) => {
    try {
        const { idalerta, idplano_acao } = req.params;
        const { estado, responsavel, data_inicio, data_conclusao, observacoes } = req.body;

        const alertaPlanoAcao = await AlertaPlanoAcao.findOne({
            where: { idalerta, idplano_acao }
        });

        if (!alertaPlanoAcao) {
            return res.status(404).json({
                message: "Alerta Plano Ação não encontrado"
            });
        }

        await alertaPlanoAcao.update({
            estado: estado || alertaPlanoAcao.estado,
            responsavel: responsavel || alertaPlanoAcao.responsavel,
            data_inicio: data_inicio !== undefined ? data_inicio : alertaPlanoAcao.data_inicio,
            data_conclusao: data_conclusao !== undefined ? data_conclusao : alertaPlanoAcao.data_conclusao,
            observacoes: observacoes || alertaPlanoAcao.observacoes
        });

        return res.status(200).json({
            message: "Alerta Plano Ação atualizado com sucesso",
            data: alertaPlanoAcao,
            links: {
                self: `/alertas/${idalerta}/planos/${idplano_acao}`,
                allAlertasPlanos: `/alertas-planos`
            }
        });
    } catch (error) {
        console.error("Erro ao atualizar alerta plano ação:", error);
        return res.status(500).json({
            message: "Erro ao atualizar alerta plano ação",
            error: error.message
        });
    }
};

// DELETE - Deletar alertas planos ação
export const deletarAlertaPlanoAcao = async (req, res) => {
    try {
        const { idalerta, idplano_acao } = req.params;

        const alertaPlanoAcao = await AlertaPlanoAcao.findOne({
            where: { idalerta, idplano_acao }
        });

        if (!alertaPlanoAcao) {
            return res.status(404).json({
                message: "Alerta Plano Ação não encontrado"
            });
        }

        await alertaPlanoAcao.destroy();

        return res.status(200).json({
            message: "Alerta Plano Ação deletado com sucesso",
            deletedIds: { idalerta, idplano_acao },
            links: {
                allAlertasPlanos: `/alertas-planos`,
                create: { method: "POST", url: `/alertas-planos` }
            }
        });
    } catch (error) {
        console.error("Erro ao deletar alerta plano ação:", error);
        return res.status(500).json({
            message: "Erro ao deletar alerta plano ação",
            error: error.message
        });
    }
};
