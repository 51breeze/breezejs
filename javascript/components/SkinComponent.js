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
    if( viewport )this.setViewport(viewport);
    //将组件应用在皮肤类中时会触发此事件
    this.addEventListener( SkinEvent.INITIALIZING , function (e) {
        e.skinContent = this.skinInitialize( e );
    });
}

SkinComponent.prototype= Object.create( Component.prototype );
SkinComponent.prototype.constructor=SkinComponent;

/**
 * 初始化皮肤。
 * 此阶段为编译阶段将皮肤转化成html
 * 此函数无需要手动调用，皮肤在初始化时会自动调用
 */
SkinComponent.prototype.skinInitialize=function skinInitialize( event )
{
    return this.getSkin().initializing();
}

/**
 * 组件初始化进行中
 * @returns {Component}
 */
SkinComponent.prototype.initializing=function initializing()
{
    return this;
}

/**
 * 组件初始完成
 * @returns {boolean}
 */
SkinComponent.prototype.initialized=function initialized()
{
    if( !Component.prototype.initialized.call(this) )
    {
        this.getSkin().initialized();
        return false;
    }
    return true;
}

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
        this.__skin__ = new Skin();
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
        throw new TypeError('is not an skin object');
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
    this.initializing();
    var viewport = this.getViewport();
    if( !viewport )throw new TypeError('viewport not is null');
    viewport.html( this.skinInitialize().toString() );
    this.initialized();
    return this;
};

System.SkinComponent = SkinComponent;
