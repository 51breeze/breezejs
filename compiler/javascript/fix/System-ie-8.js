if (System.env.platform(System.env.BROWSER_IE) && System.env.version(8, '<='))
{
    hasDescriptor=true;
    System.typeOf = function typeOf(instanceObj)
    {
        if (instanceObj instanceof System.Class && instanceObj.constructor.prototype === instanceObj )return 'class';
        if (instanceObj instanceof System.Interface)return 'interface';
        var val = typeof instanceObj;
        if (val === "object" && /function/i.test(instanceObj + "")) {
            return "function";
        } else if (val === 'function' && instanceObj.constructor === System.RegExp) {
            return "object";
        }
        return val;
    };
    (function(f){
        System.setTimeout =f(System.setTimeout);
        System.setInterval =f(System.setInterval);
    })(function(f){return function(c,t){
        var a=[].slice.call(arguments,2);
        return f(function(){c.apply(this,a)},t)}
    });
}

/**
 * 描述符构造器
 * @private System.Descriptor
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
        if(desc.get || desc.set || this.get || this.set)Internal.throwError('type','value and accessor can only has one');
        this.value = desc.value;
    }
    if ( typeof desc.get !== "undefined" )
    {
        if( typeof desc.get !== "function" )Internal.throwError('type','getter accessor is not function');
        if( typeof desc.value !== "undefined" || typeof this.value !== "undefined")Internal.throwError('type','value and accessor can only one');
        this.get = desc.get;
    }
    if ( typeof desc.set !== "undefined" )
    {
        if( typeof desc.set !== "function" )Internal.throwError('type','setter accessor is not function');
        if( typeof desc.value !== "undefined" || typeof this.value !== "undefined" || this.writable===false )Internal.throwError('type','value and accessor and writable can only one');
        this.set = desc.set;
    }
    return this;
}
Descriptor.prototype={};
Descriptor.prototype.constructor = Descriptor;
Internal.Descriptor=Descriptor;



