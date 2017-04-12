/**
 * 皮肤类
 * @constructor
 * @require Object,Class,TypeError,EventDispatcher,Render,Math
 */
function Skin( skinObject )
{
    if( skinObject+"" === "[object Object]")
    {
        this.__name__ = skinObject.name;
        this.__attr__ = skinObject.attr;
        this.__children__ = skinObject.children;
        this.__parent__ = null;
    }
    this.__attr__.id = System.uid();
    if( this.__name__ === 'skin' )this.__name__='div';
    if( this.__attr__.nodename && typeof this.__attr__.nodename === "string" )this.__name__=this.__attr__.nodename;
    EventDispatcher.call(this);
}

Skin.prototype = Object.create( EventDispatcher.prototype );
Skin.prototype.constructor = Skin;
Skin.prototype.__name__= 'div';
Skin.prototype.__attr__= {};
Skin.prototype.__children__= [];
Skin.prototype.__parent__= null;

/**
 * 初始化皮肤。此阶段为编译阶段将皮肤转化成html
 * 此函数无需要手动调用，皮肤在初始化时会自动调用
 */
Skin.prototype.skinInitializing=function skinInitializing( parentSkin )
{
    if( parentSkin )this.__parent__=parentSkin;
    return this;
}

/**
 * @private
 */
Skin.prototype.__skinInitialized__=false;

/**
 * 初始化完成。此阶段为皮肤已经完成准备工作并已添加到document中
 * 此函数无需要手动调用，皮肤在初始化完成后会自动调用
 */
Skin.prototype.skinInitialized=function skinInitialized()
{
    if( this.__skinInitialized__ === false )
    {
        var children = __getSkinChildren( this.__children__ );
        var num = 0;
        if (children.length > 0)
        {
            for (var i in children)
            {
                num++;
                if( children[i].skinInitialized() )num--;
            }
        }
        if (num === 0)
        {
            this.__skinInitialized__ = true;
            if( this.parent() ){

                if( typeof this.parent().skinInitialized !== "function"  )
                {
                    console.log( this.parent() )

                }

                this.parent().skinInitialized();
            }
        }
    }
    return this.__skinInitialized__;
}

/**
 * @param children
 * @returns {Array}
 * @private
 */
function __getSkinChildren( children )
{
    var list=[];
    if (children.length > 0)
    {
        for ( var i in children )
        {
            if (children[i].skinInitialized && typeof children[i].skinInitialized === "function")
            {
                list.push( children[i] );

            }else if( children[i]+"" === '[object Object]')
            {
                list = list.concat( __getSkinChildren( children[i].children ) );
            }
        }
    }
    return list;
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
            this.__attr__[name]=val;
            return this;
        }
        return this.__attr__[name];
    }
    return this.__attr__;
}

/**
 * @returns {null}
 */
Skin.prototype.parent=function parent()
{
    return this.__parent__;
}

/**
 * 根据id获取子级元素
 * @param id
 * @returns {*}
 */
Skin.prototype.getChildById = function getChildById( id )
{
    var children = this.__children__;
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
    var children = this.__children__;
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
    var children = this.__children__;
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
   var len = this.__children__.length;
   index = Math.min(len, Math.max( index < 0 ? len+index : index , 0) );
   if( !System.instanceOf(child, Skin) )throw new Error("Invalid child");
   this.__children__.splice(index,0,child);
   return child;
}

/**
 * 移除指定的子级元素
 * @param child
 */
Skin.prototype.removeChild = function removeChild( child )
{
    return this.removeChildAt( this.__children__.indexOf( child ) );
}

/**
 * 移除指定索引的子级元素
 * @param index
 */
Skin.prototype.removeChildAt = function removeChildAt( index )
{
    if( System.isNaN(index) || (index < 0 || index >= this.__children__.length) )
    {
        throw new Error("Invalid index");
    }
    var child = this.__children__[index];
    if( !child || child.name==null )
    {
         throw new Error("is not exists of child element");
    }
    this.__children__.splice(index,1);
    return child;
}

/**
 * 将皮肤对象转html字符串
 */
Skin.prototype.toString=function toString()
{
    return __toString( this, false, this );
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
function __toString( skin , is_object, skinObj )
{
    if( typeof skin === "string" )return skin;
    var tag;
    var children;
    var attr;
    var content='';
    if( is_object )
    {
        tag = skin.name;
        children = skin.children;
        attr = skin.attr;

    }else
    {
        tag = skin.__name__;
        children = skin.__children__;
        attr = skin.__attr__;
    }

    for(var c in children )
    {
        var child = children[c];
        if( child.skinInitializing && typeof child.skinInitializing === "function" )
        {
            var val = child.skinInitializing( skinObj );
            content += val.toString();

        }else if( child+"" === "[object Object]" )
        {
            content += __toString( child , true , skinObj );

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