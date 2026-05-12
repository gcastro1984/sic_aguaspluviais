import { LeituraSensor } from '../models/db.config.js'; 

// import error utils
import { conflictError, validationError, sequelizeValidationError, missingFieldsValidationError, notFoundError, genericError } from "../utils/error.utils.js";


//import { verificarAlertas } from '../utils/alerta.utils.js';


export const criarLeitura = async (req, res, next) => {

    try {
        
    console.log(" RECEBIDO:", req.body);

        // sequelize valida automaticamente
        const newLeitura = await LeituraSensor.create(req.body);
        
       

        // verificar/classificar alertas
        //const resultado =
            //await verificarAlertas(newLeitura);

        // resposta HATEOAS
        const leituraResponse = {

            ...newLeitura.toJSON(),

            // classificação calculada
            //classificacao: resultado.classificacao,

            // alerta criado (ou null)
            //alerta: resultado.alerta,

            // indica se alerta já existia
            //repetido: resultado.repetido || false,

            
classificacao: null,
alerta: null,
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
        console.log("✅ CHEGOU AO FIM DO CONTROLLER")
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
                genericError("Error creating leitura")
            );
        }
    }
};