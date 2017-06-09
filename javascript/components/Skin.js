
/**
 * 皮肤类
 * @constructor
 * @require Internal,Object,TypeError,Math,EventDispatcher,Reflect,Symbol,Render,Element,SkinEvent
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
    var hash = skinObject.hash;
    if( hash )
    {
        for(var h in hash )
        {
           if( hash[h]==='@id' )
           {
               hash[h] = System.uid();
               if( attr.id===h ) attr.id = hash[h];
           }
        }
    }
    storage(this, true,{
        'parent':null,
        'hostComponent':null,
        'validation':false,
        'attr': attr,
        'name': name,
        'stateGroup':{},
        'hash': skinObject.hash || {},
        'children': skinObject.children || []
    });
    Element.call(this, '<'+name+'/>');
    Element.prototype.property.call(this,attr);
}

Skin.prototype = Object.create( Element.prototype );
Skin.prototype.constructor = Skin;

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
 * 根据id获取子级元素
 * @param id
 * @returns {*}
 */
Skin.prototype.getChildById = function getChildById( id )
{
    var data = storage(this,'hash');
    if( has.call(data, id) )
    {
        return data[id];
    }
    return null;
}

/**
 * 获取指定索引处的子级元素
 * @param index
 * @returns {Skin}
 */
Skin.prototype.getChildAt=function getChildAt( index )
{
    var children = storage(this, 'children');
    index = index < 0 ? index+children.length : index;
    var result = children[index] && System.instanceOf(children[index],Skin) ? children[index] : null;
    if( result=== null )
    {
        throw new RangeError('index out of range');
    }
    return result;
}

/**
 * 根据子级皮肤返回索引
 * @param child
 * @returns {Number}
 */
Skin.prototype.getChildIndex=function getChildIndex( child )
{
    var children = storage(this, 'children');
    for(var i in children )
    {
         if( children[i] === child && System.instanceOf(children[i] , Skin) )
         {
             return i;
         }
    }
    return -1;
}

/**
 * 添加一个子级元素
 * @param child
 */
Skin.prototype.addChild = function addChild( childElement )
{
    return Skin.prototype.addChildAt.call(this, childElement, -1 );
}

/**
 * 在指定索引位置添加元素
 * @param child
 * @param index
 * @returns Skin
 */
Skin.prototype.addChildAt = function addChildAt( childElement , index )
{
    if( System.instanceOf( childElement, Skin ) )
    {
        var childSkin = Skin.prototype.getChildAt(index);
        Element.prototype.addChildAt.call(this, childElement.current() , Element.prototype.getChildIndex( childSkin.current() ) );
        storage( this,'children' ).splice(index,0, childElement);
        storage( childElement, 'parent', this);
        return childElement;
    }
    throw new TypeError('is not child Skin');
}

/**
 * 移除指定的子级元素
 * @param Element
 * @returns Skin
 */
Skin.prototype.removeChild = function removeChild( childElement )
{
    var index = Skin.prototype.getChildIndex(childElement);
    if( index >= 0 )
    {
        Element.prototype.removeChild.call(this, childElement.current() );
        storage(this,'children').splice(index,1);
        storage(childElement,'parent', null);
        return childElement;
    }
    throw new ReferenceError('child skin does not exists');
}

/**
 * 移除指定索引的子级元素
 * @param Element
 * @returns Skin
 */
Skin.prototype.removeChildAt = function removeChildAt( index )
{
    var child=Skin.prototype.getChildAt(index);
    Element.prototype.removeChild.call(this, child.current() );
    storage(this,'children').splice(index,1);
    storage(child,'parent', null);
    return child;
}

/**
 * 为当前的皮肤添加一组子级元素, 并清空当前已存在的子级元素
 * @param childElement
 * @returns Skin
 */
Skin.prototype.html = function html( childElement )
{
     if( !System.instanceOf(childElement,Skin) )
     {
         throw new TypeError('is not child Skin');
     }
     Element.prototype.html.call(this, childElement );
     storage(this,'children', [childElement] );
     storage(childElement,'parent', this );
     return childElement;
}

/**
 * 当组件准备生成皮肤之前会调用此方法，无需手动调用
 */
Skin.prototype.initializing = function initializing()
{
    if( storage(this,'initializing_flag') !== true )
    {
        storage(this,'initializing_flag',true);
        var children = storage(this, 'children');
        var v;
        for (var i in children) {
            v = children[i]+"";
            if( !(v === '[object Object]' || v===v) )
            {
                Reflect.apply(Reflect.get(children[i], "initializing"), children[i]);
            }
        }
        return true;
    }
    return false;
};

/**
 * 当组件此生成皮肤结束并且将此皮肤添加到视图中后由系统调用此方法，无需手动调用
 */
