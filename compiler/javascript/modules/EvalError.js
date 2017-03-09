/**
 * EvalError
 * @param message
 * @param line
 * @param filename
 * @constructor
 * @require System,Error;
 */
function EvalError( message , line, filename) {
    Error.call(this, message , line, filename);
    this.type='EvalError';
};
System.EvalError = EvalError;
EvalError.prototype = new Error();
EvalError.prototype.constructor=EvalError;