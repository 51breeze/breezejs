/**
 * URIError
 * @param message
 * @param line
 * @param filename
 * @constructor
 * @require Error
 */
function URIError( message , line, filename) {
    Error.call(this, message , line, filename);
    this.type='URIError';
};
System.URIError=URIError;
URIError.prototype = new Error();
URIError.prototype.constructor=URIError;