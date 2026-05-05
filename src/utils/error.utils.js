// error builder for validation errors
// convert array of Sequelize validation errors to a more readable format:
//  e.g. "stock": ["Stock must be an integer", "Stock must be greater than or equal to 0"]
export const sequelizeValidationError = (errors) => {
    const err = new Error("Validation failed");
    err.status = 400;
    // if err.path is the same, group the error messages in an array for that field
    err.errors = errors.reduce((acc, err) => {
        if (acc[err.path]) {
            acc[err.path].push(err.message);
        } else {
            acc[err.path] = [err.message];
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
    // convert array of missing fields to an object with field names as keys 
    err.errors = missingFields.map(field => (
        { [field.toLowerCase()]: `${field} is required` }
    ));
    return err;
};

// error builder for other validation errors
// e.g. invalid sort query parameter
export const validationError = (errors) => {
    const err = new Error("Validation failed");
    err.status = 400;
    err.errors = errors;
    return err;
};

// error builder for 404 - Resource not found: 
// e.g. "product": ["Resource product with ID 10 not found"]
export const notFoundError = (resource, id) => {
    // convert resource name to lowercase for the error response key, e.g. "product" instead of "Product"
    resource = resource.toLowerCase();

    const err = new Error("Resource not found");
    err.status = 404;
    err.errors = {
        [resource]: `Resource ${resource} with ID ${id} not found`
    };
    return err;
};

// generic error handler for unexpected errors
export const genericError = (message = "Internal Server Error") => {
    const err = new Error(message);
    err.status = 500;
    return err;
};

// error builder for 409 - Conflict error
// e.g. when trying to create a product with a name that already exists
// or when trying to delete a product that is associated with existing orders
export const conflictError = (message) => {
    const err = new Error(message);
    err.status = 409;
    return err; 
};
