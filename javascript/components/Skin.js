/**
 * 皮肤类
 * @constructor
 * @require Object,TypeError,Math,Component,SkinEvent
 */
function Skin( skinObject )
{
    if( skinObject+"" === "[object Object]")
    {
        this.__skin__=skinObject;
    }
    this.__skin__.attr.id = System.uid();
    if( this.__skin__.name === 'skin' )this.__skin__.name='div';
    if( this.__skin__.attr.nodename && typeof this.__skin__.attr.nodename === "string" )
    {
        this.__skin__.name=this.__skin__.attr.nodename;
        delete this.__skin__.attr.nodename;
    }
    Component.call(this);
}

Skin.prototype = Object.create( Component.prototype );
Skin.prototype.constructor = Skin;
Skin.prototype.__skin__= {
    "name": 'div',
    "attr": {},
    "children": []
};

/**
 * @inherit
 * @returns {boolean}
 */
Skin.prototype.initialized=function initialized()
{
    if( !Component.prototype.initialized.call(this) )
    {
        __initialized(this.__skin__.children, this);
        return false;
    }
    return true;
};

/**
 * @private
 */
function __initialized(children, parent)
{
    for ( var i in children )
    {
        if ( System.is(children[i], Component ) )
        {
            children[i].initialized();
        }else if( children[i]+"" === '[object Object]')
        {
            __initialized( children[i].children, parent);
        }
    }
}

/**
 * 皮肤属性
 * @param name
 * @param val
 * @returns {*}
 */
Skin.prototype.attr = function attr(name, val)
{
    if( typeof name === "string" )
    {
        if( typeof val !== "undefined" )
        {
            this.__skin__.attr[name]=val;
            return this;
        }
        return this.__skin__.attr[name];
    }
    return this.__skin__.attr;
}

/**
 * 根据id获取子级元素
 * @param id
 * @returns {*}
 */
Skin.prototype.getChildById = function getChildById( id )
{
    var children = this.__skin__.children;
    if( Object.prototype.hasOwnProperty.call(this,id) )
    {
        return this[id];
    }
    for( var i in children )
    {
        if( children[i].attr.id === id )
        {
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
    var children =  this.__skin__.children;
    for( var i in children )
    {
        if( children[i].name === name )
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
    var children =  this.__skin__.children;
    var items=[];
    for( var i in children )
    {
        if( children[i].name === name )
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
    return this.addChildAt(child,-1);
}

/**
 * 在指定索引位置添加元素
 * @param child
 * @param index
 */
Skin.prototype.addChildAt = function addChildAt( child , index )
{
   var children = this.__skin__.children;
   var len =  children.length;
   index = Math.min(len, Math.max( index < 0 ? len+index : index , 0) );
   if( !System.instanceOf(child, Skin) )throw new Error("Invalid child");
    children.splice(index,0,child);
   return child;
}

/**
 * 移除指定的子级元素
 * @param child
 */
Skin.prototype.removeChild = function removeChild( child )
{
    return this.removeChildAt(this.__skin__.children.indexOf( child ) );
}

/**
 * 移除指定索引的子级元素
 * @param index
 */
Skin.prototype.removeChildAt = function removeChildAt( index )
{
    var children = this.__skin__.children;
    if( System.isNaN(index) || (index < 0 || index >= children.length) )
    {
        throw new Error("Invalid index");
    }
    var child = children[index];
    if( !child || child.name==null )
    {
         throw new Error("is not exists of child element");
    }
    children.splice(index,1);
    return child;
}

/**
 * 将皮肤对象转html字符串
 */
Skin.prototype.toString=function toString()
{
    return __toString(this.__skin__, this );
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
            if( attr.break )content+='\nbreak;';
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
        },
    }
}

//private
function __toString(skin, parent)
{
    var tag = skin.name;
    var attr = skin.attr;
    var children = skin.children;
    var content='';
    for(var c in children )
    {
        var child = children[c];
        if( System.is(child, Component) )
        {
            var event = new SkinEvent( SkinEvent.INITIALIZING );
            event.viewport = skin;
            event.parent = parent;
            event.skinContent=null;
            child.dispatchEvent( event );
            content += ( event.skinContent !== null ? event.skinContent : child ).toString();

        }else if( child+"" === "[object Object]" )
        {
            content += __toString(child , parent );

        }else if( child )
        {
            content+=child;
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
    var str='<'+tag;
    for(var p in attr )
    {
        str+=" "+p+'="'+attr[p]+'"';
    }
    str+='>'+content+'</'+tag+'>';
    return str;
}

System.Skin=Skin;