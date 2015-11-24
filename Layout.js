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
        this.property('islayout',true);
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
            rootLayout = new Layout( window.document.body );
            rootLayout.measureWidth=function(){ return this.current(window).width(); }
            rootLayout.measureHeight=function(){return this.current(window).height(); }
            rootLayout.addEventListener('resize',function(event)
            {
                this.updateDisplayList( this.measureWidth(), this.measureHeight() );
            })
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
        var margin=this.getMargin();
        return this.width() + margin.left + margin.right;
    }

    /**
     * 测量当前元素的高度
     * @returns {Number|string}
     */
    Layout.prototype.measureHeight=function()
    {
        var margin=this.getMargin()
        return this.height()+margin.top + margin.bottom;
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
            width=parentWidth;
            var left=this.left() ,right=this.right();
            if( !isNaN(left) )
               width-=left;
            if( !isNaN(right) )
                width-=right;
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
            height=parentHeight;
            var top=this.top() || 0,bottom=this.bottom() || 0;

            console.log(top+bottom,  height )
            height-=top+bottom;
        }
        console.log(  height  , '==================', parentHeight )

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
     * 获取边距
     * @param target
     * @returns {{}}
     */
    Layout.prototype.getMargin=function()
    {
        var i,margin={'left':'Left','top':'Top','right':'Right','bottom':'Bottom'}
        var val={};
        for( i in margin )
        {
            val[i] = parseInt( this.style('margin' + margin[i]) ) || 0;
        }
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

        console.log( parentWidth, parentHeight , this )

        var measureWidth=this.calculateWidth( parentWidth );
        var measureHeight=this.calculateHeight( parentHeight );

        console.log( measureWidth, measureHeight , this , '=====')

        //更新子布局的显示列表
        if( this.childrenItem.length > 0 )
        {
            var i=0;
            for( ; i < this.childrenItem.length; i++ )
            {
                this.childrenItem[i].updateDisplayList(measureWidth, measureHeight);
            }
        }

        if( this === rootLayout )return;

        console.log( measureWidth, measureHeight , this )
        return

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

            }else if( !this.property('islayout') )
            {
                this.style('left',x);
                this.style('top' ,y);
            }

            x += childWidth+gap;
            maxHeight=Math.max(maxHeight,childHeight+gap);
            countWidth=Math.max(countWidth,x);

        }).revert();



        countHeight+=maxHeight+gap;

        var realWidth=measureWidth;
        var realHeight=measureHeight;

        realWidth = this.explicitWidth()  || this.getMaxOrMinHeight( Math.max( measureWidth,countWidth ) ) ;
        realHeight= this.explicitHeight() || this.getMaxOrMinWidth( Math.max(measureHeight,countHeight) ) ;


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

        this.width( realWidth );
        this.height( realHeight );
    }

    /**
     * @param prop
     * @param val
     * @returns {*}
     */
    var position = function(prop, val )
    {
        var old = Breeze.prototype[prop].call( this ) || NaN;
        if( typeof val !== "undefined")
        {
            val = parseFloat(val) || NaN;
            if ( val !== old && this !== rootLayout )
            {
                var uprop= Utils.ucfirst(prop);
                val += parseFloat( this.style('margin'+uprop+'Width') ) || 0;
                this.style('margin'+uprop+'Width', '0px');
                Breeze.prototype[prop].call(this,val);
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
       return position.call(this,'left',val);
    }

    /**
     * 获取设置顶边位置
     * @param val
     * @returns {*}
     */
    Layout.prototype.top=function(val)
    {
        return position.call(this,'top',val);
    }

    /**
     * 获取设置右边位置
     * @param val
     * @returns {*}
     */
    Layout.prototype.right=function(val)
    {
        return position.call(this,'right',val);
    }

    /**
     * 获取设置底边位置
     * @param val
     * @returns {*}
     */
    Layout.prototype.bottom=function(val)
    {
        return position.call(this,'bottom',val);
    }


    /**
     * @param prop
     * @param val
     * @returns {*}
     */
    var size = function(prop, val )
    {
        var old =  this['__'+prop+'__'] || NaN;
        if( typeof val !== "undefined" )
        {
            val = parseFloat(val) || NaN ;
            if ( val !== old && this !== rootLayout )
            {
                this['__'+prop+'__']=val;
                dispatchLayoutEvent(this, prop, val, old);
            }
            return this;
        }
        return old;
    }

    /**
     * 设置获取指定的宽度
     * @param val
     * @returns {*}
     */
    Layout.prototype.explicitWidth=function(val)
    {
        return size.call(this,'explicitWidth',val);
    }

    /**
     * 设置获取指定的高度
     * @param val
     * @returns {*}
     */
    Layout.prototype.explicitHeight=function(val)
    {
        return size.call(this,'explicitHeight',val);
    }

    /**
     * @param prop
     * @param val
     * @returns {*}
     */
    var range = function(prop, val )
    {
        var old =  this['__'+prop+'__'] || parseFloat( this.style(prop) ) || NaN;
        if( typeof val !== "undefined" )
        {
            val = parseFloat(val) || NaN;
            if ( val !== old && this !== rootLayout )
            {
                this['__'+prop+'__']=val;
                this.style(prop,val);
                dispatchLayoutEvent(this, prop, val, old);
            }
            return this;
        }
        return old;
    }

    /**
     * 获取设置最大宽度
     * @param val
     * @returns {*}
     */
    Layout.prototype.maxWidth=function(val)
    {
        return range.call(this,'maxWidth',val);
    }

    /**
     * 获取设置最大高度
     * @param val
     * @returns {*}
     */
    Layout.prototype.maxHeight=function(val)
    {
        return range.call(this,'maxHeight',val);
    }

    /**
     * 获取设置最小宽度
     * @param val
     * @returns {*}
     */
    Layout.prototype.minWidth=function(val)
    {
        return range.call(this,'minWidth',val);
    }

    /**
     * 获取设置最小高度
     * @param val
     * @returns {*}
     */
    Layout.prototype.minHeight=function(val)
    {
        return range.call(this,'minHeight',val);
    }

    /**
     * @param prop
     * @param val
     * @returns {*}
     */
    var align= function(prop, val )
    {
        var a= prop=='horizontal' ? horizontal : vertical;
        var old =  this['__'+prop+'__'] || a[0];
        if( typeof val === "string" )
        {
            val =  val.toLowerCase();
            if ( Utils.inObject(a,val) !==null && val !== old && this !== rootLayout )
            {
                this['__'+prop+'__']=val;
                dispatchLayoutEvent(this, prop, val, old);
            }
            return this;
        }
        return old;
    }

    /**
     * 设置水平对齐的方位
     * @param val
     * @returns {*}
     */
    Layout.prototype.horizontal=function(val)
    {
        return align.call(this,'horizontal',val);
    }

    /**
     * 设置垂直对齐的方位
     * @param val
     * @returns {*}
     */
    Layout.prototype.vertical=function(val)
    {
        return align.call(this,'vertical',val);
    }

    /**
     * 获取设置间隔
     * @param number val
     * @returns {*}
     */
    Layout.prototype.gap=function(val)
    {
        var old =  this['__gap__'] || 5;
        if( typeof val === "number" )
        {
            if ( !isNaN(old) && val !== old && this !== rootLayout )
            {
                this['__gap__']=val;
                dispatchLayoutEvent(this, 'gap', val, old);
            }
            return this;
        }
        return old;
    }



    //初始化布局组件
    Breeze.ready(function(){

        var rootLayout = Layout.rootLayout();
        var method=['left','top','right','bottom','explicitHeight','explicitWidth','gap','horizontal','vertical','minWidth','minHeight','maxWidth','maxHeight'];
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
        rootLayout.updateDisplayList( rootLayout.measureWidth(), rootLayout.measureHeight() );
    });

    window.Layout=Layout;
    window.LayoutEvent=LayoutEvent;

})( window )
