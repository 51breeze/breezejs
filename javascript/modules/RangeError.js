/**
 * RangeError
 * @param message
 * @param line
 * @param filename
 * @constructor
 * @require Error,Object;
 */
var RangeError = function RangeError( message , line, filename) {
    Error.call(this, message , line, filename);
    this.type='RangeError';
};
System.RangeError=RangeError;
RangeError.prototype = Object.create( Error.prototype) ;
RangeError.prototype.constructor=RangeError;