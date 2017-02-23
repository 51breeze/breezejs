/**
 * RangeError
 * @param message
 * @param line
 * @param filename
 * @constructor
 */
function RangeError( message , line, filename) {
    Error.call(this, message , line, filename);
    this.type='RangeError';
}
RangeError.prototype = new Error();
RangeError.prototype.constructor=RangeError;