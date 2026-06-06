// error builder for validation errors
// convert array of Sequelize validation errors to a more readable format:
//  e.g. "stock": ["Stock must be an integer", "Stock must be greater than or equal to 0"]
export const sequelizeValidationError = (errors) => {
    const err = new Error("Validation failed");
    err.status = 400;
    err.code   = 'validation_error';
    // if err.path is the same, group the error messages in an array for that field
    err.errors = errors.reduce((acc, e) => {
        if (acc[e.path]) {
            acc[e.path].push(e.message);
        } else {
            acc[e.path] = [e.message];
        }
        return acc;
    }, {});

    return err;
};

// error builder for missing required fields in the request body
// e.g. "name": ["Name is required"]
export const missingFieldsValidationError = (missingFields) => {
    const err = new Error("Missing required fields");
    err.status = 400;
    err.code   = 'missing_fields';
    // convert array of missing fields to an object with field names as keys
    err.errors = missingFields.reduce((acc, field) => {
        acc[field.toLowerCase()] = `${field} is required`;
        return acc;
    }, {});
    return err;
};

// error builder for other validation errors
// e.g. invalid sort query parameter
export const validationError = (message, errors) => {
    const err = new Error(typeof message === 'string' ? message : "Validation failed");
    err.status = 400;
    err.code   = 'validation_error';
    // backward-compat: validationError('msg') OR validationError('msg', {field: 'detail'})
    if (errors !== undefined) {
        err.errors = errors;
    } else if (typeof message === 'object') {
        err.errors = message;
    }
    return err;
};

// error builder for 404 - Resource not found:
// e.g. "product": ["Resource product with ID 10 not found"]
// or allow a single message string for backwards compatibility
export const notFoundError = (resource, id) => {
    const err = new Error("Resource not found");
    err.status = 404;
    err.code   = 'not_found';

    if (id === undefined) {
        if (typeof resource === 'string' && resource.includes(' ')) {
            err.errors = { message: resource };
        } else {
            const key = (typeof resource === 'string') ? resource.toLowerCase() : 'resource';
            err.errors = { [key]: `Resource ${resource} not found` };
        }
    } else {
        const key = (typeof resource === 'string') ? resource.toLowerCase() : 'resource';
        err.errors = { [key]: `Resource ${resource} with ID ${id} not found` };
    }

    return err;
};

// generic error handler for unexpected errors
export const genericError = (message = "Internal Server Error") => {
    const err = new Error(message);
    err.status = 500;
    err.code   = 'internal_error';
    return err;
};

// error builder for 409 - Conflict error
// e.g. when trying to create a resource that already exists
export const conflictError = (message) => {
    const err = new Error(message);
    err.status = 409;
    err.code   = 'conflict';
    return err;
};

// error builder for 401 - Unauthorized
// e.g. invalid credentials on login
export const unauthorizedError = (message = 'Credenciais inválidas') => {
    const err = new Error(message);
    err.status = 401;
    err.code   = 'unauthorized';
    return err;
};

// Valida e normaliza os parâmetros de paginação da query string.
// Regras (ver slides REST: GET /orders — "Invalid Pagination Inputs (400)"):
//   - limit  : inteiro positivo (1..100). Default 20. Acima de 100 é limitado a 100.
//   - offset : inteiro não-negativo (>= 0). Default 0.
//   - page   : inteiro positivo (>= 1). Default 1.
// offset tem prioridade sobre page quando ambos são enviados.
//
// Devolve { limit, offset, page } em caso de sucesso,
// ou { error } (um validationError 400) quando algum valor é inválido.
//
// Uso no controller:
//   const { limit, offset, page, error } = parsePagination(req);
//   if (error) return next(error);
export const parsePagination = (req, { defaultLimit = 20, maxLimit = 100 } = {}) => {
    const errors = {};

    // Converte o valor da query para inteiro; devolve NaN se não for um
    // inteiro "limpo" (rejeita '', espaços, '1.5', 'abc', '10x', ...).
    const toInt = (valor) => {
        const texto = String(valor).trim();
        if (texto === '') return NaN;
        const n = Number(texto);
        return Number.isInteger(n) ? n : NaN;
    };

    // limit
    let limit = defaultLimit;
    if (req.query.limit !== undefined) {
        const n = toInt(req.query.limit);
        if (Number.isNaN(n) || n < 1) {
            errors.limit = ['limit must be a positive integer'];
        } else {
            limit = Math.min(maxLimit, n);
        }
    }

    // offset / page
    let offset, page;
    if (req.query.offset !== undefined) {
        const n = toInt(req.query.offset);
        if (Number.isNaN(n) || n < 0) {
            errors.offset = ['offset must be a non-negative integer'];
        } else {
            offset = n;
            page   = Math.floor(offset / limit) + 1;
        }
    } else if (req.query.page !== undefined) {
        const n = toInt(req.query.page);
        if (Number.isNaN(n) || n < 1) {
            errors.page = ['page must be a positive integer'];
        } else {
            page   = n;
            offset = (page - 1) * limit;
        }
    } else {
        page   = 1;
        offset = 0;
    }

    if (Object.keys(errors).length > 0) {
        return { error: validationError('Validation failed', errors) };
    }

    return { limit, offset, page };
};
