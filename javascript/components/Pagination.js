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
function Pagination( viewport )
{
    if( !System.is(this,Pagination) )return new Pagination( viewport );
    SkinComponent.call(this,viewport);
}

Pagination.prototype= Object.create( SkinComponent.prototype );
Pagination.prototype.constructor = Pagination;

/**
 * @private
 */
function getUrl(page)
{
    return '?page='+page;
}

/**
 * @private
 */
Pagination.prototype.__url__=null;

/**
 * 设置返回一个回调函数,用来返回一个url地址
 * @param number totalPage
 * @returns {*}
 */
Pagination.prototype.url=function url( callback )
{
   if( callback )
   {
       if( typeof callback !== "function" )throw new TypeError('Invalid callback');
       this.__url__ = callback;
   }
   return this.__url__ || getUrl;
};

/**
 * 设置总分页数
 * @param number totalPage
 * @returns {*}
 */
Pagination.prototype.totalPage=function totalPage()
{
    return this.totalRows() >0 ? Math.ceil( this.totalRows() / this.rows() ) : 1;
};

/**
 * @private
 */
Pagination.prototype.__totalRows__=0;

/**
 * 设置获取总分页数
 * @param number totalPage
 * @returns {*}
 */
Pagination.prototype.totalRows=function totalRows( num )
{
    if( typeof num === "undefined"  )return this.__totalRows__;
    this.__totalRows__ = num >> 0;
    return this;
};

/**
 * @private
 */
Pagination.prototype.__rows__=20;

/**
 * 每页显示多少行数据
 * @param number totalPage
 * @returns {*}
 */
Pagination.prototype.rows=function rows( num )
{
    if( typeof num === "undefined" )return this.__rows__;
    this.__rows__ = num >> 0;
    return this;
};

/**
 * @returns {Number}
 */
Pagination.prototype.offset=function offset()
{
    return (this.current() - 1) * this.rows();
};

/**
 * @private
 */
Pagination.prototype.__current__=1;

/**
 * 设置获取总分页数
 * @param number totalPage
 * @returns {*}
 */
Pagination.prototype.current=function current( num )
{
    if( typeof num === "undefined" )return this.__current__;
    num >>= 0;
    if( num !== this.__current__ )
    {
        this.__current__ = num;
        var event = new PaginationEvent(PaginationEvent.CHANGED);
        event.current= num;
        this.dispatchEvent( event );
    }
    return this;
};

/**
 * @private
 */
Pagination.prototype.__link__=7;

/**
 * 设置获取分页的按扭数
 * @param num
 * @returns {*}
 */
Pagination.prototype.link=function link( num )
{
    if( typeof num === "undefined" )return this.__link__;
    this.__link__ = num >> 0;
    return this;
}

/**
 * 初始化皮肤
 * @returns {String}
 */
Pagination.prototype.skinInitialize=function skinInitialize( event )
{
    SkinComponent.prototype.skinInitialize.call(this, event);
    var render = this.getRender();
    var current = this.current();
    var totalPage = this.totalPage();
    var link = this.link();
    var offset =  Math.max( current - Math.ceil( link / 2 ), 0 );
    offset = offset+link > totalPage ? offset-( offset+link - totalPage ) : offset;
    render.variable('totalPage', totalPage );
    render.variable('rows', this.rows() );
    render.variable('offset', this.offset() );
    render.variable('url', this.url() );
    render.variable('current', current );
    render.variable('first', 1 );
    render.variable('prev', Math.max(current-1,1) );
    render.variable('next', Math.min(current+1,totalPage) );
    render.variable('last', totalPage );
    render.variable('link', offset>=0 ? System.range(1+offset, link+offset+1 , 1) : [1] );
    return render.fetch( this.getSkin().toString() );
}

/**
 * 组件初始化完成
 */
Pagination.prototype.initialized=function initialized()
{
    if( !SkinComponent.prototype.initialized.call(this) )
    {
        if( !this.getViewport() )
        {
            var ele = new Element('#' + this.getSkin().attr('id'));
            this.setViewport(new Element(ele[0].parentNode));
        }
        return false;
    }
    return true;
}

/**
 * 渲染显示皮肤
 * @returns {Pagination}
 */
Pagination.prototype.display=function display()
{
    SkinComponent.prototype.display.call(this);
    if( this.getViewport() )
    {
        var elem = new Element('li a', this.getViewport().current() );
        var self = this;
        elem.addEventListener( MouseEvent.CLICK, function (e) {
            e.preventDefault();
            this.current( e.target )
            var page = this.property('data-page') >> 0;
            var old = self.current();
            if( old !== page )
            {
                var event = new PaginationEvent( PaginationEvent.CHANGE );
                event.oldValue = old;
                event.newValue = page;
                self.dispatchEvent( event );
            }
        });
    }
    return this;
}

System.Pagination = Pagination;