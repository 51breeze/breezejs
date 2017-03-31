/*
* BreezeJS HttpRequest class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
* @require Object,Render,RenderEvent,DataSource,DataSourceEvent
*/

/**
 * 数据渲染器
 * @returns {DataGrid}
 * @inherit Template
 * @constructor
 */
function DataGrid()
{
    if( !(this instanceof DataGrid) )return new DataGrid();
    Render.call(this);
    this.addEventListener(RenderEvent.START,function (e) {
        if( e.variable )
        {
            var columns = this.columns();
            if( columns )
            {
                var invoke = this.__invoke__;
                var has = Object.prototype.hasOwnProperty;
                if (!System.instanceOf(columns, Array)) {
                    columns = Object.prototype.keys.call(columns);
                }
                e.variable.forEach = function (item, key, index) {
                    return invoke.call(this, item, has.call(item, columns[index]) ? columns[index] : key, index);
                }
            }
        }
    });
}
DataGrid.prototype =  Object.create(Render.prototype);
DataGrid.prototype.constructor=DataGrid;

/**
 * @private
 */
DataGrid.prototype.__dataSource__=null;

/**
 * 获取数据源对象
 * @returns {DataSource}
 */
DataGrid.prototype.dataSource=function dataSource()
{
    if( this.__dataSource__ === null  )
    {
        this.__dataSource__ = new DataSource().addEventListener(DataSourceEvent.SELECT,function(event)
        {
            if( !event.waiting )
            {
                var columns = this.columns();
                if( event.data && event.data[0] && !columns )
                {
                    columns=Object.prototype.keys.call( event.data[0] );
                    this.__columns__ = columns;
                }
                this.variable( this.dataProfile(), event.data );
                this.variable( this.columnProfile(), columns );
                Render.prototype.display.call(this);
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
DataGrid.prototype.source=function source(data )
{
    if( data != null )this.dataSource().source( data );
    return this;
};

/**
 * @private
 */
DataGrid.prototype.__columns__=null;

/**
 * 设置指定的列名
 * @param columns {'column':'text',...} | "column1,column2,..."
 * @returns {DataGrid}
 */
DataGrid.prototype.columns=function( columns )
{
    if( typeof columns === 'undefined' )
    {
        return this.__columns__;
    }
    if ( System.isString(columns) )
    {
        this.__columns__ = columns.split(',')
    }else
    {
        this.__columns__ = columns;
    }
    return this;
};

/**
 * @type {string}
 * @private
 */
DataGrid.prototype.__columnProfile__='columns';

/**
 * @param profile
 * @returns {*}
 */
DataGrid.prototype.columnProfile=function columnProfile( profile )
{
    if( typeof profile === "string" )
    {
        this.__columnProfile__ = profile;
        return this;
    }
    return this.__columnProfile__;
};

/**
 * @type {string}
 * @private
 */
DataGrid.prototype.__dataProfile__='data';

/**
 * @param profile
 * @returns {*}
 */
DataGrid.prototype.dataProfile=function dataProfile(profile )
{
    if( typeof profile === "string" )
    {
        this.__dataProfile__ = profile;
        return this;
    }
    return this.__dataProfile__;
};

/**
 * @private
 */
DataGrid.prototype.__skin__=null;

/**
 * @param skin Skin
 * @returns {Boolean}
 */
DataGrid.prototype.setSkin=function setSkin( skin )
{
    if( skin !== System.Skin && !System.is(skin.prototype, System.Skin) )throw new TypeError('is not skin class');
    this.__skin__=skin;
    return this;
};

/**
 * 禁用父类的view函数 改用 setSkin
 */
DataGrid.prototype.view=function view()
{
    throw new TypeError('Using "setSkin" method. instead of the "view" method');
}

/**
 * @private
 */
DataGrid.prototype.__view__=null;

/**
 * @param view
 * @returns {Boolean}
 */
DataGrid.prototype.display=function display()
{
    if( this.__view__===null )
    {
        var skin = this.__skin__;
        if( !skin )throw new TypeError('skin is not defined');
        this.__view__ = new skin().toString();
        Render.prototype.view.call(this,this.__view__);
    }
    this.dataSource().select();
    return this;
};

System.DataGrid = DataGrid;