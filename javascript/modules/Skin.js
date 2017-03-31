/**
 * 皮肤类
 * @constructor
 * @require Object, EventDispatcher,Class
 */
function Skin()
{
    EventDispatcher.call(this);
}
Skin.prototype = Object.create( EventDispatcher.prototype );
Skin.prototype.constructor = Skin;
Skin.prototype.__skins__ = {
    name:'div',
    attr:{},
    children:[],
    id:'',
    cdata:''
};
/**
 * 根据id获取子级元素
 * @param id
 * @returns {*}
 */
Skin.prototype.getChildById = function getChildById( id )
{
    var children = this.__skins__.children;
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

var template_syntax={
    'default': {
        'foreach': function (attr, content) {
            return '<? foreach(' + attr.name + ' as ' + (attr.key || 'key') + ' ' + (attr.value || 'item') + '){ ?>' + content + '<?}?>';
        },
        'if': function (attr, content) {
            return '<? if(' + attr.condition + '){ ?>' + content + '<?}?>';
        },
        'elseif': function (attr, content) {
            return '<? elseif(' + attr.condition + '){ ?>' + content + '<?}?>';
        },
        'else': function (attr, content) {
            return '<? }else{ ?>' + content + '<?}?>';
        },
        'do': function (attr, content) {
            return '<? do{ ?>' + content + '<?}?>';
        },
        'switch': function (attr, content) {
            return '<? switch(' + attr.condition + '){ ?>';
        },
        'case': function (attr, content) {
            return '<? case "' + attr.condition + '": ?>' + content;
        },
        'default': function (attr, content) {
            return '<? default: ?>'+content;
        },
        'break': function (attr, content) {
            return '<? break; ?>';
        },
        'end': function (attr, content) {
            return '<? } ?>';
        },
        'function': function (attr, content) {
            return '<? function ' + attr.name + '(){ ?>' + content + '<? } ?>';
        },
        'while': function (attr, content) {
            return '<? while(' + attr.condition + '){ ?>' + content + '<? } ?>';
        },
        'code': function (attr, content) {
            return '<? code{ ?>'+content +' <? } ?>';
        },
    }
}

//@private
function __toString( skin )
{
    var tag = skin.name;
    if( !tag )return '';
    if( tag==='text' )return skin.children.join("");
    var content='';
    if( tag==='cdata' )
    {
        content = skin.children.join("");
        tag = ':code';

    }else
    {
        for(var c in skin.children )
        {
            var child = skin.children[c];
            if( tag==='skin' && child.name==='cdata')
            {
                skin.cdata = child.children.join("");

            }else
            {
                content += __toString( child );
            }
        }
        if( tag==='skin' )tag='div';
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

    var str='<';
    var val;
    str+=tag;
    for(var p in skin.attr )
    {
        val = p==='id' ? skin.id : skin.attr[p];
        str+=" "+p+'="'+val+'"';
    }
    str+='>';
    str+=content;
    str+='</'+tag+'>';
    return str;
}

/**
 * 将皮肤对象转html字符串
 */
Skin.prototype.toString=function toString()
{
    return __toString( this.__skins__ );
}

/**
 * 对象的表示形式
 * @returns {string}
 */
Skin.prototype.valueOf=function valueOf()
{
    return '[Skin object]';
}
System.Skin=Skin;