/**
 * URIError
 * @param message
 * @param line
 * @param filename
 * @constructor
 * @require Error,Object
 */
function URIError( message , line, filename) {
    Error.call(this, message , line, filename);
    this.type='URIError';
};
System.URIError=URIError;
URIError.prototype = Object.create( Error.prototype );
URIError.prototype.constructor=URIError;