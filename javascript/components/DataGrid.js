/*
* BreezeJS HttpRequest class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
* @require Object,DataSource,DataSourceEvent,SkinComponent,PaginationEvent
*/

/**
 * 数据渲染器
 * @returns {DataGrid}
 * @inherit Template
 * @constructor
 */
function DataGrid(viewport)
{
    if( !(this instanceof DataGrid) )return new DataGrid(viewport);
    SkinComponent.call(this,viewport);
}
DataGrid.prototype =  Object.create(SkinComponent.prototype);
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
        var self = this;
        this.__dataSource__ = new DataSource().addEventListener(DataSourceEvent.SELECT,function(event)
        {
            if( !event.waiting )
            {
                var columns = self.columns();
                if( event.data && event.data[0] && !columns )
                {
                    columns=Object.prototype.keys.call( event.data[0] );
                    self.__columns__ = columns;
                }

                self.variable( self.columnProfile(), columns );
                self.variable( self.dataProfile(), event.data );
                SkinComponent.prototype.display.call( self );
                var pagination = self.getSkin().pagination;
                pagination.rows( this.rows() );
                pagination.totalRows( this.calculate() )
                pagination.display();
            }
        });
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
 * 初始化皮肤使用渲染器
 * @returns {*}
 */
DataGrid.prototype.skinInitialize=function skinInitialize()
{
    return this.getRender().fetch( this.getSkin().toString() );
}

/**
 * @param view
 * @returns {Boolean}
 */
DataGrid.prototype.display=function display()
{
    this.dataSource().select();
    if( this.getSkin().pagination )
    {
        var self= this;
        this.getSkin().pagination.addEventListener( PaginationEvent.CHANGE, function (e) {
            self.dataSource().select( e.newValue );
        });
    }
    return this;
};

System.DataGrid = DataGrid;