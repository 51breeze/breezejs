
/**
 * 皮肤类
 * @constructor
 * @require Internal,Object,TypeError,Math,EventDispatcher,Reflect,Symbol,Render,Element
 */

/**
 * @private
 */
var storage=Internal.createSymbolStorage( Symbol('skin') );
var has = $Object.prototype.hasOwnProperty;

function Skin( skinObject )
{
    skinObject = skinObject || {};
    var attr=skinObject.attr || {};
    var name = skinObject.name || 'div';
    if( !attr.id )attr.id=System.uid();
    storage(this, true,{
        'mode':Skin.BUILD_ALL_MODE,
        'parent':null,
        'attr': attr,
        'name': name,
        'id': skinObject.id || {},
        'children': skinObject.children || []
    });
    Element.call(this);
}

Skin.toString = function toString()
{
   return "[class Skin]";
}

Skin.valueOf = function valueOf()
{
    return "[class Skin]";
}

//不构建
Skin.BUILD_CLOSE_MODE = 0;

//构建主容器
Skin.BUILD_CONTAINER_MODE = 1;

//构建子级
Skin.BUILD_CHILDREN_MODE = 2;

//构建全部
Skin.BUILD_ALL_MODE = 3;

Skin.prototype = Object.create( Element.prototype );
Skin.prototype.constructor = Skin;

/**
 * 皮肤属性
 * @param name
 * @param val
 * @returns {*}
 */
Skin.prototype.attr = function attr(name, val)
{
    var data = storage(this,'attr');
    if( typeof name === "string" )
    {
        if( typeof val !== "undefined" )
        {
            data[name]=val;
            return this;
        }
        return data[name];
    }
    return data;
}

/**
 * 指示如何构建皮肤,默认为所有
 * @param mode
 * @returns {number|*}
 */
Skin.prototype.buildMode =function buildMode( mode )
{
    if( typeof mode === "number" )
    {
       if( (mode | Skin.BUILD_ALL_MODE) !== Skin.BUILD_ALL_MODE )
       {
           throw new Error('Invalid build mode');
       }
       storage(this,'mode', mode);
       return this;
    }
    return storage(this,'mode');
}

/**
 * 获取父级皮肤元素
 * 只有已经添加到父级元素中才会返回父级皮肤元素，否则返回 null
 * @returns {null|Skin}
 */
Skin.prototype.parent=function parent()
{
    return storage(this,'parent') || null;
}

/**
 * 获取子级元素
 * @returns {Array}
 */
Skin.prototype.children=function children()
{
    return storage(this,'children') || [];
}

/**
 * 获取指定索引处的子级元素
 * @param index
 * @returns {null}
 */
Skin.prototype.getChildAt=function getChildAt( index )
{
    var children = storage(this,'children');
    if( typeof index === "number" )
    {
        return children[index] || null;
    }
    throw new TypeError('Invalid index');
}

/**
 * 根据子级皮肤返回索引
 * @param child
 * @returns {Number}
 */
Skin.prototype.getChildIndex=function getChildIndex( child )
{
    var children = storage(this,'children');
    for( var i in children )
    {
        if( children[i] === child )
        {
            return i;
        }
    }
    return -1;
}

/**
 * 根据id获取子级元素
 * @param id
 * @returns {*}
 */
