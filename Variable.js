define('Variable',[],function()
{

    /**
     * 模板变量构造器
     * @param data
     * @constructor
     */
    function Variable(data)
    {
        if( !(this instanceof Variable) )
        {
            return new Variable( data )
        }
        this.__data__ = data || {};
    }
    Variable.prototype.constructor = Variable;
    Variable.prototype.__data__={};

    /**
     *设置变量
     * @param name
     * @param val
     * @returns {Variable}
     */
    Variable.prototype.set=function(name,val)
    {
        var t = typeof name;
        if( t === 'string' )
        {
            this.__data__[name]=val;
            return this;
        }
        throw new Error('param undefined for val');
    }

    /**
     * 获取数据
     * @param name
     * @returns {*}
     */
    Variable.prototype.get=function(name)
    {
        return typeof name === 'undefined' ? this.__data__ : this.__data__[name];
    }

    /**
     * 删除变量
     * @param name
     * @returns {*}
     */
    Variable.prototype.remove=function(name)
    {
        var val=this.__data__;
        if( typeof name === "string" )
        {
            if( typeof this.__data__[name] !== "undefined" )
            {
                val=this.__data__[name];
                delete this.__data__[name];
                return val;
            }
            return false;
        }
        return val;
    }

    /**
     * 判断是否一个对象
     * @param val
     * @param flag
     * @returns {boolean}
     */
    Variable.prototype.isObject=function(val , flag )
    {
        return val && typeof val === "object" ? !!( val.constructor === Object || ( flag && val instanceof Array ) ) : false;
    };

    /**
     * 发生错误时的返回值
     * @returns {string}
     */
    Variable.prototype.error=function(){return '';}
    return Variable;

})
