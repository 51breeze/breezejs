/**
 * 皮肤类
 * @constructor
 * @require Object,TypeError,Math,EventDispatcher,SkinEvent,Reflect
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
    EventDispatcher.call(this);
}

Skin.prototype = Object.create( EventDispatcher.prototype );
Skin.prototype.constructor = Skin;
Skin.prototype.__skin__= {
    "name": 'div',
    "attr": {},
    "children": []
};

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

//不构建
Skin.BUILD_CLOSE_MODE = 0;

//构建主容器
Skin.BUILD_CONTAINER_MODE = 1;

//构建子级
Skin.BUILD_CHILDREN_MODE = 2;

//构建全部
Skin.BUILD_ALL_MODE = 3;

/**
 * @private
 */
Skin.prototype.__buildMode__ = Skin.BUILD_ALL_MODE;

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
       this.__buildMode__=mode;
       return this;
   }
   return this.__buildMode__;
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
    return __toString(this.__skin__, this , this.buildMode() );
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
    var tag = skin.name;
    var attr = skin.attr;
    var children = skin.children;
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
                event.skinContent = null;
                Reflect.apply( Reflect.get(child,"dispatchEvent"),child, [event] );
                var skinObj = event.skinContent===null ? child : event.skinContent;
                content += skinObj.toString();

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