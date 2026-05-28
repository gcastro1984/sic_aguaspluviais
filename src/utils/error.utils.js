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
