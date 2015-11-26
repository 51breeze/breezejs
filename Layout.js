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
                this.updateDisplayList();
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
     * 测量当前元素的宽度
     * @returns {Number|string}
     */
    Layout.prototype.measureWidth=function()
    {
        var marginLeft = parseInt( this.style('marginLeft') ) || 0;
        var marginRight = parseInt( this.style('marginRight') ) || 0;
        return this.width() + marginLeft + marginRight;
    }

    /**
     * 测量当前元素的高度
     * @returns {Number|string}
     */
    Layout.prototype.measureHeight=function()
    {
        var marginTop = parseInt( this.style('marginTop') ) || 0;
        var marginBottom = parseInt( this.style('marginBottom') ) || 0;
        return this.height()+marginTop + marginBottom;
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
            width= this.percentWidth() / 100 * parentWidth;
            var marginLeft = parseInt( this.style('marginLeft') ) || 0;
            var marginRight = parseInt( this.style('marginRight') ) || 0;
            var left=this.left() || 0,
                right=this.right() || 0;
            width-=(left+marginLeft+right+marginRight);
        }
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
            height= this.percentHeight() / 100 * parentHeight;
            var marginTop = parseInt( this.style('marginTop') ) || 0;
            var marginBottom = parseInt( this.style('marginBottom') ) || 0;
            var top=this.top() || 0,
                bottom=this.bottom() || 0;
            height-=(top+marginTop+bottom+marginBottom);
        }
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
     * @private
     */
    var __margin__={'left':'Left','top':'Top','right':'Right','bottom':'Bottom'};

    /**
     * 获取边距
     * @param target
     * @returns {{}}
     */
    Layout.prototype.getMargin=function()
    {
        var val={};
        for( i in __margin__ )val[i] = parseInt( this.style('margin' + __margin__[i] ) ) || 0;
        return val;
    }

    /**
     * 更新布局视图
     * @returns {Layout}
     */
    Layout.prototype.updateDisplayList=function(parentWidth,parentHeight)
    {
        var horizontalAlign=this.horizontal()
            ,verticalAlign=this.vertical()
            ,gap=this.gap()
            ,h=horizontalAlign===horizontal[1] ? 0.5 : horizontalAlign===horizontal[2] ? 1 : 0
            ,v=verticalAlign  ===vertical[1]   ? 0.5 : verticalAlign  ===vertical[2]   ? 1 : 0
            ,flag=h+v > 0
            ,grid=[]
            ,columns=[]
            ,x=gap,y=gap,maxHeight= 0,countHeight= 0,countWidth=0;

        if( typeof parentWidth !== "number" || typeof parentHeight !== "number" )
        {
            var owner = this.owner || this;
            parentWidth= owner.measureWidth();
            parentHeight = owner.measureHeight();
        }

        var measureWidth=this.calculateWidth( parentWidth );
        var measureHeight=this.calculateHeight( parentHeight );k


        //更新子布局的显示列表
        if( this.childrenItem.length > 0 )
        {
            var i=0;
            for( ; i < this.childrenItem.length; i++ )
            {
                this.childrenItem[i].updateDisplayList(measureWidth, measureHeight);
            }
        }

        if( this === Layout.rootLayout() )return;

         //计算子级元素需要排列的位置
        this.children(':not([includeLayout=false])').forEach(function(child,index)
        {
            this.style('position','absolute')
            var childWidth=this.width()
                ,childHeight=this.height()
                ,margin=this.getMargin()

            childWidth+=margin.left + margin.right;
            childHeight+=margin.top + margin.bottom;

            //从第二个子级元素开始，如于大于了容器宽度则换行
            if( x+childWidth+gap > measureWidth && index > 0 )
            {
                if( flag )
                {
                    columns.push( x );
                    grid.push( columns );
                    columns=[];
                }
                countHeight+=maxHeight;
                countWidth=Math.max(countWidth,x);
                y+=maxHeight;
                x=gap;
                maxHeight=0;
            }

            if( flag )
            {
                columns.push( {'target':child,'left':x,'top':y} );
            }
            x += childWidth+gap;
            maxHeight=Math.max(maxHeight,childHeight+gap);
            countWidth=Math.max(countWidth,x);

        }).revert();


        var realWidth= this.explicitWidth()  || this.getMaxOrMinHeight( measureWidth );
        var realHeight=this.explicitHeight() || this.getMaxOrMinWidth( measureHeight );

        //需要整体排列
        if( flag )
        {
            columns.push( countWidth );
            grid.push( columns )

            var items,size,xOffset,yOffset,index,b;
             xOffset= Math.floor( (realWidth-countWidth)*h ) ;
             yOffset= Math.floor( (realHeight-countHeight)*v ) ;

            for( index in grid )
            {
               items=grid[ index ].splice(0,grid[ index ].length-1);
               size=grid[ index ];
               for( b in items )
               {
                   this.current( items[b].target );
                   this.left( items[b].left+xOffset );
                   this.top( items[b].top+yOffset );
               }
            }
        }

        console.log( realHeight )

        this.width( realWidth );
        this.height( realHeight );
    }

    /**
     * @private
     */
    var __property__ = function(prop, val , flag )
    {
        var old =  parseInt( this.property(prop) );
        if( typeof val !== "undefined" )
        {
            val = parseInt( val );
            if( flag ===true )this.style(prop,val);
            if ( val !== old && this !== rootLayout )
            {
                this.property(prop,val);
                dispatchLayoutEvent(this, prop, val, old);
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
     * 设置获取指定的宽度
     * @param val
     * @returns {*}
     */
    Layout.prototype.explicitWidth=function(val)
    {
        return __property__.call(this,'explicitWidth',val);
    }

    /**
     * 设置获取指定的高度
     * @param val
     * @returns {*}
     */
    Layout.prototype.explicitHeight=function(val)
    {
        return __property__.call(this,'explicitHeight',val);
    }

    /**
     * 设置获取指定百分比的宽度
     * @param val
     * @returns {*}
     */
    Layout.prototype.percentWidth=function(val)
    {
        return __property__.call(this,'percentWidth',val) || 100;
    }

    /**
     * 设置获取指定百分比的高度
     * @param val
     * @returns {*}
     */
    Layout.prototype.percentHeight=function(val)
    {
        return __property__.call(this,'percentHeight',val) || 100;
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
        if( typeof val === "undefined" )
          return __property__.call(this,'horizontal') || horizontal[0];

        val=val.toLowerCase();
        if ( Utils.inObject(horizontal,val) !== null )
            __property__.call(this,'horizontal', val );
        return this;
    }

    /**
     * 设置垂直对齐的方位
     * @param val
     * @returns {*}
     */
    Layout.prototype.vertical=function(val)
    {
        if( typeof val === "undefined" )
            return __property__.call(this,'vertical') || vertical[0];
        val=val.toLowerCase();
        if ( Utils.inObject(vertical,val) !== null )
            __property__.call(this,'vertical', val );
        return this;
    }

    /**
     * 获取设置间隔
     * @param number val
     * @returns {*}
     */
    Layout.prototype.gap=function(val)
    {
        return __property__.call(this,'gap', val ) || 0;
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
        rootLayout.updateDisplayList();
    });

    window.Layout=Layout;
    window.LayoutEvent=LayoutEvent;

})( window )
