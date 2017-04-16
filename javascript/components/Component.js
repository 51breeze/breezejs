/*
* BreezeJS Component class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
*/

/**
 * 所有组件的基类
 * 组件的开发采用皮肤分离的设计方式，只有继承此组件的子类才会具有组件的特性。
 * 在引用皮肤或者更改皮肤时此组件会自动调度 skinInstalled / skinUninstall 所以这两个方法无需手动调手，只需在子类中覆写方可。
 * initialized 这个方法是组件内部操作，当文档准备就绪后并触发 Component.initialize() 并把所扩展的方法初始化完毕后组件会自动调用此方法无需手动调手，
 * 只需在子类中覆写方可。此方法的功用是当所有的扩展方法初始化完成后您可以在此方法中处理一些自己的业务逻辑以便达到更好的效果。
 * 注意：initialized 这个方法只会在HTML标记为组件并触发了 Component.initialize() 下才会调用，否则组件不会调用。
 * @require Object,EventDispatcher,TypeError,ComponentEvent
 * @returns {Component}
 */
function Component()
{
    if( !System.is(this,Component) )return new Component();
    EventDispatcher.call(this);
}

Component.prototype= Object.create(EventDispatcher.prototype);
Component.prototype.constructor=Component;
Component.prototype.componentProfile='component';
Component.prototype.initializeMethod=[];
Component.prototype.initializeCompleted=false;
Component.NAME='component';

/**
 * 组件初始完成
 * @returns {boolean}
 */
Component.prototype.__initialized__=false;
Component.prototype.initialized=function initialized()
{
    var ret = this.__initialized__;
    if( ret===false )
    {
        this.__initialized__=true;
        this.dispatchEvent( new ComponentEvent( ComponentEvent.INITIALIZED ) );
    }
    return ret;
};

/**
 * 组件初始化进行中
 * @returns {Component}
 */
Component.prototype.initializing=function initializing()
{
    return !this.__initialized__;
};

/**
 * @private
 */
Component.prototype.__hostComponent__=null;

/**
 * 宿主组件对象
 * @param component
 * @returns {null|Component}
 */
Component.prototype.hostComponent = function hostComponent( host )
{
    if( host )
    {
        if( !System.is(host,Component) )throw new TypeError('is not host component');
        this.__hostComponent__ = host;
        return this;
    }
    return this.__hostComponent__;
}

System.Component = Component;