/*
* BreezeJS HttpRequest class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
* @require Object,DataSource,DataSourceEvent,SkinComponent,PaginationEvent,Element,Skin
*/

/**
 * 数据渲染器
 * @returns {DataGrid}
 * @inherit Template
 * @constructor
 */

package breeze.components
{
    import breeze.components.SkinComponent;
    import breeze.components.PaginationEvent;
    import DataSource;
    import DataSourceEvent;

    public class DataGrid extends SkinComponent
    {
        public function DataGrid(viewport)
        {
            super(viewport);
        }

        /**
         * @private
         */
        private var __dataSource__:DataSource = null;

        /**
         * 获取数据源对象
         * @returns {DataSource}
         */
        public function get dataSource():DataSource
        {
            var dataSource = this.__dataSource__;
            if ( dataSource === null )
            {
                var self = this;
                dataSource = new DataSource();
                dataSource.addEventListener(DataSourceEvent.SELECT, function (event)
                {
                    if (!event.waiting)
                    {
                        self.variable( self.dataProfile(), event.data );
                        var body = self.skin.getChildById('body');
                        body.buildMode(Skin.BUILD_ALL_MODE);
                        var bodyHtml = self.render.fetch( body.toString() );
                        Element( '#' + body.attr('id') ).html( bodyHtml );
                        var pagination = self.skin.getChildById('pagination');
                        if (pagination)
                        {
                            pagination.pageSize= this.pageSize();
                            pagination.totalSize= this.totalSize();
                            pagination.display();
                        }
                    }
                });
                this.__dataSource__ = dataSource;
            }
            return dataSource;
        };

        /**
         * 设置数据源
         * @param source
         * @returns {void}
         */
        public function set source( data:Object ):void
        {
            this.dataSource.source( data );
        };

        /**
         * 获取数据源
         * @returns {Object}
         */
        public function get source():Object
        {
            return this.dataSource.source();
        };

        /**
         * @private
         */
        private var __columns__:Object = null;

        /**
         * @returns {Object}
         */
        public function get columns():Object
        {
            return this.__columns__;
        };

        /**
         * 设置指定的列名
         * @param columns {'column':'text',...} | "column1,column2,..."
         */
        public function set columns( columns:Object ):void
        {
            this.__columns__ = isString(columns) ? columns.split(',') : columns;
        };

        /**
         * @type {string}
         * @private
         */
        private var __columnProfile__ = 'columns';

        /**
         * @param profile
         * @returns {*}
         */
        public function columnProfile(profile) {
            if (typeof profile === "string") {
                this.__columnProfile__ = profile;
                return this;
            }
            return this.__columnProfile__;
        };

        /**
         * @type {string}
         * @private
         */
        private var __dataProfile__ = 'data';

        /**
         * @param profile
         * @returns {*}
         */
        public function dataProfile(profile)
        {
            if (typeof profile === "string") {
                this.__dataProfile__ = profile;
                return this;
            }
            return this.__dataProfile__;
        };

        /**
         * 初始化皮肤使用渲染器
         * @returns {*}
         */
        override protected function skinInstaller(event):String
        {
            this.skin.getChildById('body').buildMode(Skin.BUILD_CONTAINER_MODE);
            var skin = super.skinInstaller(event);
            return this.render.fetch( skin );
        }

        /**
         * @inherit
         * @returns {boolean}
         */
        override protected function initializing()
        {
            if (super.initializing(this))
            {
                this.variable(this.columnProfile(), this.columns );
                var pagination = this.skin.getChildById("pagination");
                if (pagination) {
                    pagination.addEventListener(PaginationEvent.CHANGE, function (e) {
                        this.dataSource.select(e.newValue);
                    }, false, 0, this);
                }
                return true;
            }
            return false;
        }

        /**
         * @param view
         * @returns {Boolean}
         */
        override public function display()
        {
            super.display();
            this.dataSource.select();
            return this;
        };
    }
}