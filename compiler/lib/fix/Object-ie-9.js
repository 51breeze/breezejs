/**
 * 获取指定对象的原型
 * @type {Object}
 * @returns {Boolean}
 */
Object.getPrototypeOf = $Object.getPrototypeOf || function getPrototypeOf(obj)
{
    if( !obj )return null;
    return obj.__proto__ ? obj.__proto__ : (obj.constructor ? obj.constructor.prototype : null);
}

/**
 * 生成一个对象
 */
Object.create  = $Object.create || (function() {
    function F() {};
    return function (O,P) {
        if (typeof O != 'object')throwError('type','Object prototype may only be an Object or null');
        F.prototype = O;
        var obj = new F();
        F.prototype = null;
        if( P !=null )
        {
            P = Object( P );
            for (var n in P)if( $hasOwnProperty.call(P, n) )
            {
                Object.defineProperty(obj,n, P[n]);
            }
        }
        return obj;
    };
})();

/**
 * 定义属性的描述
 * @type {*|Function}
 */
Object.defineProperty =$Object.defineProperty;
if( !Object.defineProperty || system.env.platform()===system.env.BROWSER_IE && system.env.version(8) )
{
    Object.defineProperty = function defineProperty(obj, prop, desc)
    {
        if ($hasOwnProperty.call(obj, prop))
        {
            if (obj[prop] instanceof Descriptor)
            {
                if (obj[prop].configurable === false)throwError('type', '"' + prop + '" property is not configurable');
                Descriptor.call(obj[prop], desc);
                return;
            }
            if (typeof desc.value === "undefined")desc.value = obj[prop];
        }
        obj[prop] = new Descriptor(desc);
        return;
    };
}

/**
 * 描述符构造器
 * @param desc
 * @constructor
 */
function Descriptor( desc )
{
    if( !(this instanceof Descriptor) )return new Descriptor(desc);
    this.writable = !!desc.writable;
    this.enumerable = !!desc.enumerable;
    this.configurable = !!desc.configurable;
    if (typeof desc.value !== "undefined")
    {
        if(desc.get || desc.set || this.get || this.set)throwError('type','value and accessor can only has one');
        this.value = desc.value;
    }
    if ( typeof desc.get !== "undefined" )
    {
        if( typeof desc.get !== "function" )throwError('type','getter accessor is not function');
        if( typeof desc.value !== "undefined" || typeof this.value !== "undefined")throwError('type','value and accessor can only one');
        this.get = desc.get;
    }
    if ( typeof desc.set !== "undefined" )
    {
        if( typeof desc.set !== "function" )throwError('type','setter accessor is not function');
        if( typeof desc.value !== "undefined" || typeof this.value !== "undefined" || this.writable===false )throwError('type','value and accessor and writable can only one');
        this.set = desc.set;
    }
    return this;
}
Descriptor.prototype={};
Descriptor.prototype.constructor = Descriptor;