Skin.prototype.getChildById = function getChildById( id )
{
    var data = storage(this,'id');
    if( has.call(data, id) )
    {
        return data[id];
    }
    for( var i in children )
    {
        if( (children[i] instanceof Skin && children[i].attr('id') === id) || (children[i].attr && children[i].attr.id===id) )
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
    var children = storage(this,'children');
    for( var i in children )
    {
        if( children[i] instanceof Skin && children[i].name() === name )
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
    var children = storage(this,'children');
    var items=[];
    for( var i in children )
    {
        if( children[i] instanceof Skin && children[i].name() === name )
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
    var children =  storage(this,'children');
    if( !System.is(child, Skin) )throw new Error('is not Skin');
    if( storage(child,'parent') )throw new Error("child skin is added");
    children.push( child );
    storage(child,'parent', this);
    var event = new SkinEvent( SkinEvent.ADD );
    event.parent = this;
    child.dispatchEvent( event );
    return this;
}

/**
 * 在指定索引位置添加元素
 * @param child
 * @param index
 */
Skin.prototype.addChildAt = function addChildAt( child , index )
{
   var skinObject = storage(this,'skinObject');
   var children = skinObject.children;
   var len =  children.length;
   if( typeof index !== "number" )throw new Error("Invalid index");
   index = Math.min(len, Math.max( index < 0 ? len+index+1 : index , 0) );
   if( !System.instanceOf(child, Skin) )throw new Error("is not Skin");
   if( storage(child,'parent') )throw new Error("child skin is added");
   children.splice(index,0,child);
    storage(child,'parent', this);
    var event = new SkinEvent( SkinEvent.ADD );
    event.parent = this;
    child.dispatchEvent( event );
    return child;
}

/**
 * 移除指定的子级元素
 * @param child
 */
Skin.prototype.removeChild = function removeChild( child )
{
    var skinObject = storage(this,'skinObject');
    var children = skinObject.children;
    var index  = children.indexOf( child );
    if( index<0 )throw new Error("child is not exists");
    children.splice(index,1);
    storage(child,'parent', null);
    var event = new SkinEvent( SkinEvent.REMOVE );
    event.parent = this;
    child.dispatchEvent( event );
    return child;
}

/**
 * 移除指定索引的子级元素
 * @param index
 */
Skin.prototype.removeChildAt = function removeChildAt( index )
{
    var skinObject = storage(this,'skinObject');
    var children = skinObject.children;
    var len = children.length;
    index = index < 0 ? index+len : index;
    if( index >= len || index < 0 )throw new Error("index out of range");
    var child = children.splice( index , 1);
    storage(child,'parent', null);
    var event = new SkinEvent( SkinEvent.REMOVE );
    event.parent = this;
    child.dispatchEvent( event );
    return child;
}

/**
 * 为当前的皮肤添加一组子级元素
 * @param childElement
 */
Skin.prototype.html = function html( childElement )
{
     if( !this[0] )
     {
         Element.prototype.splice.call(this,0,0,Element.prototype.current.call(this, '#'+storage(this,'attr').id ) );
     }
     if( !System.isHTMLElement( this[0] ) )throw new ReferenceError('container element is null');
     Element.prototype.html.call(this, childElement );
}

/**
 * 当组件准备生成皮肤之前会调用此方法，无需手动调用
 * @param host
 */
Skin.prototype.initializing = function initializing( host )
{
};

/**
 * 当组件此生成皮肤结束并且将此皮肤添加到视图中后由系统调用此方法，无需手动调用
 * @param viewport
 */
Skin.prototype.initialized = function initialized( viewport )
{
};

/**
 * 返回一个皮肤渲染器
 * 用来生成一些可变的皮肤
 * @param Object dataitem
 * @returns Render
 */
Skin.prototype.render=function render( dataitem )
{
    var r = storage(this,'render');
    if( !r )
    {
        r = new Render();
        storage(this,'render', r );
    }
    if( dataitem+"" === "[object Object]" )
    {
        r.variable(true, dataitem);
    }
    return r;
}

/**
 * 将皮肤对象转字符串
 */
Skin.prototype.toString=function toString( mode )
{
    var skinObject = storage(this);
    var skin = __toString( skinObject ,  mode || skinObject.mode );
    var r =  storage(this,'render');
    return r ? r.fetch( skin ) : skin;
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
function __toString(skin,  mode )
{
    if( mode === Skin.BUILD_CLOSE_MODE )return '';
    var tag = skin.name || 'div';
    var children = skin.children || [];
    var attr = skin.attr || {};
    var content='';
    if( (mode & Skin.BUILD_CHILDREN_MODE) === Skin.BUILD_CHILDREN_MODE )
    {
        for (var c in children)
        {
            var child = children[c];
            if ( child+"" === "[object Object]" )
            {
                content += __toString(child, Skin.BUILD_ALL_MODE );
            } else
            {
                content += child.toString();
            }
        }
    }

    if( tag==='text' )return content;
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
System.Skin=Skin;