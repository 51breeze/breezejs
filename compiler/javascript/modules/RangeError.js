/**
 * RangeError
 * @param message
 * @param line
 * @param filename
 * @constructor
 * @require Error;
 */
var RangeError = function RangeError( message , line, filename) {
    Error.call(this, message , line, filename);
    this.type='RangeError';
};
System.RangeError=RangeError;
RangeError.prototype = new Error();
RangeError.prototype.constructor=RangeError;