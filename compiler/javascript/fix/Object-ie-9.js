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
        if (typeof O != 'object')System.throwError('type','Object prototype may only be an Object or null');
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
 */
if( (!Object.defineProperty || System.env.platform('IE') && System.env.version(8)) && System.Descriptor )
{
    Object.defineProperty=function defineProperty(obj, prop, desc)
    {
        if( $hasOwnProperty.call(obj, prop) )
        {
            if (obj[prop] instanceof System.Descriptor)
            {
                if (obj[prop].configurable === false)System.throwError('type', '"' + prop + '" property is not configurable');
                System.Descriptor.call(obj[prop], desc);
                return;
            }
            if (typeof desc.value === "undefined")desc.value = obj[prop];
        }
        obj[prop] = new System.Descriptor(desc);
        return;
    };
}

