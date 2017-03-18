/*
* BreezeJS HttpRequest class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
* @require Object,Template,DataSource,DataSourceEvent
*/

/**
 * 数据渲染器
 * @returns {DataRender}
 * @constructor
 */
function DataRender()
{
    if( !(this instanceof DataRender) )return new DataRender();
    Template.call(this);
}
DataRender.prototype =  Object.create(Template.prototype);
DataRender.prototype.constructor=DataRender;

/**
 * @private
 */
DataRender.prototype.__dataSource__=null;

/**
 * 获取数据源对象
 * @returns {DataSource}
 */
DataRender.prototype.dataSource=function dataSource()
{
    if( this.__dataSource__ === null  )
    {
        this.__dataSource__ = new DataSource().addEventListener(DataSourceEvent.SELECT,function(event)
        {
            if( !event.waiting )
            {
                this.variable( this.dataProfile(), event.data );
                Template.prototype.display.call(this, this.view() );
            }
        },false,0,this);
    }
    return this.__dataSource__;
};

/**
 * 设置数据源
 * @param source
 * @returns {*}
 */
DataRender.prototype.source=function source( data )
{
    if( data != null )this.dataSource().source( data );
    return this;
};

/**
 * @type {string}
 * @private
 */
DataRender.prototype.__dataProfile__='data';

/**
 * @param profile
 * @returns {*}
 */
DataRender.prototype.dataProfile=function dataProfile( profile )
{
    if( typeof profile === "string" )
    {
        this.__dataProfile__ = profile;
        return this;
    }
    return this.__dataProfile__;
};

/**
 * @param view
 * @returns {Boolean}
 */
DataRender.prototype.display=function display( view )
{
    this.view( view );
    this.dataSource().select();
    return this;
};

System.DataRender = DataRender;