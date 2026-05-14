import { LeituraSensor, Sensor, Alerta,InfraestruturaUrbana, AreaRisco } from '../models/db.config.js'; 

// import error utils
import { conflictError, validationError, sequelizeValidationError, missingFieldsValidationError, notFoundError, genericError } from "../utils/error.utils.js";


import { verificarAlertas } from '../utils/alerta.utils.js';


export const criarLeitura = async (req, res, next) => {

    try {
        

        // sequelize valida automaticamente
        const newLeitura = await LeituraSensor.create(req.body);
        console.log("Leitura criada:", newLeitura.toJSON());
        
       // Verigficar se sensor existe
       
    const sensor = await Sensor.findByPk(newLeitura.idsensor);





        if (!sensor) {
            return next(notFoundError("Sensor não encontrado"));
        }
        if (sensor.status !== 'online') {
            return next(conflictError("Sensor está offline ou em manutenção"));
        }
       

        
        // verificar/classificar alertas
        const resultado = await verificarAlertas(newLeitura);

        
      

        let alertaCriado = null;
        if (resultado) {
            alertaCriado = await Alerta.create({
                idnivel_alerta: resultado.nivel,
                idarea_risco: resultado.idarea_risco,
                idinfraestrutura_urbana: resultado.idinfraestrutura_urbana,
                idleitura_sensor: newLeitura.idleitura_sensor,
                descricao: resultado.mensagem,
                score_risco: resultado.score_risco || 0,
                estado: "ativo"
            });
        }

        // resposta HATEOAS
        const leituraResponse = {

            ...newLeitura.toJSON(),

            classificacao: resultado ? resultado.nivel : 1,
            alerta: alertaCriado ? alertaCriado.toJSON() : null,
            repetido: false,



            links: {
                allLeituras: {
                    href: "/leituras",
                    method: "GET"
                },

                self: {
                    href: `/leituras/${newLeitura.idleitura_sensor}`,
                    method: "GET"
                },

                update: {
                    href: `/leituras/${newLeitura.idleitura_sensor}`,
                    method: "PUT"
                },

                delete: {
                    href: `/leituras/${newLeitura.idleitura_sensor}`,
                    method: "DELETE"
                }
            }
        };
        res.status(201).json(leituraResponse);

    } catch (error) {

        // erros de validação sequelize
        if (error.name === "SequelizeValidationError") {

            next(
                sequelizeValidationError(error.errors)
            );
        }
        else {

            // erro genérico
            next(
                genericError(error.message)
            );
        }
    }
};