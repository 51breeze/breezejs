/*
* BreezeJS HttpRequest class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
* @require Object,PaginationEvent,SkinComponent,TypeError,Element,MouseEvent
*/

/**
 * 分页组件.
 * 此组件包含如下特性：
 * 皮肤元素：{info}{firstPage}{prevPage}{hiddenLeft}{links}{hiddenRight}{nextPage}{lastPage}{goto}
 * 动态变量：{totalPage}{totalRows}{rows}{current} （仅限用于info皮肤下）
 *
 * 这些皮肤元素可以自由组合位置和删减以满足各种需求。
 * 此组件支持鼠标单击和鼠标滚动事件，默认为鼠标单击事件
 * 如果同时需要支持两种事件 只需要在 options.eventType 中设置 [MouseEvent.CLICK,MouseEvent.MOUSE_WHEEL] 即可。
 * @param viewport
 * @param context
 * @returns {*}
 * @constructor
 */

package breeze.components
{
    import breeze.components.SkinComponent;
    import breeze.components.PaginationEvent;
    public class Pagination extends SkinComponent
    {
        function Pagination(viewport)
        {
            super(viewport);
        }

        /**
         * @private
         */
        private var __url__:Function = function(page){return '?page=' + page;};

        /**
         * 设置返回一个回调函数,用来返回一个url地址
         * @param callback Function
         * @returns {void}
         */
        public function set pageUrl( callback:Function ):void
        {
              this.__url__ = callback;
        }
        /**
         * 获取一个返回url地址的回调函数
         * @returns {Function}
         */
        public function get pageUrl():Function
        {
            return this.__url__;
        }
        /**
         * @private
         */
        private var __attrName__ = 'data-page';
        public function set indexAttrName( name:String ):void
        {
             this.__attrName__ = name;
        }
        public function get indexAttrName():String
        {
            return this.__attrName__;
        }

        /**
         * 获取总分页数
         * @param number totalPage
         * @returns {*}
         */
        public function get totalPage():Number
        {
            return this.totalSize > 0 ? Math.ceil( this.totalSize / this.pageSize ) : 1;
        }
        /**
         * @private
         */
        private var __totalSize__ = 0;

        /**
         * 设置总数据
         * @returns {void}
         */
        public function set totalSize( num:Number ):void
        {
            this.__totalSize__ = num;
        }
        /**
         * 获取总数据
         * @returns {Number}
         */
        public function get totalSize():Number
        {
            return this.__totalSize__;
        }
        /**
         * @private
         */
        private var __pageSize__ = 20;

        /**
         * 获取每页显示多少行数据
         * @returns {Number}
         */
        public function get pageSize():Number
        {
           return this.__pageSize__;
        }
        public function set pageSize(num:Number):void
        {
            this.__pageSize__ = num;
        }
        /**
         * 返回当前的偏移量
         * @returns {Number}
         */
        public function get offset():Number
        {
            return (this.current - 1) * this.pageSize;
        }
        /**
         * @private
         */
        private var __current__:Number = 1;

        /**
         * 设置当前需要显示的分页
         * @returns {Number}
         */
        public function get current():Number
        {
            return this.__current__;
        }
        /**
         * 设置当前需要显示的分页
         * @param num
         */
        public function set current(num:Number):void
        {
            num = Math.min( Math.max(1, num), this.totalPage );
            var current = this.__current__;

            alert( num );

            if( num !== current )
            {
                var old = current;
                this.__current__ = num;
                var event = new PaginationEvent(PaginationEvent.CHANGE);
                event.oldValue = old;
                event.newValue = num;
                this.dispatchEvent(event);
            }
        }
        /**
         * @private
         */
        private var __link__:Number = 7;

        /**
         * 获取分页的按扭数
         * @returns {Number}
         */
        public function get link():Number
        {
            return this.__link__;
        }

        /**
         * 设置分页的按扭数
         * @returns {void}
         */
        public function set link( num:Number ):void
        {
            this.__link__ = num;
        }

        /**
         * 初始化皮肤
         *  @inherit
         * @returns {String}
         */
        override protected function skinInstaller(event):String
        {
            var render = this.render;
            var current = this.current;
            var totalPage = this.totalPage;
            var link = this.link;
            var offset = Math.max(current - Math.ceil(link / 2), 0);
            offset = offset + link > totalPage ? offset - ( offset + link - totalPage ) : offset;
            render.variable('totalPage', totalPage);
            render.variable('rows', this.pageSize );
            render.variable('offset', this.offset );
            render.variable('url', this.pageUrl );
            render.variable('current', current);
            render.variable('first', 1);
            render.variable('prev', Math.max(current - 1, 1));
            render.variable('next', Math.min(current + 1, totalPage));
            render.variable('last', totalPage);
            render.variable('link', offset >= 0 ? System.range(1 + offset, link + offset + 1, 1) : [1]);
            return render.fetch( super.skinInstaller( event ) );
        }

        /**
         * @inherit
         */
        override protected function initializing()
        {
            if ( super.initializing() )
            {
                this.viewport.addEventListener(MouseEvent.MOUSE_WHEEL, function (e)
                {
                    var page = this.current;
                    this.current= e.wheelDelta > 0 ? page + 1 : page - 1;
                }, false, 0, this);
                return true;
            }
            return false;
        }

        /**
         * 渲染显示皮肤
         *  @inherit
         * @returns {Pagination}
         */
        override public function display()
        {
            super.display();
            var elem = new Element('a', this.viewport );
            var self = this;
            elem.addEventListener(MouseEvent.CLICK, function (e)
            {
                e.preventDefault();
                this.current( e.target );
                var page = this.property( self.indexAttrName ) >> 0;
                if (page > 0)
                {
                    self.current = page;
                }
            });
        }

    }
}