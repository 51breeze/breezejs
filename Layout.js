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
    ,__method__ = function(prop, val , flag )
    {
        var old = parseInt( this.property(prop) );
        if( typeof val !== "undefined" )
        {
            val =  parseInt( val );
            if ( flag ) this.style( flag !== true ? flag : prop, val);
            if ( val !== old )
            {
                this.property(prop, val);
                if( this.initialized )this.invalidate=false;
            }
            return this;
        }
        return old;
    };


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
            _viewport = doc.body === _viewport ? doc : _viewport;
        var map={'body':doc.body,'window': win, 'document':win.document }

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

            if( Utils.isHTMLContainer(viewport) || Utils.isWindow(viewport) )
            {
                _viewport=viewport;
                return this;
            }
            throw new Error('invaild viewport')
        }

        /**
         * @private
         */
        this.addEventListener(LayoutEvent.CHANGED,function(event){

            if( event.propagationStopped )
              return;

            //更新子布局的显示列表
             if( this.childrenItem.length > 0 )
             {
                 var i=0;
                 for( ; i < this.childrenItem.length; i++ )
                 {
                     //当前元素为子级元素的视口时
                     if( this.current() === this.childrenItem[i].viewport() )
                     {
                         this.childrenItem[i].updateDisplayList( this.width(), this.height() );
                     }
                     //当前的子级布局的视口元素不是一个布局组件
                     else
                     {
                         this.childrenItem[i].updateDisplayList( undefined, undefined );
                     }
                 }
             }
        })
    }

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
                EventDispatcher.prototype.addEventListener.call(this,type,listener,useCapture,priority);
            }
            var method=['gap','horizontal','vertical'];
            for( var prop in method )
            {
                value = rootLayout.property( method[prop] );
                if( value !== null )
                {
                    rootLayout[ method[prop] ]( value );
                }
            }
            rootLayout.addEventListener( BreezeEvent.RESIZE , function(event){
                this.invalidate=false;
                this.updateDisplayList();
            });
        }
        return rootLayout;
    }


    /**
     * @param src
     * @param props
     * @constructor
     */
    function LayoutEvent(src, props){ BreezeEvent.call(this, src, props); };
    LayoutEvent.prototype=new BreezeEvent();
    LayoutEvent.CHANGED='layoutChanged';
    LayoutEvent=LayoutEvent;


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
    Layout.prototype.childrenElement=[];

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
        var paddingLeft =  parseInt( this.style('paddingLeft') ) || 0;
        var paddingRight =  parseInt( this.style('paddingRight') ) || 0;
        width-=left+right+paddingRight+paddingLeft;
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
        var paddingTop =  parseInt( this.style('paddingTop') ) || 0;
        var paddingBottom =  parseInt( this.style('paddingBottom') ) || 0;
        height-=bottom+top+paddingTop+paddingBottom;
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

    /**
     * @param x
     * @param y
     * @returns {Layout}
     */
    Layout.prototype.moveTo=function(x,y)
    {
        Breeze.prototype.left.call(this,x);
        Breeze.prototype.top.call(this,y);
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
        return !(overflowY === 'hidden' || overflowY==='visible');
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
        return !(overflowX === 'hidden' || overflowX==='visible');
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
            ,v=verticalAlign  ===vertical[1]   ? 0.5 : verticalAlign  ===vertical[2]   ? 1 : 0
            ,flag = h+v > 0;

        this.childrenElement=[];
        var children =  this.childrenElement;
        var target = this.current();
        var isroot = this === rootLayout;

        if( target && target.childNodes && target.childNodes.length>0 )
        {
            var len = target.childNodes.length, index=0;
            for( ; index<len; index++)
            {
                var child = target.childNodes.item( index );
                this.current( child );
                if( child.nodeType===1 && child.getAttribute( 'includeLayout' )!=='false' && ( !isroot || this.data('layout') instanceof Layout ) )
                {
                    this.style('position','absolute')
                    var childWidth = this.width() || this.calculateWidth( parentWidth );
                    var childHeight= this.height() || this.calculateHeight( parentHeight );
                    var marginLeft =  parseInt( this.style('marginLeft') ) || 0;
                    var marginRight =  parseInt( this.style('marginRight') ) || 0;
                    var marginTop = parseInt( this.style('marginTop') ) || 0;
                    var marginBottom = parseInt( this.style('marginBottom') ) || 0;

                    //从第二个子级元素开始，如大于了容器宽度则换行
                    if (x + childWidth+gap+marginLeft+marginRight+paddingRight > parentWidth && index > 0)
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

        this.totalChildWidth=countWidth;
        this.totalChildHeight=countHeight;

        if( this === rootLayout && countHeight < parentHeight ||  countWidth < parentWidth )
        {
            parentHeight= Math.min( Utils.getSize( window ,'height'), parentHeight);
            parentWidth= Math.min( Utils.getSize( window ,'width'), parentWidth);
        }

        //需要整体排列
        if( children.length > 0 )
        {
            var gap=this.gap();
            var xOffset, yOffset, index=0;
            xOffset = Math.floor((parentWidth-countWidth - gap  ) * h);
            yOffset = Math.floor((parentHeight - countHeight - gap  ) * v);
            for( ; index < children.length ; index++ )
            {
                var child = children[index];
                var layout = Utils.storage(child.target,'layout');
                if( layout instanceof Layout )
                {
                    layout.moveTo(child.left + xOffset, child.top + yOffset )
                    layout.width( child.width );
                    layout.height( child.height );
                    layout.validateNow();
                }else
                {
                    Utils.style(child.target,'left', child.left + xOffset);
                    Utils.style(child.target,'top', child.top + yOffset);
                    Utils.style(child.target,'width', child.width);
                    Utils.style(child.target,'height', child.height);
                }
            }
        }

        parentHeight=!this.scrollY() ? Math.max(parentHeight, countHeight) : parentHeight;
        parentWidth=!this.scrollX() ? Math.max(parentWidth, countWidth) : parentWidth;

        this.overflowHeight= Math.max(countHeight-parentHeight,0);
        this.overflowWidth = Math.max(countWidth-parentWidth,0);

        this.height( parentHeight );
        this.width( parentWidth );

    }

    /**
     * @returns {Layout}
     */
    Layout.prototype.validateNow=function()
    {
        if( !this.invalidate )
        {
           this.dispatchEvent( new LayoutEvent( LayoutEvent.CHANGED ) );
        }
        return this;
    }

    /**
     * 更新布局视图
     * @returns {Layout}
     */
    Layout.prototype.updateDisplayList=function(parentWidth,parentHeight)
    {
        if( this.invalidate )return false;
        this.invalidate=true;

        parentWidth = parseInt( parentWidth );
        parentHeight = parseInt( parentHeight );

        //获取视口大小
        if( isNaN( parentWidth ) || isNaN( parentHeight ) )
        {
            var viewport= this.viewport();
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
                this.childrenItem[i].invalidate=false;
                //当前元素为子级元素的视口时
                if( this.current() === this.childrenItem[i].viewport() )
                {
                    this.childrenItem[i].updateDisplayList( realWidth, realHeight );
                }
                //当前的子级布局的视口元素不是一个布局组件
                else
                {
                   this.childrenItem[i].updateDisplayList( undefined, undefined );
                }
            }
        }

        //计算子级元素需要排列的位置
        this.measureChildren( realWidth, realHeight );

        //验证是否有变动
        this.validateNow();
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
        Breeze('[component=layout]', rootLayout ).forEach(function(target)
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
       rootLayout.updateDisplayList();

    });

    window.Layout=Layout;
    window.LayoutEvent=LayoutEvent;

})( window )
