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
    var rootLayout=null
    ,horizontal=['left','center','right']
    ,vertical=['top','middle','bottom']
    ,__method__ = function(prop, val , flag )
    {
        var skin = this.skinGroup();
        var old = parseInt( skin.property(prop) );
        if( typeof val !== "undefined" )
        {
            val =  parseInt( val );
            if ( flag ) skin.style( flag !== true ? flag : prop, val);
            if ( val !== old )
            {
                skin.property(prop, val);
                this.invalidate=false;
            }
            return this;
        }
        return old;
    };

    /**
     * @param target
     * @param profile
     * @returns {*}
     */
    function getOwner(target)
    {
        var parent=target;
        while( Utils.contains( target.ownerDocument.body, parent ) )
        {
            parent= parent.parentNode;
            var layout = Component.getInstance(parent, Layout );
            if( layout && layout instanceof Layout )
            {
                return layout;
            }
        }
        return Layout.rootLayout();
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

        var skinGroup = target instanceof SkinGroup ? target : new SkinGroup(target);
        var instance = Component.getInstance( skinGroup.current(), Layout );
        if( instance  )return instance;

        Component.call(this,  skinGroup );
        target=this.current();
        if( !Utils.isHTMLElement(target) || !target.parentNode || !Utils.contains( target.ownerDocument.body, target ) )
        {
            throw new Error('Invalid element for Layout');
        }

        this.childrenItem=[];
        var owner = getOwner(target);

        //设置所属父布局容器
        if( owner )
        {
            owner.childrenItem.push(this);
            this.owner = owner;
        }

        Utils.style(target,'position', 'absolute' );
        this.viewport( target.parentNode );
    }

    /**
     * 初始化根布局容器
     * @returns {Layout}
     */
    Layout.rootLayout=function()
    {
        if( rootLayout=== null )
        {
            rootLayout ={'childrenItem':[]};
            Utils.rootEvent().addEventListener([BreezeEvent.RESIZE,Component.INITIALIZE_COMPLETED],function(event)
            {
                var i=0;
                for( ; i < this.childrenItem.length; i++ )
                {
                    this.childrenItem[i].invalidate=false;
                    this.childrenItem[i].updateDisplayList();
                }

            },true,0,rootLayout);
        }
        return rootLayout;
    }

    /**
     * 继承 Breeze
     * @type {window.Component}
     */
    Layout.prototype=new Component();
    Layout.prototype.owner=null;
    Layout.prototype.childrenItem=[];
    Layout.prototype.scrollWidth=0;
    Layout.prototype.scrollHeight=0;
    Layout.prototype.overflowHeight=0;
    Layout.prototype.overflowWidth=0;
    Layout.prototype.invalidate=false;
    Layout.prototype.childrenElement=[];
    Layout.prototype.initializeMethod=['left','top','right','bottom','explicitHeight','explicitWidth','gap',
        'horizontal','vertical','minWidth','minHeight','maxWidth','maxHeight','percentWidth','percentHeight','scrollY','scrollX','viewport'];

    /**
     * @param viewport
     */
    Layout.prototype.viewportChange=function( viewport )
    {
        if( this.__viewportEvent__  )
        {
            this.__viewportEvent__.removeEventListener( LayoutEvent.CHANGE );
        }
        this.__viewportEvent__=new EventDispatcher( viewport ).addEventListener( LayoutEvent.CHANGE ,function(event)
        {
            event.stopPropagation();
            this.invalidate=false;
            this.updateDisplayList();

        },false, 0 , this );
    }

    /**
     * @protected
     */
    Layout.prototype.getDefaultSkinObject=function()
    {
       throw new Error('Not skin');
    }

    /**
     * 输出布局组件名称
     * @returns {string}
     */
    Layout.prototype.toString=function()
    {
        return 'Layout';
    }

    var padding=['Left','Right','Top','Bottom'];

    /**
     * @returns {{width: (number|void), height: (number|void)}}
     */
    Layout.prototype.getViewportSize=function()
    {
        var viewport = this.viewport();
        var scroll = Utils.scroll(viewport)
        var height=scroll.top;
        height+=Utils.getSize( viewport === viewport.ownerDocument.body ? window : viewport,'height');
        var width = scroll.left;
        width+=Utils.getSize( viewport === viewport.ownerDocument.body ? window : viewport,'width');

        for( var index=0 ; index < padding.length ; index++ )
        {
            var val = parseInt( Utils.style( viewport, 'padding'+ padding[ index ] ) ) || 0;
            index < 2 ? width-=val : height-=val;
        }
        return {'width':width,'height':height};
    }

    /**
     * 根据当前的布局特性计算所需要的宽度
     * @returns {Number}
     */
    Layout.prototype.calculateWidth=function( parentWidth )
    {
        var width=this.explicitWidth();
        if( isNaN( width ) )
        {
            var percent = this.percentWidth();
            percent = isNaN(percent) ? 100 : percent;
            width = percent===0 ?  parseInt( Utils.style(this.current(),'width') ) :  percent  / 100 * parentWidth;
        }
        var left = this.left() || 0;
        var right = this.right() || 0;
        var paddingLeft =  parseInt( this.style('paddingLeft') ) || 0;
        var paddingRight =  parseInt( this.style('paddingRight') ) || 0;
        width-=left+right+paddingRight+paddingLeft;
        return this.getMaxOrMinWidth( width );
    }

    /**
     * 根据当前的布局特性计算所需要的高度
     * @returns {Number}
     */
    Layout.prototype.calculateHeight=function( parentHeight )
    {
        var height=this.explicitHeight();
        if( isNaN( height ) )
        {
            var percent = this.percentHeight();
            percent = isNaN(percent) ? 100 : percent;
            height=  percent===0 ?  parseInt( Utils.style(this.current(),'height') ) :  percent / 100 * parentHeight;
        }
        var bottom = this.bottom() || 0;
        var top = this.top() || 0;
        var paddingTop =  parseInt( this.style('paddingTop') ) || 0;
        var paddingBottom =  parseInt( this.style('paddingBottom') ) || 0;
        height-=bottom+top+paddingTop+paddingBottom;
        return this.getMaxOrMinHeight( height );
    }

    /**
     * 获取布局已设置的最大或者最小宽度
     * @param width
     * @returns {Number}
     */
    Layout.prototype.getMaxOrMinWidth=function( width )
    {
        var min=Math.max( this.minWidth() || width , width );
        return Math.min( min,  Math.min( this.maxWidth() || min , min ) );
    }

    /**
     * 获取布局已设置的最大或者最小高度
     * @param width
     * @returns {Number}
     */
    Layout.prototype.getMaxOrMinHeight=function( height )
    {
        var min=Math.max( this.minHeight() || height , height );
        return Math.min( min,  Math.min( this.maxHeight() || min , min ) );
    }

    /**
     * @param x
     * @param y
     * @returns {Layout}
     */
    Layout.prototype.moveTo=function(x,y)
    {
        var oldX =  this.skinGroup().left();
        var oldY = this.skinGroup().top();
        if( x !== oldX || y !== oldY ){

            this.skinGroup().left(x);
            this.skinGroup().top(y);
        }
        return this;
    }

    /**
     * @param val  hidden|visible|auto
     * @returns {boolean|Layout}
     */
    Layout.prototype.scrollY=function( val )
    {
        if( typeof val !== "undefined" )
        {
            this.style('overflowY', val );
            return this;
        }
        var overflowY= this.style('overflowY');
        return !(overflowY === 'hidden');
    }

    /**
     * @param val  hidden|visible|auto
     * @returns {boolean|Layout}
     */
    Layout.prototype.scrollX=function(val)
    {
        if( typeof val !== "undefined" )
        {
            this.style('overflowX', val );
            return this;
        }
        var overflowX= this.style('overflowX');
        return !(overflowX === 'hidden');
    }

    /**
     * @param width
     * @param height
     * @returns {Component}
     */
    Layout.prototype.setLayoutSize=function(width,height)
    {
        var oldh = this.height();
        var oldw = this.width();
        if( oldh !== height ||  oldw !== width )
        {
            this.width( width );
            this.height( height );
            this.dispatchEvent( new LayoutEvent(LayoutEvent.CHANGE) )
        }
        return this;
    }

    /**
     * @param parentWidth
     * @param parentHeight
     */
    Layout.prototype.measureChildren=function(parentWidth,parentHeight)
    {
        var paddingLeft  = parseInt( this.style('paddingLeft') )  || 0
        var paddingRight = parseInt( this.style('paddingRight') ) || 0;
        var paddingTop   =  parseInt( this.style('paddingTop') )  || 0
        var paddingBottom= parseInt( this.style('paddingBottom') )|| 0;
        var gap=this.gap(),x=gap+paddingLeft,y=gap+paddingTop,maxHeight=0,countHeight= 0,countWidth=0;

        var horizontalAlign=this.horizontal()
            ,verticalAlign=this.vertical()
            ,h=horizontalAlign===horizontal[1] ? 0.5 : horizontalAlign===horizontal[2] ? 1 : 0
            ,v=verticalAlign  ===vertical[1]   ? 0.5 : verticalAlign  ===vertical[2]   ? 1 : 0;

        var children =  [];
        var target = this.skinGroup().current();

        var hscroll = this.scrollWidth ;
        var vscroll = this.scrollHeight ;
        if( this.owner instanceof Layout )
        {
            hscroll=Math.max(this.owner.scrollWidth,hscroll);
            vscroll=Math.max(this.owner.scrollHeight,vscroll);
        }

        if( target && target.childNodes && target.childNodes.length>0 )
        {
            var len = target.childNodes.length, index=0;
            for( ; index<len; index++)
            {
                var child = target.childNodes.item( index );
                this.current( child );
                if( Utils.isHTMLElement(child) && this.property('includeLayout' )!=='false' )
                {
                    this.style('position','absolute')
                    var childWidth = this.width() ||  this.calculateWidth( parentWidth );
                    var childHeight= this.height() || this.calculateHeight( parentHeight );
                    var marginLeft =  parseInt( this.style('marginLeft') ) || 0;
                    var marginRight =  parseInt( this.style('marginRight') ) || 0;
                    var marginTop = parseInt( this.style('marginTop') ) || 0;
                    var marginBottom = parseInt( this.style('marginBottom') ) || 0;

                    //从第二个子级元素开始，如大于了容器宽度则换行
                    if (x + childWidth+gap+marginLeft+marginRight+paddingRight-hscroll > parentWidth && index > 0)
                    {
                        y += maxHeight;
                        x = gap+paddingLeft;
                        maxHeight = 0;
                    }
                    children.push({
                        'target': child,
                        'left': x + marginLeft,
                        'top': y + marginTop,
                        'width':childWidth,
                        'height':childHeight
                    });
                    x += childWidth+gap+marginRight;
                    maxHeight = Math.max(maxHeight, childHeight + gap+marginTop+marginBottom);
                    countHeight = maxHeight + y;
                    countWidth = Math.max(countWidth, x+paddingRight );
                }
            }
            this.current( null );
        }

        var scrollbarSize=17;
        var scrollbarChanged= false;

        //监测垂直滚动条
         if( !this.scrollY() )
         {
             parentHeight= Math.max(parentHeight, countHeight)

         }else if( parentHeight < countHeight )
         {
             if( this.scrollWidth!==scrollbarSize )
             {
                 this.scrollWidth=scrollbarSize;
                 scrollbarChanged=true;
             }

         }else if( this.scrollWidth===scrollbarSize )
         {
             this.scrollWidth=0;
             scrollbarChanged=true;
         }

        //监测水平滚动条
         if( !this.scrollX() )
         {
            parentWidth= Math.max(parentWidth, countWidth)

         }else if(parentWidth < countWidth)
         {
             if( this.scrollHeight!==scrollbarSize )
             {
                 this.scrollHeight=scrollbarSize;
                 scrollbarChanged=true
             }

         }else if( this.scrollHeight===scrollbarSize )
         {
             this.scrollHeight=0;
             scrollbarChanged=true;
         }

         if( scrollbarChanged === true )
         {
            this.updateDisplayList();
            return;
         }

        //需要整体排列
        if( children.length > 0 )
        {
            var gap=this.gap();
            var xOffset, yOffset, index=0;
            xOffset = Math.floor((parentWidth-countWidth - hscroll  ) * h);
            yOffset = Math.floor((parentHeight - countHeight - vscroll ) * v);

            if( this.scrollY() &&  xOffset< 0 )
                xOffset=gap+paddingLeft;

            if( this.scrollX() && yOffset < 0 )
                yOffset=gap+paddingTop;

            for( ; index < children.length ; index++ )
            {
                var child = children[index];
                var instance = Component.getInstance(child.getEventTarget,Layout)
                if( instance )
                {
                    instance.moveTo(child.left + xOffset, child.top + yOffset );
                    instance.setLayoutSize(child.width,child.height);

                }else
                {

                    Utils.style(child.getEventTarget,'left', child.left + xOffset );
                    Utils.style(child.getEventTarget,'top', child.top + yOffset );
                    Utils.style(child.getEventTarget,'width',child.width);
                    Utils.style(child.getEventTarget,'height',child.height);
                }
            }
        }
        this.setLayoutSize(parentWidth,parentHeight);
    }

    /**
     * 更新布局视图
     * @returns {Layout}
     */
    Layout.prototype.updateDisplayList=function()
    {
        if( this.invalidate )
            return this;

        this.invalidate=true;
        this.current(null);

        //获取视口大小

        var viewport= this.getViewportSize();
        parentWidth = viewport.width;
        parentHeight= viewport.height;

        //计算当前布局可用的大小
        var  realHeight=this.calculateHeight(parentHeight) ;
        var  realWidth= this.calculateWidth(parentWidth);

        this.width( realWidth );
        this.height( realHeight );

        //先从子级布局开始测量
        for( var index in this.childrenItem )
        {
            this.childrenItem[index].invalidate=false;
            this.childrenItem[index].updateDisplayList();
        }

        //计算子级元素需要排列的位置
        this.measureChildren( realWidth, realHeight );
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

    /**
     * @param src
     * @param props
     * @constructor
     */
    function LayoutEvent(type, bubbles,cancelable ){ BreezeEvent.call(this,type, bubbles,cancelable ); };
    LayoutEvent.prototype=new BreezeEvent();
    LayoutEvent.prototype.constructor=LayoutEvent;
    LayoutEvent.CHANGE='layoutChange';

    window.Layout=Layout;
    window.LayoutEvent=LayoutEvent;

})( window )
