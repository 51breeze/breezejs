/**
 * EvalError
 * @param message
 * @param line
 * @param filename
 * @constructor
 * @require System,Error,Object;
 */
function EvalError( message , line, filename) {
    Error.call(this, message , line, filename);
    this.type='EvalError';
};
System.EvalError = EvalError;
EvalError.prototype = Object.create( Error.prototype );
EvalError.prototype.constructor=EvalError;