/*
 * BreezeJS : JavaScript framework
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 * @require System
 */

var tables={};
var key_name = '@@symbol('+System.uid()+')';
var key_uid  = '@@symbol('+System.uid()+')';
var toPrimitive = '@@symbol(toPrimitive)';
var factor = (function () {
    return function Symbol( name ){
        this[key_name] = name || ''
        this[key_uid]  = System.uid();
    };
}());

/**
 * Symbol对象
 * @param name
 * @constructor
 */
function Symbol( name ){
    if(this instanceof Symbol )System.throwError('type','is not constructor');
    return new factor(name);
}
System.Symbol = Symbol;
factor.prototype = Symbol.prototype;
factor.prototype.constructor = Symbol;

/**
 * 返回Symbol的原始值
 * @returns {string}
 */
Symbol.prototype.toString=function toString()
{
    return 'symbol('+this[key_name]+')';
}

/**
 * 返回Symbol的表示式
 * @returns {string}
 */
Symbol.prototype.valueOf=function valueOf()
{
    return 'symbol('+this[key_name]+')';
}

/**
 * 返回 Symbol 的uid
 * @returns {*}
 * @internal Symbol.prototype.@@symbol(toPrimitive);
 */
Symbol.prototype[toPrimitive] = function()
{
    return '@@symbol('+this[key_uid]+')';
}

/**
 * 在注册表中生成一个指定名称的symbol。并返回symbol对象
 * @param name
 * @returns {Symbol}
 */
Symbol.for = function( name )
{
    if( tables[name] )return tables[name];
    return tables[name] = Symbol( name );
}

/**
 * 返回在注册表中的symbol名称
 * 如果不存在返回undefined
 * @param symbol
 * @returns {*}
 */
Symbol.keyFor=function keyFor( symbol )
{
    for( var i in tables )
    {
        if( tables[i]===symbol )return i;
    }
    return undefined;
}