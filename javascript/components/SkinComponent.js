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
 * @require Component,Element,Render,TypeError,Skin,SkinEvent,ComponentEvent
 */
function SkinComponent( viewport )
{
    if( !(this instanceof SkinComponent) )return new SkinComponent(viewport);
    Component.call(this);
    if( viewport )this.setViewport(viewport);

    //将组件应用在皮肤类中,并且当host component在安装皮肤时会触发此事件
    //因此，构建在皮肤中的组件都会有一个宿主对象,那就是皮肤
    this.addEventListener( SkinEvent.INSTALLING , function (e)
    {
        this.hostComponent( e.hostComponent );
        e.skinContent = this.skinInstaller( e );
    });
}

SkinComponent.prototype= Object.create( Component.prototype );
SkinComponent.prototype.constructor=SkinComponent;

/**
 * @inherit
 * @param host
 * @returns {Component}
 */
SkinComponent.prototype.hostComponent=function hostComponent( host )
{
    var oldHost = Component.prototype.hostComponent.call(this);
    if( host )
    {
        if (oldHost !== host)
        {
            Component.prototype.hostComponent.call(this, host);
            if (oldHost)oldHost.removeEventListener(ComponentEvent.INITIALIZED, this.display);
            //当宿主对象初始化完成后显示此组件
            host.addEventListener(ComponentEvent.INITIALIZED, this.display, false, 0, this);
        }
        return this;
    }
    return oldHost;
}

/**
 * 安装皮肤。
 * 此阶段为编译阶段将皮肤转化成html
 * 此函数无需要手动调用，皮肤在初始化时会自动调用
 */
SkinComponent.prototype.skinInstaller=function skinInstaller( event )
{
    if( !event )
    {
        event = new SkinEvent( SkinEvent.INSTALLING );
        event.viewport = this.getViewport();
        event.hostComponent = this;
        event.skinContent = this.getSkin();
        event.skinContent.dispatchEvent( event );
        return event.skinContent.toString();

    }else if( event.viewport && !this.getViewport() )
    {
        //获取视图ID
        //这是从皮肤视图中来调用的皮肤安装器，这个阶段还没有添加到文档中，所以只能先获取一个占位视口。
        //需要等待宿主对象初始化完成后，调用display方法后再创建一个可用的视口元素。
        if(!event.viewport.attr.id)event.viewport.attr.id = System.uid();
        this.setViewport( '#'+event.viewport.attr.id );
    }
    return this.getSkin().toString();
}

/**
 * 组件初始化进行中
 * @returns {Component}
 */
SkinComponent.prototype.initializing=function initializing()
{
    if( Component.prototype.initializing.call(this) )
    {
        this.getSkin().hostComponent( this ).initializing();
        var viewport = this.getViewport();
        if (typeof viewport === "string")
        {
            viewport = new Element(viewport);
            this.setViewport( viewport );
        }
        if ( !viewport || viewport.length<1 )throw new TypeError('viewport is null or undefined');
        return true;
    }
    return false;
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
    this.getViewport().html( this.skinInstaller() );
    this.initialized();
    return this;
};

System.SkinComponent = SkinComponent;
