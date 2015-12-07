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
        if( target.hasEventListener(LayoutEvent.LAYOUT_CHANGE) )
        {
            var event=new LayoutEvent( LayoutEvent.LAYOUT_CHANGE );
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

    /**
     * @private
     */
    var __method__ = function(prop, val , flag )
    {
        if( this.current() instanceof Layout )
            return this.current()[ prop ]( val );
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
                    this.invalidate=false;
                    dispatchLayoutEvent(this, prop, val, old);
                }
            }
            return this;
        }
        return old;
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
            this.initialized=rootLayout.initialized;
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

        this.addEventListener(LayoutEvent.LAYOUT_CHANGE,function(event)
        {
           /*  var width = this.width();
            var height = this.height();
            for( var index=0; index < this.childrenItem.length ; index++ )
            {
               // this.childrenItem[ index ].updateDisplayList(width,height);
            }*/
        })

    }

    /**
     * 继承 Breeze
     * @type {window.Breeze}
     */
    Layout.prototype=new Breeze();
    Layout.prototype.owner=null;
    Layout.prototype.childrenItem=[];
    Layout.prototype.scrollWidth=0;
    Layout.prototype.scrollHeight=0;
    Layout.prototype.overflowHeight=0;
    Layout.prototype.overflowWidth=0;
    Layout.prototype.invalidate=false;
    Layout.prototype.initialized=false;

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

    Layout.prototype.validateNow=function()
    {

    }

    Layout.prototype.commitProperty=function()
    {

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
                    var childWidth = 0;
                    var childHeight= 0;
                    var marginLeft = 0;
                    var marginRight = 0;
                    var marginTop = 0;
                    var marginBottom = 0;

                    if( Utils.storage(child,'layout') instanceof Layout )
                    {
                        child=Utils.storage(child,'layout');
                        childWidth = child.width();
                        childHeight= child.height();
                        marginLeft = parseInt( child.style('marginLeft') ) || 0;
                        marginRight = parseInt( child.style('marginRight') ) || 0;
                        marginTop = parseInt( child.style('marginTop') ) || 0;
                        marginBottom = parseInt( child.style('marginBottom') ) || 0;


                    }else
                    {
                        if( child.getAttribute( 'includeLayout' )==='false' )
                           continue;
                         Utils.style(child,'position','absolute')
                         this.current(child);
                         childWidth = this.calculateWidth( parentWidth );
                         childHeight= this.calculateHeight( parentHeight );
                         this.current(null);
                         marginLeft = parseInt( Utils.style(child,'marginLeft') ) || 0;
                         marginRight = parseInt( Utils.style(child,'marginRight') ) || 0;
                         marginTop = parseInt( Utils.style(child,'marginTop') ) || 0;
                         marginBottom = parseInt( Utils.style(child,'marginBottom') ) || 0;

                    }

                    //从第二个子级元素开始，如大于了容器宽度则换行
                    if (x + childWidth+gap+marginLeft+marginRight+paddingRight > parentWidth && index > 0)
                    {
                        y += maxHeight;
                        x = gap+paddingLeft+marginLeft;
                        maxHeight = 0;
                    }
                    grid.push({'target': child, 'left': x+marginLeft, 'top': y+marginTop,'width':childWidth,'height':childHeight});
                    x += childWidth+gap+marginLeft+marginRight;
                    maxHeight = Math.max(maxHeight, childHeight + gap+marginTop+marginBottom);
                    countHeight = maxHeight + y;
                    countWidth = Math.max(countWidth, x+paddingRight );
                }
            }
            this.current( null );
        }
        this.childWidth=countWidth;
        this.childHeight=countHeight;

        this.scrollWidth=0;
        this.scrollHeight=0;

        //标记此容器有水平滚动条
        if( this.childHeight > parentHeight && this.overflowY() )
            this.scrollWidth = 17;
        if( this.childWidth > parentWidth && this.overflowX() )
            this.scrollHeight = 17;

        if( !this.hasScroll && (this.scrollWidth > 0 || this.scrollHeight > 0) )
        {
            this.hasScroll=true;
            this.invalidate=false;

        }else if( this.hasScroll && (this.scrollWidth === 0 || this.scrollHeight === 0) )
        {
            this.hasScroll=false;
            this.invalidate=false;
        }
        return grid;
    }

    /**
     * @param x
     * @param y
     * @returns {Layout}
     */
    Layout.prototype.moveTo=function(x,y)
    {
        if( this.current() instanceof Layout )
            return this.current().moveTo(x,y);

        if( this === rootLayout )
           return this;

        Breeze.prototype.left.call(this,x);
        Breeze.prototype.top.call(this,y);
        return this;
    }

    /**
     * @returns {boolean}
     */
    Layout.prototype.overflowY=function()
    {
        var overflowY= this.style('overflowY');
        return !(overflowY === 'hidden' || overflowY==='visible');
    }

    /**
     * @returns {boolean}
     */
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
        if( this.invalidate )return;
        this.invalidate=true;

        //获取视口大小
        if( typeof parentWidth === "undefined" || typeof parentHeight === "undefined" )
        {
            var viewport = this.viewport();
            parentWidth = Utils.getSize(viewport,'width');
            parentHeight= Utils.getSize(viewport,'height');
        }

        //计算当前布局可用的大小
        var  realHeight=this.calculateHeight(parentHeight);
        var  realWidth= this.calculateWidth(parentWidth);

        //更新子布局的显示列表
        if( this.childrenItem.length > 0 )
        {
            var i=0;
            for( ; i < this.childrenItem.length; i++ )
            {
                //当前元素为子级元素的视口时
                if( this.current() === this.childrenItem[i].viewport() )
                {
                    this.childrenItem[i].updateDisplayList(realWidth, realHeight);
                }
                //当前的子级布局的视口元素不是一个布局组件
                else
                {
                    this.childrenItem[i].updateDisplayList( undefined, undefined );
                }
            }
        }

        var horizontalAlign=this.horizontal()
            ,verticalAlign=this.vertical()
            ,h=horizontalAlign===horizontal[1] ? 0.5 : horizontalAlign===horizontal[2] ? 1 : 0
            ,v=verticalAlign  ===vertical[1]   ? 0.5 : verticalAlign  ===vertical[2]   ? 1 : 0

        //计算子级元素需要排列的位置
        var children = this.measureChildren(realWidth, realHeight);
        var countHeight= this.childHeight;
        var countWidth= this.childWidth;

        //需要整体排列
        if( children.length > 0 )
        {
            var gap=this.gap();
            var xOffset, yOffset, index=0;
            xOffset = Math.floor((realWidth-countWidth - gap - this.scrollWidth  ) * h);
            yOffset = Math.floor((realHeight - countHeight - gap -this.scrollHeight  ) * v);
            for( ; index < children.length ; index++ )
            {
                var child = children[index];
                if( child.target instanceof Layout )
                {
                    var target =child.target;
                    target.width( child.width );
                    target.height( child.height );
                    target.moveTo(  child.left + xOffset, child.top + yOffset );

                }else
                {
                    Utils.style( child.target , 'left',  child.left + xOffset );
                    Utils.style( child.target , 'top',  child.top + yOffset );
                    Utils.style( child.target , 'width',  child.width);
                    Utils.style( child.target , 'height', child.height);
                }
            }
        }

        realHeight=!this.overflowY() ? Math.max(realHeight, countHeight) : realHeight;
        realWidth=!this.overflowX() ? Math.max(realWidth, countWidth) : realWidth;
        this.overflowHeight= Math.max(countHeight-realHeight,0);
        this.overflowWidth = Math.max(countWidth-realWidth,0);
        this.height( realHeight );
        this.width( realWidth );
    }

    /**
     * 获取设置左边位置
     * @param val
     * @returns {*}
     */
    Layout.prototype.left=function(val)
    {
       return __method__.call(this,'left',val, true);
    }

    /**
     * 获取设置顶边位置
     * @param val
     * @returns {*}
     */
    Layout.prototype.top=function(val)
    {
        return __method__.call(this,'top',val, true);
    }

    /**
     * 获取设置右边位置
     * @param val
     * @returns {*}
     */
    Layout.prototype.right=function(val)
    {
        return __method__.call(this,'right',val, true);
    }

    /**
     * 获取设置底边位置
     * @param val
     * @returns {*}
     */
    Layout.prototype.bottom=function(val)
    {
        return __method__.call(this,'bottom',val, true);
    }

    /**
     * 设置获取元素的宽度
     * @param val
     * @returns {*}
     */
    Layout.prototype.width=function(val)
    {
        return __method__.call(this,'width',val, true );
    }

    /**
     * 设置获取元素的高度
     * @param val
     * @returns {*}
     */
    Layout.prototype.height=function(val)
    {
        return __method__.call(this,'height',val, true );
    }

    /**
     * 设置获取指定明确的宽度
     * @param val
     * @returns {*}
     */
    Layout.prototype.explicitWidth=function(val)
    {
        return __method__.call(this,'explicitWidth',val,'width');
    }

    /**
     * 设置获取指定明确的高度
     * @param val
     * @returns {*}
     */
    Layout.prototype.explicitHeight=function(val)
    {
        return __method__.call(this,'explicitHeight',val,'height');
    }

    /**
     * 设置获取指定百分比的宽度
     * @param val
     * @returns {*}
     */
    Layout.prototype.percentWidth=function(val)
    {
        return __method__.call(this,'percentWidth',val, false );
    }

    /**
     * 设置获取指定百分比的高度
     * @param val
     * @returns {*}
     */
    Layout.prototype.percentHeight=function(val)
    {
        return __method__.call(this,'percentHeight',val, false);
    }

    /**
     * 获取设置最大宽度
     * @param val
     * @returns {*}
     */
    Layout.prototype.maxWidth=function(val)
    {
        return __method__.call(this,'maxWidth',val, true);
    }

    /**
     * 获取设置最大高度
     * @param val
     * @returns {*}
     */
    Layout.prototype.maxHeight=function(val)
    {
        return __method__.call(this,'maxHeight',val, true);
    }

    /**
     * 获取设置最小宽度
     * @param val
     * @returns {*}
     */
    Layout.prototype.minWidth=function(val)
    {
        return __method__.call(this,'minWidth',val, true);
    }

    /**
     * 获取设置最小高度
     * @param val
     * @returns {*}
     */
    Layout.prototype.minHeight=function(val)
    {
        return __method__.call(this,'minHeight',val, true);
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
        return __method__.call(this,'gap', val ,false) || 0;
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
                layout.initialized=true;
            }
        })

        var viewport = rootLayout.viewport()
        var width =  Utils.getSize(viewport, 'width');
        var height=  Utils.getSize(viewport, 'height');
            rootLayout.updateDisplayList(  width , height  );
            rootLayout.initialized=true;
    });

    window.Layout=Layout;
    window.LayoutEvent=LayoutEvent;

})( window )
