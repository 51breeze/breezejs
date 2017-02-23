/**
 * URIError
 * @param message
 * @param line
 * @param filename
 * @constructor
 */
function URIError( message , line, filename) {
    Error.call(this, message , line, filename);
    this.type='URIError';
}
URIError.prototype = new Error();
URIError.prototype.constructor=URIError;