/*
 * BreezeJS Layout components.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

/**
 * 约束布局组件。
 * 通过此组件可以轻松控制元素的大小及需要对齐的位置。
 * @example
 * <div>
 *   <layout left="10" right="10" top="50" bottom="10" horizontal="left" vertical="top" />
 * </div>
 */
+(function( window,undefined )
{
    var layouts=[]
    ,rootLayout=null
    ,horizontal=['left','center','right']
    ,vertical=['top','middle','bottom']
    ,dispatchLayoutEvent = function(target,property,newVal,oldVal)
    {
        if( target.hasEventListener(PropertyEvent.PROPERTY_CHANGE) )
        {
            var event=new LayoutEvent( PropertyEvent.LAYOUT_CHANGE );
            event.newValue=newVal;
            event.oldValue=oldVal;
            event.property=property;
            target.dispatchEvent(  event );
        }
    }

    LayoutEvent=function(src, props){ BreezeEvent.call(this, src, props); }
    LayoutEvent.prototype=new BreezeEvent();
    LayoutEvent.prototype.property=null;
    LayoutEvent.prototype.oldValue=null;
    LayoutEvent.prototype.newValue=null;
    LayoutEvent.LAYOUT_CHANGE='layoutChange';
    LayoutEvent=LayoutEvent;

    //根据元素查找所属的父布局对象
    function getOwnerByElement( element )
    {
        var index;
        if( element && rootLayout && window.document.body !== element ) for( index in layouts )
            if( layouts[index][0]===element ) return layouts[index];
        return null;
    }

    /**
     * Layout
     * @param target
     * @constructor
     */
    function Layout( target )
    {
        if( !(this instanceof Layout) )
            return new Layout( target );

        Breeze.call(this , target );
        if( this.length !== 1 )
        {
            throw new Error('invalid target. the param only is a element');
        }

        target = this[0];
        if( this.data('layout') instanceof Layout )
           return this.data('layout');

        //初始化视图中的脚本
        for( var b=0; b<target.childNodes.length; b++)
        {
           var child = target.childNodes.item(b);
           if( Utils.nodeName(child)==='noscript' )
           {
               target.removeChild(child);
               new Function( Sizzle.getText(child) ).call(this);
           }
        }

        this.childrenItem=[];
        if( rootLayout )
        {
            if( !Utils.contains( window.document.body, target ) )
                 throw new Error('invalid target in Layout');

            if( this.style('position') === "static" )
                this.style('position',target.parentNode === window.document.body ? 'absolute' : 'relative' );

            this.style('float','left');
            var parent=target;

            do{
                var layout = this.current(parent).data('layout');
                if( layout && layout instanceof Layout )
                {
                    this.owner=layout;
                    this.owner.childrenItem.push( this );
                    break;
                }
                parent= parent.parentNode;
            }while( parent );
            this.current(null);
        }
        this.data('layout', this);

        var doc = this[0].document || this[0].ownerDocument;
        var win =  Utils.getWindow(this[0]);
        var _viewport = Utils.contains(doc.body, this[0]) ? this[0].parentNode : doc.body;
            _viewport = doc.body === _viewport ? win : _viewport;
        var map={'body':doc.body,'window': Utils.getWindow(this[0]), 'document':win.document }

        /**
         * @param viewport
         * @returns {Function|Node}
         */
        this.viewport=function( viewport )
        {
            if( typeof viewport === "undefined" )
              return _viewport;

            if( typeof viewport === "string" )
            {
                if( map[viewport] )
                {
                    viewport= map[viewport];

                }else
                {
                    viewport=Sizzle(viewport,doc.body );
                    if( viewport.length > 0 ) viewport=viewport[0];
                }
            }

            if( Utils.isHTMLElement(viewport) )
            {
                _viewport=viewport;
                return this;
            }
            throw new Error('invaild viewport')
        }

    }

    /**
     * 继承 Breeze
     * @type {window.Breeze}
     */
    Layout.prototype=new Breeze();
    Layout.prototype.owner=null;
    Layout.prototype.childrenItem=[];

    /**
     * 初始化根布局容器
     * @returns {Layout}
     */
    Layout.rootLayout=function()
    {
        if( rootLayout=== null )
        {
            rootLayout = new Layout( document.body );
            rootLayout.addEventListener=function(type,listener,useCapture,priority){
                this.current(window);
                EventDispatcher.prototype.addEventListener.call(this,type,listener,useCapture,priority);
            }
            rootLayout.addEventListener( BreezeEvent.RESIZE ,function(event)
            {
                var viewport = rootLayout.viewport()
                var width =  Utils.getSize(viewport, 'width');
                var height=  Utils.getSize(viewport, 'height');
                this.updateDisplayList(  width , height  );
            });
        }
        return rootLayout;
    }

    /**
     * 输出布局组件名称
     * @returns {string}
     */
    Layout.prototype.toString=function()
    {
        return 'Layout '+this.__COUNTER__;
    }

    /**
     * 测量元素的宽度
     * @returns {Number|string|*}
     */
    Layout.prototype.measureWidth=function( parentWidth )
    {
        var width=this.explicitWidth() || this.width();
        if( isNaN( width ) )
        {
            var percent = this.percentWidth() || 100;
            width= percent / 100 * parentWidth ;
        }
        return width;
    }

    /**
     * 测量元素的宽度
     * @returns {Number|string|*}
     */
    Layout.prototype.measureHeight=function(parentHeight)
    {
        var height=this.explicitHeight() || this.height();
        if( isNaN( height ) )
        {
            var percent = this.percentHeight() || 100;
            height= percent / 100 * parentHeight ;
        }
        return height;
    }

    /**
     * 根据当前的布局特性计算所需要的宽度
     * @returns {Number|string|*}
     */
    Layout.prototype.calculateWidth=function( parentWidth )
    {
        var width=this.explicitWidth();
        if( isNaN( width ) )
        {
            var percent = this.percentWidth() || 100;
            width= percent / 100 * parentWidth ;
        }
        var left = this.left() || 0;
        var right = this.right() || 0;
        width-=left+right;
        return this.getMaxOrMinWidth( width );
    }

    /**
     * 根据当前的布局特性计算所需要的高度
     * @returns {Number|string|*}
     */
    Layout.prototype.calculateHeight=function( parentHeight )
    {
        var height=this.explicitHeight();
        if( isNaN( height ) )
        {
            var percent = this.percentHeight() || 100;
            height=  percent / 100 * parentHeight;
        }
        var bottom = this.bottom() || 0;
        var top = this.top() || 0;
        height-=bottom+top;
        return this.getMaxOrMinHeight( height );
    }

    /**
     * 获取布局已设置的最大或者最小宽度
     * @param width
     * @returns {*}
     */
    Layout.prototype.getMaxOrMinWidth=function( width )
    {
        return Math.min( Math.max( this.minWidth() || width , width ), this.maxWidth() || width );
    }

    /**
     * 获取布局已设置的最大或者最小高度
     * @param width
     * @returns {*}
     */
    Layout.prototype.getMaxOrMinHeight=function( height )
    {
        return Math.min( Math.max( this.minHeight() || height , height ), this.maxHeight() || height );
    }


    Layout.prototype.validateDisplayList=function()
    {
        var viewport = this.viewport();
        this.width( this.calculateWidth( Utils.getSize(viewport, 'width') ) );
        this.height(this.calculateHeight( Utils.getSize(viewport, 'height') ) );

        //更新子布局的显示列表
        if( this.childrenItem.length > 0 )
        {
            var i=0;
            for( ; i < this.childrenItem.length; i++ )
            {
                this.childrenItem[i].validateDisplayList();
            }
        }
        this.updateDisplayList();
    }

    Layout.prototype.measureChildren=function(parentWidth,parentHeight)
    {
        var paddingLeft  = parseInt( this.style('paddingLeft') )  || 0
        var paddingRight = parseInt( this.style('paddingRight') ) || 0;
        var paddingTop   =  parseInt( this.style('paddingTop') )  || 0
        var paddingBottom= parseInt( this.style('paddingBottom') )|| 0;
        var gap=this.gap()
            ,grid=[]
            ,x=gap+paddingLeft,y=gap+paddingTop,maxHeight=0,countHeight= 0,countWidth=0;

        var target = this.current();
        if( target && target.childNodes && target.childNodes.length>0 )
        {
            var len = target.childNodes.length, index=0;
            for( ; index<len; index++)
            {
                var child = target.childNodes.item( index );
                if( child.nodeType===1 )
                {
                    this.current( child );
                    this.style('position','absolute');
                    var childWidth=this.width() || this.calculateWidth( parentWidth );
                    var childHeight=this.height() || this.calculateHeight( parentHeight );

                    var marginLeft = parseInt( this.style('marginLeft') ) || 0;
                    var marginRight = parseInt( this.style('marginRight') ) || 0;
                    var marginTop = parseInt( this.style('marginTop') ) || 0;
                    var marginBottom = parseInt( this.style('marginBottom') ) || 0;

                    //从第二个子级元素开始，如大于了容器宽度则换行
                    if (x + childWidth+gap+marginLeft+marginRight+paddingRight > parentWidth && index > 0)
                    {
                        y += maxHeight;
                        x = gap+paddingLeft;
                        maxHeight = 0;
                    }
                    grid.push({'target': child, 'left': x, 'top': y,'width':childWidth,'height':childHeight});
                    x += childWidth+gap+marginLeft+marginRight;
                    maxHeight = Math.max(maxHeight, childHeight + gap+marginTop+marginBottom);
                    countHeight = maxHeight + y;
                    countWidth = Math.max(countWidth, x+paddingRight );
                }
            }
            this.current( null );
        }
        return {'countWidth':countWidth,'countHeight':countHeight,'grid':grid}
    }

    Layout.prototype.overflowY=function()
    {
        var overflowY= this.style('overflowY');
        return !(overflowY === 'hidden' || overflowY==='visible');
    }

    Layout.prototype.overflowX=function()
    {
        var overflowX= this.style('overflowX');
        return !(overflowX === 'hidden' || overflowX==='visible');
    }

    /**
     * 更新布局视图
     * @returns {Layout}
     */
    Layout.prototype.updateDisplayList=function(parentWidth,parentHeight)
    {
        var  realHeight=this.calculateHeight(parentHeight);
        var  realWidth= this.calculateWidth(parentWidth);

        //更新子布局的显示列表
        if( this.childrenItem.length > 0 )
        {
            var i=0;
            for( ; i < this.childrenItem.length; i++ )
            {
                this.childrenItem[i].updateDisplayList(realWidth,realHeight);
            }
        }

        var horizontalAlign=this.horizontal()
            ,verticalAlign=this.vertical()
            ,h=horizontalAlign===horizontal[1] ? 0.5 : horizontalAlign===horizontal[2] ? 1 : 0
            ,v=verticalAlign  ===vertical[1]   ? 0.5 : verticalAlign  ===vertical[2]   ? 1 : 0

        //计算子级元素需要排列的位置
        var children = this.measureChildren(realWidth, realHeight);
        var countHeight=children.countHeight;
        var countWidth=children.countWidth;

        var scrollY=0
        var scrollX=0
        if( countHeight > realHeight && this.overflowY() )
        {
             scrollY=17
             this.owner.scrollY=17
        }

        if( countWidth > realWidth && this.overflowX() )
        {
            scrollX=17
            this.owner.scrollX=17
        }

        if( scrollX+scrollY > 0  )
        {
            children = this.measureChildren( realWidth-scrollY, realHeight-scrollX);
            countHeight=children.countHeight;
            countWidth=children.countWidth;
        }

        //需要整体排列
        if( children.grid.length > 0 )
        {
            var gap=this.gap();
            var xOffset, yOffset, index=0;
            xOffset = Math.floor((realWidth-countWidth - gap -scrollY ) * h);
            yOffset = Math.floor((realHeight - countHeight - gap - scrollX ) * v);
            for( ; index < children.grid.length ; index++ )
            {
                var child = children.grid[index];
                Utils.style(child.target, 'left', child.left + xOffset );
                Utils.style(child.target, 'top', child.top + yOffset );
                Utils.style(child.target, 'width', child.width );
                Utils.style(child.target, 'height', child.height );
            }
        }
        this.height( !this.overflowY() ? Math.max(realHeight, countHeight) : realHeight );
        this.width( !this.overflowX() ? Math.max(realWidth, countWidth) : realWidth );
    }

    /**
     * @private
     */
    var __property__ = function(prop, val , flag )
    {
        var old = parseInt( this.property(prop) );
        if( typeof val !== "undefined" )
        {
            val =  parseInt( val );
            if( this !== rootLayout )
            {
                if ( flag ) this.style( flag !== true ? flag : prop, val);
                if (val !== old )
                {
                    this.property(prop, val);
                    dispatchLayoutEvent(this, prop, val, old);
                }
            }
            return this;
        }
        return old;
    }

    /**
     * 获取设置左边位置
     * @param val
     * @returns {*}
     */
    Layout.prototype.left=function(val)
    {
       return __property__.call(this,'left',val, true);
    }

    /**
     * 获取设置顶边位置
     * @param val
     * @returns {*}
     */
    Layout.prototype.top=function(val)
    {
        return __property__.call(this,'top',val, true);
    }

    /**
     * 获取设置右边位置
     * @param val
     * @returns {*}
     */
    Layout.prototype.right=function(val)
    {
        return __property__.call(this,'right',val, true);
    }

    /**
     * 获取设置底边位置
     * @param val
     * @returns {*}
     */
    Layout.prototype.bottom=function(val)
    {
        return __property__.call(this,'bottom',val, true);
    }

    /**
     * 设置获取元素的宽度
     * @param val
     * @returns {*}
     */
    Layout.prototype.width=function(val)
    {
        return __property__.call(this,'width',val, true );
    }

    /**
     * 设置获取元素的高度
     * @param val
     * @returns {*}
     */
    Layout.prototype.height=function(val)
    {
        return __property__.call(this,'height',val, true );
    }

    /**
     * 设置获取指定明确的宽度
     * @param val
     * @returns {*}
     */
    Layout.prototype.explicitWidth=function(val)
    {
        return __property__.call(this,'explicitWidth',val,'width');
    }

    /**
     * 设置获取指定明确的高度
     * @param val
     * @returns {*}
     */
    Layout.prototype.explicitHeight=function(val)
    {
        return __property__.call(this,'explicitHeight',val,'height');
    }

    /**
     * 设置获取指定百分比的宽度
     * @param val
     * @returns {*}
     */
    Layout.prototype.percentWidth=function(val)
    {
        return __property__.call(this,'percentWidth',val, false );
    }

    /**
     * 设置获取指定百分比的高度
     * @param val
     * @returns {*}
     */
    Layout.prototype.percentHeight=function(val)
    {
        return __property__.call(this,'percentHeight',val, false);
    }

    /**
     * 获取设置最大宽度
     * @param val
     * @returns {*}
     */
    Layout.prototype.maxWidth=function(val)
    {
        return __property__.call(this,'maxWidth',val, true);
    }

    /**
     * 获取设置最大高度
     * @param val
     * @returns {*}
     */
    Layout.prototype.maxHeight=function(val)
    {
        return __property__.call(this,'maxHeight',val, true);
    }

    /**
     * 获取设置最小宽度
     * @param val
     * @returns {*}
     */
    Layout.prototype.minWidth=function(val)
    {
        return __property__.call(this,'minWidth',val, true);
    }

    /**
     * 获取设置最小高度
     * @param val
     * @returns {*}
     */
    Layout.prototype.minHeight=function(val)
    {
        return __property__.call(this,'minHeight',val, true);
    }

    /**
     * 设置水平对齐的方位
     * @param val
     * @returns {*}
     */
    Layout.prototype.horizontal=function(val)
    {
        var old = this.property('horizontal') || horizontal[0];
        if( typeof val !== "undefined" )
        {
            if ( val !== old && Utils.inObject(horizontal,val) !== null && this !== rootLayout )
            {
                this.property('horizontal',val);
                dispatchLayoutEvent(this, 'horizontal', val, old);
            }
            return this;
        }
        return old;
    }

    /**
     * 设置垂直对齐的方位
     * @param val
     * @returns {*}
     */
    Layout.prototype.vertical=function(val)
    {
        var old = this.property('vertical') || vertical[0];
        if( typeof val !== "undefined" )
        {
            if ( val !== old && Utils.inObject(vertical,val) !== null && this !== rootLayout )
            {
                this.property('vertical',val);
                dispatchLayoutEvent(this, 'vertical', val, old);
            }
            return this;
        }
        return old;
    }

    /**
     * 获取设置间隔
     * @param number val
     * @returns {*}
     */
    Layout.prototype.gap=function(val)
    {
        return __property__.call(this,'gap', val ,false) || 0;
    }

    //初始化布局组件
    Breeze.ready(function(){

        var rootLayout = Layout.rootLayout();
        var method=['left','top','right','bottom','explicitHeight','explicitWidth','gap','horizontal','vertical','minWidth','minHeight','maxWidth','maxHeight','percentWidth','percentHeight'];
        Breeze('[component=layout]', document.body).forEach(function(target)
        {
            if( Utils.isHTMLElement(target) && target !== window.document.body )
            {
                var prop,layout,value;
                layout = new Layout( target );
                for( prop in method )
                {
                    value = layout.property( method[prop] );
                    if( value !== null )
                    {
                       layout[ method[prop] ]( value );
                    }
                }
            }
        })

        var viewport = rootLayout.viewport()
        var width =  Utils.getSize(viewport, 'width');
        var height=  Utils.getSize(viewport, 'height');
        rootLayout.updateDisplayList(  width , height  );
    });

    window.Layout=Layout;
    window.LayoutEvent=LayoutEvent;

})( window )
