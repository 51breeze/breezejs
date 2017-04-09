/*
* BreezeJS Component class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
*/

/**
 * 所有皮肤组件的基类。
 * 只有需要显示皮肤的组件才需要继承此类。此组件是 Component 的子类，具备 Component 的特性。
 * 有关SkinGroup的用法请查看SkinGroup的说明。
 * @param SkinGroup skinGroup
 * @returns {Component}
 * @constructor
 * @require Component,Element,Render,TypeError,Skin,SkinEvent
 */
function SkinComponent( viewport )
{
    if( !(this instanceof SkinComponent) )return new SkinComponent(viewport);
    Component.call(this);
    if( viewport )
    {
        this.setViewport(viewport);
    }
}

SkinComponent.prototype= Object.create( Component.prototype );
SkinComponent.prototype.constructor=SkinComponent;

/**
 * 初始化皮肤。此阶段为编译阶段将皮肤转化成html
 * 此函数无需要手动调用，皮肤在初始化时会自动调用
 */
SkinComponent.prototype.skinInitializing=function skinInitializing()
{
    return this.getSkin().skinInitializing();
}

/**
 * 初始化完成。此阶段为皮肤已经完成准备工作并已添加到document中
 * 此函数无需要手动调用，皮肤在初始化完成后会自动调用
 */
SkinComponent.prototype.skinInitialized=function skinInitialized()
{
    var e = new SkinEvent( SkinEvent.INITIALIZED );
    this.getSkin().dispatchEvent( e );
}

/**
 * 获取/设置宽度
 * @param value
 * @returns {*}
 * @public
 */
SkinComponent.prototype.width=function(value)
{
    /* var viewport = this.viewport();
     if( typeof value === "number" )
     {
     viewport.width( value );
     return this;
     }
     return viewport.width();*/
};

/**
 * 获取/设置高度
 * @param value
 * @returns {*}
 * @public
 */
SkinComponent.prototype.height=function(value)
{
    /*var viewport = this.viewport();
     if(  typeof value === "number" )
     {
     viewport.height( value );
     return this;
     }
     return viewport.height();*/
};

/**
 * @private
 */
SkinComponent.prototype.__skin__=null;

/**
 * 设置皮肤对象
 * @returns {Skin}
 */
SkinComponent.prototype.getSkin=function getSkin()
{
    if( this.__skin__ === null )
    {
        this.__skin__ = new System.Skin();
    }
    return this.__skin__;
};

/**
 * 设置皮肤对象
 * @param skinObj
 * @returns {SkinComponent}
 */
SkinComponent.prototype.setSkin=function setSkin( skinObj )
{
    if( !System.is(skinObj,System.Skin) )
    {
        throw new TypeError('is not an skin type');
    }
    this.__skin__ = skinObj;
    return this;
};

/**
 * @private
 */
SkinComponent.prototype.__viewport__=null;

/**
 * @returns {Element|Null}
 * @public
 */
SkinComponent.prototype.getViewport=function getViewport()
{
    return this.__viewport__;
};

/**
 * @param viewport
 * @returns {SkinComponent}
 * @public
 */
SkinComponent.prototype.setViewport=function setViewport( viewport )
{
    if( !System.is(viewport,Element) )
    {
        throw new TypeError('Invalid viewport');
    }
    this.__viewport__=viewport;
    return this;
};

/**
 * @private
 */
SkinComponent.prototype.__render__=null;

/**
 * 皮肤的渲染器
 * @returns {Render}
 */
SkinComponent.prototype.getRender=function getRender()
{
    if( this.__render__ === null )
    {
        this.__render__ = new Render();
    }
    return this.__render__;
}

/**
 * 设置一个变量到渲染器
 * @param name
 * @param value
 * @returns {SkinComponent}
 */
SkinComponent.prototype.variable=function variable(name, value)
{
    this.getRender().variable(name,value);
    return this;
}

/**
 * 渲染显示皮肤
 * @returns {SkinComponent}
 */
SkinComponent.prototype.display=function display()
{
    var viewport = this.getViewport();
    if( !viewport )throw new TypeError('viewport not is null');
    viewport.html( this.skinInitializing().toString() );
    this.skinInitialized();
    return this;
};

System.SkinComponent = SkinComponent;
