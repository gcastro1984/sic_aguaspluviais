import { Alerta } from '../models/db.config.js'; 

// import error utils
import { conflictError, validationError, sequelizeValidationError, missingFieldsValidationError, notFoundError, genericError } from "../utils/error.utils.js";



// controller to create a new product
export const criarAlerta = async (req, res, next) => {
    try {
        //sequelize will automatically validate the input based on the model definition and throw an error if validation fails
        const newAlerta = await Alerta.create(req.body);
        
        // add hateoas links to the response
        const alertaResponse = {
            ...newAlerta.toJSON(),
            links: {
                allAlertas: { href: "/alertas", method: "GET" },
                self: { href: `/alertas/${newAlerta.id}` },
                update: { href: `/alertas/${newAlerta.id}`, method: "PUT" },
                delete: { href: `/alertas/${newAlerta.id}`, method: "DELETE" }
            }
        };
        res.status(201).json(alertaResponse);
    } catch (error) {
        // detect specific validation errors and send appropriate response
        if (error.name === "SequelizeValidationError") {
            next(sequelizeValidationError(error.errors));
        }
        else {
            // send generic error to express error handling middleware
            next(genericError("Error creating alerta"));
        }
    }
};