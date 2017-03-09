/**
 * 类对象构造器
 * @returns {Class}
 * @constructor
 * @require System,Object;
 */
function Class(){};
Class.prototype = new Object();
System.Class = Class;