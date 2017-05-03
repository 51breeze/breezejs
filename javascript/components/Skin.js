
/**
 * 皮肤类
 * @constructor
 * @require Object,TypeError,Math,Component,SkinEvent,Reflect,Symbol
 */


/**
 * @private
 */
var skinSymbol = Symbol('skin');
function property( name, value )
{
    if( name === true )
    {
        this[ skinSymbol ]=value;
        return value;
    }
    var data = this[ skinSymbol ];
    if( !data )return undefined;
    return value==null ? data[ name ] || null : data[ name ]=value;
}

function Skin( skinObject )
{
    skinObject = skinObject || {
        "name": 'div',
        "attr": {},
        "children":[]
    };
    property.call(this, true,{
       'data':{'mode':Skin.BUILD_ALL_MODE},
       'skinObject':skinObject
    });
    Component.call(this);
}

Skin.toString = function toString()
{
   return "[class Skin]";
}

Skin.valueOf = function valueOf()
{
    return "[class Skin]";
}

Skin.prototype = Object.create( Component.prototype );
Skin.prototype.constructor = Skin;

/**
 * 皮肤属性
 * @param name
 * @param val
 * @returns {*}
 */
Skin.prototype.attr = function attr(name, val)
{
    var skinObject = property.call(this,'skinObject');
    if( typeof name === "string" )
    {
        if( typeof val !== "undefined" )
        {
            skinObject.attr[name]=val;
            return this;
        }
        return skinObject.attr[name];
    }
    return skinObject.attr;
}

//不构建
Skin.BUILD_CLOSE_MODE = 0;

//构建主容器
Skin.BUILD_CONTAINER_MODE = 1;

//构建子级
Skin.BUILD_CHILDREN_MODE = 2;

//构建全部
Skin.BUILD_ALL_MODE = 3;

/**
 * 指示如何构建皮肤,默认为所有
 * @param mode
 * @returns {number|*}
 */
Skin.prototype.buildMode =function buildMode( mode )
{
    var data = property.call(this,'data');
    if( typeof mode === "number" )
    {
       if( (mode | Skin.BUILD_ALL_MODE) !== Skin.BUILD_ALL_MODE )
       {
           throw new Error('Invalid build mode');
       }
       data.mode=mode;
       return this;
    }
    return data.mode;
}

/**
 * 根据id获取子级元素
 * @param id
 * @returns {*}
 */
Skin.prototype.getChildById = function getChildById( id )
{
    if( this instanceof System.Class )
    {
       var child =Reflect.get(this, id );
       if( child )return child;
    }
    var skinObject = property.call(this,'skinObject');
    var children = skinObject.children;
    for( var i in children )
    {
        if( children[i].attr.id === id )
        {
            if( !System.is(children[i], Skin) )
            {
                children[i] = new Skin( children[i] );
            }
            return children[i];
        }
    }
    return null;
}

/**
 * 获取指定名称的元素只返回第一个
 * @param name
 * @returns {*}
 */
Skin.prototype.getChildByName = function getChildByName( name )
{
    var skinObject = property.call(this,'skinObject');
    var children = skinObject.children;
    for( var i in children )
    {
        if( children[i].attr.name === name )
        {
            return children[i];
        }
    }
    return null;
}

/**
 * 获取所有指定名称的元素
 * @param name
 * @returns {Array}
 */
Skin.prototype.getChildAllByName = function getChildAllByName( name )
{
    var skinObject = property.call(this,'skinObject');
    var children = skinObject.children;
    var items=[];
    for( var i in children )
    {
        if( children[i].attr.name === name )
        {
            items.push( children[i] );
        }
    }
    return items;
}

/**
 * 添加一个子级元素
 * @param child
 */
Skin.prototype.addChild = function addChild( child )
{
    var skinObject = property.call(this,'skinObject');
    var children = skinObject.children;
    if( !System.is(child, Skin) )throw new Error('child is not Skin');
    children.push( child );
    return this;
}

/**
 * 在指定索引位置添加元素
 * @param child
 * @param index
 */
Skin.prototype.addChildAt = function addChildAt( child , index )
{
   var skinObject = property.call(this,'skinObject');
   var children = skinObject.children;
   var len =  children.length;
   if( typeof index !== "number" )throw new Error("Invalid index");
   index = Math.min(len, Math.max( index < 0 ? len+index+1 : index , 0) );
   if( !System.instanceOf(child, Skin) )throw new Error("child is not Skin");
   children.splice(index,0,child);
   return child;
}

