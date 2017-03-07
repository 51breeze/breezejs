/**
 * EvalError
 * @param message
 * @param line
 * @param filename
 * @constructor
 */
var EvalError = function EvalError( message , line, filename) {
    Error.call(this, message , line, filename);
    this.type='EvalError';
};
EvalError.prototype = new Error();
EvalError.prototype.constructor=EvalError;