Skin.prototype.initialized = function initialized()
{
    if( storage(this,'initialized_flag') !== true )
    {
        storage(this,'initialized_flag',true);
        var children = storage(this, 'children');
        var v;
        for (var i in children) {
            v = children[i]+"";
            if( !(v === '[object Object]' || v===v) )
            {
                Reflect.apply(Reflect.get(children[i], "initialized"), children[i]);
            }
        }
        return false;
    }
    return true;
};

/**
 * 设置状态对象
 * 如果在每一个子皮肤中应用了当前状态，那么这些皮肤会随着状态的变化来决定是否显示在当前的视图中
 * @param String name
 * @param Array group
 */
Skin.prototype.stateGroup = function stateGroup(name,group)
{
    var data = storage(this,'stateGroup');
    if( typeof name !== "string" )
    {
        throw new TypeError('Invalid param name in Skin.prototype.stateGroup');
    }
    if( group != null && !(System.instanceOf(group, System.Array) ) )
    {
        throw new TypeError('Invalid param group in Skin.prototype.stateGroup');
    }
    data[name] = group || [name];
    return this;
};

/**
 * 获取设置当前状态组名
 * @returns {Skin}
 */
Skin.prototype.setCurrentState = function setCurrentState( name )
{
    if( typeof name !== "string" )
    {
        throw new TypeError('Invalid param name in Skin.prototype.currentState');
    }
    var currentState = storage(this,'currentState');
    if( currentState !== name )
    {
        storage(this,'currentState', name);
        EventDispatcher.prototype.dispatchEvent.call(this, new SkinEvent('internal_skin_state_changed') );
        Reflect.apply( Reflect.get( this ,"updateDisplayList") , this );
    }
    return this;
}

/**
 * 获取当前状态组名
 * @returns {String}
 */
Skin.prototype.getCurrentState = function getCurrentState()
{
     return storage(this,'currentState') || null;
}

/**
 * 在初始化皮肤皮会先设置宿主组件
 * @param host
 * @returns {Object}
 */
Skin.prototype.hostComponent = function hostComponent(host)
{
    var _host = storage(this,'hostComponent');
    if( host != null && _host===null );
    {
        storage(this,'hostComponent', host );
        var children = storage(this,'children');
        var v;
        for (var i in children)
        {
            v = children[i]+"";
            if( !(v === '[object Object]' || v===v) )
            {
                Reflect.apply( Reflect.get( children[i] ,"hostComponent") ,  children[i] , host );
            }
        }
        return this;
    }
    return _host;
};

/**
 * 创建一组子级元素
 * 当前皮肤被添加到视图中后会自动调用，无需要手动调用
 */
Skin.prototype.createChildren = function createChildren()
{
    var skinObject = storage(this);
    var children = skinObject.children;
    var hash = skinObject.hash;
    Element.prototype.html.call(this, '');
    for (var c in children)
    {
        var child = children[c];
        if( child+"" === '[object Object]' )
        {
            child = __toString(child, hash );
        }
        if( child+"" === child )
        {
            var r =  storage(this,'render');
            child = r ? r.fetch( child ) : child;
            if( child ){
                Element.prototype.addChildAt.call(this, Element.createElement( child ),-1 );
            }

        }else
        {
            Reflect.apply( Reflect.get(child,"createChildren"), child );
            Element.prototype.addChildAt.call(this, child,-1);
            storage(child,'parent', this);
            Reflect.apply( Reflect.get(child,"updateDisplayList") , child );
        }
    }
    //触发完成事件
    EventDispatcher.prototype.dispatchEvent.call(this, new SkinEvent('internal_create_children_completed') );
};

/**
 * 更新显示列表
 */
Skin.prototype.updateDisplayList=function updateDisplayList()
{
    var currentState = storage(this,'currentState');
    if( currentState )
    {
        var stateGroup = storage(this,'stateGroup');
        if( !stateGroup || !System.instanceOf(stateGroup[currentState],System.Array) )
        {
            throw new ReferenceError('Stage group is not defined for "'+currentState+'"');
        }
        Element('[includein*=]', this).forEach(function () {
            if( this.property('includein') !== currentState )
            {
                this.hide();
            }else{
                this.show();
            }
        });
    }
}

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
Skin.prototype.toString=function toString()
{
    var skinObject = storage(this);
    var skin = __toString( skinObject , skinObject.hash );
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
function __toString(skin, hash )
{
    var tag = skin.name || 'div';
    var children = skin.children || [];
    var attr = skin.attr || {};
    var content='';
    for (var c in children)
    {
        var child = children[c];
        if ( child+"" === "[object Object]" )
        {
            content += __toString(child, hash );
        } else
        {
            content += child.toString();
        }
    }
    if( tag==='text' )return content;
    var str = '<' + tag;
    for (var p in attr)
    {
        var v = attr[p];
        v = p==='id' && has.call(hash,v) ? hash[v] : v;
        str += " " + p + '="' + v + '"';
    }
    str += '>' + content + '</' + tag + '>';
    return str;
}
System.Skin=Skin;