/**
 * 移除指定的子级元素
 * @param child
 */
Skin.prototype.removeChild = function removeChild( child )
{
    var skinObject = property.call(this,'skinObject');
    var children = skinObject.children;
    var index  = children.indexOf( child );
    if( index<0 )
    {
        throw new Error("child is not exists");
    }
    return children.splice(index,1);
}

/**
 * 移除指定索引的子级元素
 * @param index
 */
Skin.prototype.removeChildAt = function removeChildAt( index )
{
    var skinObject = property.call(this,'skinObject');
    var children = skinObject.children;
    var len = children.length;
    index = index < 0 ? index+len : index;
    if( index >= len || index < 0 )
    {
        throw new Error("index out of range");
    }
    return children.splice( index , 1);
}

/**
 * 将皮肤对象转html字符串
 */
Skin.prototype.toString=function toString()
{
    var data = property.call(this,'data');
    var skinObject = property.call(this,'skinObject');
    return __toString(skinObject, this, data.mode );
}

/**
 * 对象的表示形式
 * @returns {string}
 */
Skin.prototype.valueOf=function valueOf()
{
    return '[object Skin]';
}

//private
var template_syntax={
    'default': {
        'foreach': function (attr, content) {
            return '<? foreach(' + attr.name + ' as ' + (attr.key || 'key') + ' ' + (attr.value || 'item') + '){ ?>' + content + '<?}?>';
        },
        'if': function (attr, content) {
            return '<? if(' + attr.condition + '){ ?>'+content+'<?}?>';
        },
        'elseif': function (attr, content) {
            return '<? elseif(' + attr.condition + '){ ?>'+content+'<?}?>';
        },
        'else': function (attr, content) {
            return '<? }else{ ?>'+content+'<?}?>';
        },
        'do': function (attr, content) {
            return '<? do{ ?>'+content+'<?}?>';
        },
        'switch': function (attr, content) {
            return '<? switch(' + attr.condition + '){ ?>'+content+'<?}?>';
        },
        'case': function (attr, content) {
            content = '<? case "' + attr.condition + '": ?>'+content;
            if( attr["break"] )content+='\nbreak;';
            return content;
        },
        'default': function (attr, content) {
            return '<? default: ?>'+content;
        },
        'break': function (attr, content) {
            return '<? break; ?>'+content;
        },
        'end': function (attr, content) {
            return content+='<?}?>';
        },
        'while': function (attr, content) {
            return '<? while(' + attr.condition + '){ ?>'+content+'<?}?>';
        },
        'code': function (attr, content) {
            return '<? code{ ?>'+content+' <? } ?>';
        },'script': function (attr, content) {
            return '<? code{ ?>'+content+' <? } ?>';
        }
    }
}

//private
function __toString(skin, parent, mode )
{
    if( mode === Skin.BUILD_CLOSE_MODE )return '';
    var tag = skin.name || 'div';
    var attr = skin.attr || {};
    var children = skin.children || [];
    var content='';
    if( (mode & Skin.BUILD_CHILDREN_MODE) === Skin.BUILD_CHILDREN_MODE )
    {
        for (var c in children)
        {
            var child = children[c];
            if (System.is(child, EventDispatcher))
            {
                var event = new SkinEvent(SkinEvent.INSTALLING);
                event.viewport = skin;
                event.hostComponent = parent;
                event.skinContent = child;
                Reflect.apply( Reflect.get(child,"dispatchEvent"),child, [event] );
                child = event.skinContent;
                content += Reflect.apply( Reflect.get(child,"toString"), child );
                
            } else if (child + "" === "[object Object]")
            {
                content += __toString(child, parent, Skin.BUILD_ALL_MODE );

            } else if (child)
            {
                content += child;
            }
        }
    }
    var temp = tag.indexOf(':');
    if( temp>=0 )
    {
        var syntax = tag.substr(0,temp);
        tag = tag.substr(temp+1);
        syntax = syntax || 'default';
        syntax = template_syntax[ syntax ];
        if( !syntax[tag] )throw new SyntaxError('Syntax tag is not supported for "'+tag+'"');
        return syntax[tag](attr,content);
    }
    if( tag==='text' )return content;
    if( (mode & Skin.BUILD_CONTAINER_MODE) === Skin.BUILD_CONTAINER_MODE )
    {
        var str = '<' + tag;
        for (var p in attr) {
            str += " " + p + '="' + attr[p] + '"';
        }
        str += '>' + content + '</' + tag + '>';
        content = str;
    }
    return content;
}

System.Skin=Skin;