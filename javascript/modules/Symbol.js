/*
 * BreezeJS : JavaScript framework
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 * @require System,Internal
 */
var tables={};
var hash={};
var prefix ='@@symbol';
var prefixLen =  prefix.length;
Internal.SYMBOL_KEY_NAME = prefix+'(SYMBOL_KEY_NAME)';
Internal.SYMBOL_KEY_VALUE= prefix+'(SYMBOL_KEY_VALUE)';

Internal.isSymbolPropertyName = function isSymbolPropertyName( propName )
{
    if( propName==null )return false;
    return propName[0]==='@' && propName[0].substr && propName[0].substr(0,prefixLen+1) === prefix+'(';
}

var factor = (function () {
    return function Symbol( name ){
        this[Internal.SYMBOL_KEY_NAME] = name || '';
        this[Internal.SYMBOL_KEY_VALUE]= prefix+'('+System.uid()+')';
    };
}());

/**
 * Symbol对象
 * @param name
 * @constructor
 */
function Symbol( name ){
    if(this instanceof Symbol )Internal.throwError('type','is not constructor');
    return new factor(name);
}
System.Symbol = Symbol;
Symbol.prototype.constructor = Symbol;
factor.prototype = Symbol.prototype;

/**
 * 返回Symbol的原始值
 * @returns {string}
 */
Symbol.prototype.toString=function toString()
{
    return this[Internal.SYMBOL_KEY_VALUE];
}

/**
 * 返回Symbol的表示式
 * @returns {string}
 */
Symbol.prototype.valueOf=function valueOf()
{
    return 'symbol('+this[Internal.SYMBOL_KEY_NAME]+')';
}

/**
 * 在注册表中生成一个指定名称的symbol。并返回symbol对象
 * @param name
 * @returns {Symbol}
 */
Symbol["for"] = function( name )
{
    if( tables[name] )return tables[name];
    tables[name] = Symbol( name );
    hash[ tables[name][Internal.SYMBOL_KEY_VALUE] ]=name;
    return obj;
}

/**
 * 返回在注册表中的symbol名称
 * 如果不存在返回undefined
 * @param symbol
 * @returns {*}
 */
Symbol.keyFor=function keyFor( symbol )
{
    if( symbol instanceof Symbol )
    {
        return hash[ symbol[Internal.SYMBOL_KEY_VALUE] ];
    }
    return undefined;
}