/**
 * 获取指定对象的原型
 * @type {Object}
 * @returns {Boolean}
 */
if( !Object.getPrototypeOf )
{
    Object.getPrototypeOf = function getPrototypeOf(obj) {
        if (!obj)return null;
        return obj.__proto__ ? obj.__proto__ : (obj.constructor ? obj.constructor.prototype : null);
    }
}

var __ie8__ = System.env.platform('IE') && System.env.version(8);

/**
 * 生成一个对象
 */
if( !Object.create  )
{
    Object.create = (function () {
        function F() {};
        var $has = $Object.prototype.hasOwnProperty;
        return function (O, P) {
            if (typeof O != 'object')System.throwError('type', 'Object prototype may only be an Object or null');
            F.prototype = O;
            var obj = new F();
            F.prototype = null;
            if (P != null) {
                P = Object(P);
                for (var n in P)if ($has.call(P, n))
                {
                    if( __ie8__ || !Object.defineProperty )
                    {
                        obj[n]=P[n];
                    }else
                    {
                        Object.defineProperty(obj, n, P[n]);
                    }
                }
            }
            return obj;
        };
    })();
}

/**
 * 定义属性的描述
 */
if( (!Object.defineProperty || __ie8__) && System.Descriptor )
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

