/**
 * 皮肤类
 * @constructor
 * @require Object,Class,TypeError,EventDispatcher,Render,Math
 */
function Skin( skinObject )
{
    if( skinObject+"" === "[object Object]")
    {
        this.__skin__ = skinObject;
    }
    EventDispatcher.call(this);
}

Skin.prototype = Object.create( EventDispatcher.prototype );
Skin.prototype.constructor = Skin;
Skin.prototype.__skin__= {
    name: 'div',
    attr: {},
    children: [],
    parent:null
}

/**
 * 初始化皮肤。此阶段为编译阶段将皮肤转化成html
 * 此函数无需要手动调用，皮肤在初始化时会自动调用
 */
Skin.prototype.skinInitializing=function skinInitializing()
{
    return this;
}

/**
 * 初始化完成。此阶段为皮肤已经完成准备工作并已添加到document中
 * 此函数无需要手动调用，皮肤在初始化完成后会自动调用
 */
Skin.prototype.skinInitialized=function skinInitialized(){}

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
    var children = this.__skins__.children;
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
    var children = this.__skins__.children;
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
    var children = this.__skins__.children;
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
   var len = this.__skins__.children;
   index = Math.min(len, Math.max( index < 0 ? len+index : index , 0) );
   if(child.name==null)throw new Error("Invalid child");
   this.__skins__.children.splice(index,0,child);
   return child;
}

/**
 * 移除指定的子级元素
 * @param child
 */
Skin.prototype.removeChild = function removeChild( child )
{
    return this.removeChildAt( this.__skins__.children.indexOf( child ) );
}

/**
 * 移除指定索引的子级元素
 * @param index
 */
Skin.prototype.removeChildAt = function removeChildAt( index )
{
    if( System.isNaN(index) || (index < 0 || index >= this.__skins__.children.length) )
    {
        throw new Error("Invalid index");
    }
    var child = this.__skins__.children[index];
    if( !child || child.name==null )
    {
         throw new Error("is not exists of child element");
    }
    this.__skins__.children.splice(index,1);
    return child;
}

/**
 * 将皮肤对象转html字符串
 */
Skin.prototype.toString=function toString()
{
    if( !this.__skin__.attr.id )
    {
        this.__skin__.attr.id = System.uid();
    }
    if(this.__skin__.name==='skin')
    {
        this.__skin__.name='div';
    }
    return __toString( this.__skin__ ).join("");
}

/**
 * 对象的表示形式
 * @returns {string}
 */
Skin.prototype.valueOf=function valueOf()
{
    return '[object Skin]';
}

var template_syntax={
    'default': {
        'foreach': function (attr, content) {
            content.unshift('<? foreach(' + attr.name + ' as ' + (attr.key || 'key') + ' ' + (attr.value || 'item') + '){ ?>')
            content.push('<?}?>')
            return content;
        },
        'if': function (attr, content) {
            content.unshift('<? if(' + attr.condition + '){ ?>')
            content.push('<?}?>')
            return content;
        },
        'elseif': function (attr, content) {
            content.unshift('<? elseif(' + attr.condition + '){ ?>')
            content.push('<?}?>')
            return content;
        },
        'else': function (attr, content) {
            content.unshift('<? }else{ ?>')
            content.push('<?}?>')
            return content;
        },
        'do': function (attr, content) {
            content.unshift('<? do{ ?>')
            content.push('<?}?>')
            return content;
        },
        'switch': function (attr, content) {
            content.unshift('<? switch(' + attr.condition + '){ ?>')
            return content;
        },
        'case': function (attr, content) {
            content.unshift('<? case "' + attr.condition + '": ?>')
            return content;
        },
        'default': function (attr, content) {
            content.unshift('<? default: ?>')
            return content;
        },
        'break': function (attr, content) {
            content.unshift('<? break; ?>')
            return content;
        },
        'end': function (attr, content) {
            content.push('<?}?>');
            return content;
        },
        'function': function (attr, content) {
            content.unshift('<? function ' + attr.name + '(){ ?>')
            content.push('<?}?>')
            return content;
        },
        'while': function (attr, content) {
            content.unshift('<? while(' + attr.condition + '){ ?>')
            content.push('<?}?>')
            return content;
        },
        'code': function (attr, content) {
            content.unshift('<? code{ ?>')
            content.push(' <? } ?>')
            return content;
        },'script': function (attr, content) {
            content.unshift('<? code{ ?>')
            content.push(' <? } ?>')
            return content;
        },
    }
}

//@private
function __toString( skin )
{
    if( typeof skin === "string" )return skin;
    var tag = skin.name;
    var content=[];
    if( skin.children instanceof Array )
    {
        for(var c in skin.children )
        {
            var child = skin.children[c];
            if( child.skinInitializing && typeof child.skinInitializing === "function" )
            {
                var val = child.skinInitializing();
                content.push( val.toString() );

            }else if( child+"" === "[object Object]" )
            {
                content = content.concat( __toString( child ) )

            }else if( child )
            {
                content.push( child );
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
        return syntax[tag](skin.attr,content);
    }
    if( tag==='text' )return content;
    var str='<'+tag;
    str+=__toAttrString( skin.attr );
    content.unshift( str+'>' )
    content.push( '</'+tag+'>' )
    return content;
}

function __toAttrString( attr )
{
    var str="";
    for(var p in attr )
    {
        str+=" "+p+'="'+attr[p]+'"';
    }
    return str;
}

System.Skin=Skin;