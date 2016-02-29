
/********************************************************
 @class : 时间轴模拟类。
          这个时间轴实现了添加关键侦和跳转到指定的侦进行播放或者停止动作。
          实现了重复播放多少次或者倒放的功能，时间轴的播放时长是由每个添加的关键侦所决定的。
 @param: fps 播放速率,按每秒来计算,默认为24侦每秒
 @example
var tl= new Timeline(60).addFrame(function(){
        console.log( this.current() +'>>'+this.__name__ )
    },3,'one').reverse( true ).addFrame(function(){
        console.log( this.current() +'>>'+this.__name__ )
    },21,'two')
    tl.play();
**********************************************************/

(function(window,undefined)
{
    'use strict';

     var support=true,
         prefix=Utils.getBrowserPrefix().replace(/-/g,''),
         now= performance ? performance.now || performance[ prefix+'Now' ] || null : null,
         requestAnimationFrame = window.requestAnimationFrame || window[prefix+'RequestAnimationFrame'] || null,
         cancelAnimationFrame  = window.cancelAnimationFrame  || window[prefix+'CancelAnimationFrame']  || null;

    if( !requestAnimationFrame )
    {
        var lastTime= 0;
        requestAnimationFrame = function(callback)
        {
            var currTime = getTime();
            var interval = Math.max( 0, 16 - ( currTime - lastTime ) );
            lastTime = currTime + interval;
            return window.setTimeout(callback, interval );
        };
        cancelAnimationFrame = function(id)
        {
            window.clearTimeout(id);
        };
        support=false;
    }

    /**
     * @private
     * @returns {*}
     */
     function getTime()
     {
        return now ? now.call(performance) : new Date().getTime();
     };

    /**
     * @private
     * @param type
     * @param data
     */
    function dipatcher( type , data )
    {
        if( this.hasEventListener(type) )
        {
            var event= new TimelineEvent( type );
            for(var prop in data )event[prop] = data[prop];
            this.dispatchEvent( event );
        }
    }

    /**
     * @private
     * @param name
     * @returns {*}
     */
    function getFrameIndexByName( name )
    {
        for( var index in __frame__) if(  __frame__[ index ].name===name )
        {
            return index;
        }
        return -1;
    }

    /**
     * @private
     * @param index
     * @returns {*}
     */
    function getFrameByIndex(frames, index )
    {
        if( typeof index === 'number' )
        {
            for( var i in frames ) if( frames[ i ].start <= index && frames[ i ].end >= index )
            {
                return i;
            }
        }
        return -1;
    }


    /**
     * 时间轴事件
     * @param type
     * @param bubbles
     * @param cancelable
     * @constructor
     */
    function TimelineEvent(type, bubbles,cancelable ){BreezeEvent.call(this,type, bubbles,cancelable );}
    TimelineEvent.prototype=new BreezeEvent();
    TimelineEvent.prototype.constructor=TimelineEvent;
    TimelineEvent.PLAY='timelinePlay';
    TimelineEvent.STOP='timelineStop';
    TimelineEvent.FINISH='timelineFinish';
    TimelineEvent.REPEAT='timelineRepeat';
    TimelineEvent.REVERSE='timelineReverse';
    TimelineEvent.ADD_FRAME='timelineAddFrame';
    TimelineEvent.REMOVE_FRAME='timelineRemoveFrame';
    TimelineEvent.PAUSE='timelinePause';
    window.TimelineEvent=TimelineEvent;

    //兼容css3 动画事件
    if( support )
    {
        //播放完成
        EventDispatcher.SpecialEvent(TimelineEvent.FINISH,function(element,listener)
        {
            EventDispatcher.addEventListener.call(element, Utils.lcfirst( prefix+'AnimationEnd' ),listener,function(event)
            {
                event= BreezeEvent.create( event );
                event.type= TimelineEvent.FINISH;
                EventDispatcher.dispatchEvent(event);
            })
            return false;
        })

        //重复播放
        EventDispatcher.SpecialEvent(TimelineEvent.REPEAT,function(element,listener)
        {
            EventDispatcher.addEventListener.call(element, Utils.lcfirst( prefix+'AnimationIteration') ,listener,function(event)
            {
                event= BreezeEvent.create( event );
                event.type= TimelineEvent.REPEAT;
                EventDispatcher.dispatchEvent(event);
            })
            return false;
        })
    }


    function Timeline( elements )
    {
        this.__smooth__ = true;
        this.__fps__= 50 ;
        this.__length__=0;
        this.__frames__=[];
        this.__current__=0;
        this.__repeats__=1;
        this.__reverse__=false;
        this.__tid__=null;
        this.__strict__=true;
        this.__pauseTime__=0;
        this.__pauseTimes__=0;
        this.__paused__=false;
        this.__time__=0;
        this.__startTime__=0;
        this.__lastTime__=0;
        this.__counter__=0;
        this.__flag__=true; //是否正序播放还是倒序播放
        this.__delay__=0;
        EventDispatcher.call(this, elements );
    }

    Timeline.prototype=new EventDispatcher();
    Timeline.prototype.constructor=Timeline;

    /**
     * 重复播放多少次-1为无限循环播放
     * @param number
     * @returns {Timeline}
     */
    Timeline.prototype.repeat=function( num )
    {
        if( typeof num !== "undefined" )
        {
            num= parseInt(num)
            isNaN(num) || (this.__repeats__=num);
            return this;
        }
        return this.__repeats__ || 1;
    }

    /**
     * 动画函数
     * @param string|function fn 默认 linear
     * linear：线性过渡。等同于贝塞尔曲线(0.0, 0.0, 1.0, 1.0)
     * ease：平滑过渡。等同于贝塞尔曲线(0.25, 0.1, 0.25, 1.0)
     * ease-in：由慢到快。等同于贝塞尔曲线(0.42, 0, 1.0, 1.0)
     * ease-out：由快到慢。等同于贝塞尔曲线(0, 0, 0.58, 1.0)
     * ease-in-out：由慢到快再到慢。等同于贝塞尔曲线(0.42, 0, 0.58, 1.0)
     * step-start：等同于 steps(1, start)
     * step-end：等同于 steps(1, end)
     * steps(<integer>[, [ start | end ] ]?)：接受两个参数的步进函数。第一个参数必须为正整数，指定函数的步数。第二个参数取值可以是start或end，指定每一步的值发生变化的时间点。第二个参数是可选的，默认值为end。
     * cubic-bezier(<number>, <number>, <number>, <number>)：特定的贝塞尔曲线类型，4个数值需在[0, 1]区间内
     * @returns {*|string}
     */
    Timeline.prototype.timingFunction=function( fn )
    {
        if( typeof fn !== "undefined" )
        {
            this.__function__= fn ;
            return this;
        }
        return this.__function__ || 'Linear';
    }

    /**
     * 当播放头到达结尾时是否需要倒转播放
     * @param val
     * @returns {Timeline}
     */
    Timeline.prototype.reverse=function( val )
    {
        if( typeof val !== "undefined" )
        {
            this.__reverse__=val;
            return this;
        }
        return !!this.__reverse__;
    }

    /**
     * 开始播放时间轴
     * @returns {Timeline}
     */
    Timeline.prototype.play=function()
    {
        this.gotoAndPlay( Math.min(this.__current__+1, this.__length__ ) );
        return this;
    }

    /**
     * 停止播放时间轴
     * @returns {Timeline}
     */
    Timeline.prototype.stop=function()
    {
        if( this.__tid__ !==null ){
            cancelAnimationFrame( this.__tid__ );
            this.__tid__=null;
        }
        this.__paused__=false;
        this.__isPlaying__=false;
        this.__time__=0;
        this.__lastTime__=0;
        this.__startTime__=0;
        this.__pauseTime__=0;
        this.__counter__=0;
        this.__delay__=0;
        dipatcher.call(this, TimelineEvent.STOP );
        return this;
    }

    /**
     * 暂停播放
     * @returns {Timeline}
     */
    Timeline.prototype.pause=function()
    {
        if( !this.__paused__ )
        {
            this.__paused__=true;
            this.__isPlaying__=false;
            if( this.__tid__ !==null ){
                cancelAnimationFrame( this.__tid__ );
                this.__tid__=null;
            }
            dipatcher.call(this, TimelineEvent.PAUSE );
            this.__pauseTime__=getTime();
        }
        return this;
    }

    /**
     * 获取已播放的时长,以毫秒为单位
     * @returns {number|*}
     */
    Timeline.prototype.time=function()
    {
        return Math.round( this.__time__ );
    }

    /**
     * 获取当前动画需要持续的总时长,以毫秒为单位。
     * @returns {number}
     */
    Timeline.prototype.calculateDuration=function( length )
    {
        var interval = Math.max(1000 / this.fps(), 16.7 );
        return Math.round( (length || this.length() ) * interval );
    }

    /**
     * 时间轴的计数器，当前播放放了多少个侦格。
     * @returns {number}
     */
    Timeline.prototype.counter = function()
    {
        return this.__counter__;
    }

    /**
     * @private
     */
    Timeline.prototype.__enable__=true;

    /**
     * 在浏览器支持的情况下是否需要使用用css3的动画, 默认开启。
     * @param boolean val true 开启 false 禁用
     * @returns {boolean}
     */
    Timeline.prototype.enable = function( val )
    {
        if(typeof val !== "undefined" )
        {
            this.__enable__=!!val;
            return this;
        }
        return ( !!this.__enable__ && support );
    }


     /**
     * @private
     */
    Timeline.prototype.__smooth__=true;

    /**
     * 是否使用平滑模式
     * @param boolean val true 是 false 否
     * @returns {boolean}
     */
    Timeline.prototype.smooth = function( val )
    {
        if(typeof val !== "undefined" )
        {
            this.__smooth__ = !!val;
            return this;
        }
        return !!this.__smooth__;
    }

    /**
     * 播放头需要播放的总侦格的长度。
     * 如果设置了倒放则是单向侦格*2
     * @return number
     */
    Timeline.prototype.length=function()
    {
        var val= this.__length__ * Math.max(this.repeat(),1);
        return this.__reverse__ ? val * 2 : val;
    }

    /**
     * 设置播放时的延时时间
     * @param number delay 延时时间以毫秒为单位
     * @return number
     */
    Timeline.prototype.delay=function( delay )
    {
        if( typeof delay !== "undefined" )
        {
            this.__delay__ =  delay;
            return this;
        }
        return parseInt(this.__delay__) || 0;
    }

    /**
     * 跳转到指定祯并播放
     * @param index 播放头的位置, 从1开始
     */
    Timeline.prototype.gotoAndPlay=function( index )
    {
        if( this.__isPlaying__ )
            return false;

        var interval = Math.max(1000 / this.fps(), 20 );

        if( this.enable() )
        {
            /*return CSS3Animation.call(
                this,
                this.__frame__,
                this.__length__ * this.__interval__ / 1000,
                this.__repeats__,
                this.__reverse__,
                this.__delay__,
                this.__length__,
                index );*/
        }

        var self=this;

        //是否启用延时播放
        if( this.delay() > 0 )
        {
            var delay= this.delay();
            this.delay(0);
            setTimeout(function(){
                self.gotoAndPlay( index );
            },delay);
            return true;
        }

        index=Math.max(index-1,0);

        this.__isPlaying__=true;
        this.__paused__=false;
        this.__current__=index;

        //统计暂停总时间
        this.__pauseTimes__+=this.__pauseTime__ > 0 ? getTime()-this.__pauseTime__ : 0;
        this.__pauseTime__=0;

        var fn =  getFunByName( this.timingFunction() );
        if( !fn )
        {
            throw new Error('miss animation function');
        }

        var frame,
            repeat=this.repeat(),
            strict = this.strict(),
            reverse=this.reverse(),
            smooth = this.smooth(),
            duration=this.calculateDuration(), //此时间轴需要持续的总时间
            length= this.length(), //此时间轴的总长度包括重复的次数
            running=function(val)
            {
                if( !self.__isPlaying__ )
                {
                    self.stop();
                    return;
                }

                //当前时间
                var curtime=getTime() - self.__pauseTimes__ ;

                //当前运行时长
                var t= Math.round( curtime - self.__startTime__ );

                //平均心跳间隔
                var a= self.__counter__ > 0 ? Math.round( interval / Math.max( t-interval * self.__counter__, 1 ) ) : 0 ;

                //上一次与现在的心跳间隔
                var d=  curtime - self.__lastTime__ ;

                //运行总时长不能大于时间轴侦格长度
                if( duration-t <= interval )
                {
                    a=0;
                    t=duration;
                }

                self.__time__=t;

                //tick
                if( d >= a || smooth )
                {
                    //记录最近一次播放的时间
                    self.__lastTime__= curtime;

                    //当前已播放的侦格
                    self.__counter__++;

                    //根据播放头找到关键侦的位置
                    index = getFrameByIndex(self.__frames__ , self.__current__);

                    //定位到指定的关键侦
                    frame=self.__frames__[ index ];

                    //调用关键侦上的方法
                    if( frame )
                    {
                        self.__name__=frame.name;
                        setStyle.call(self, frame , fn );
                    }

                    //判断当前时间轴的状态
                    var finish = repeat > 0 ? (strict ? duration <= t : self.__counter__ >= length) : false;

                    //播放完成.
                    if( !frame || finish )
                    {
                        self.stop();
                        dipatcher.call(self, TimelineEvent.FINISH, {time:t} );
                        self.__counter__=0;
                    }
                    //将播放头向后移动, flag 为 false 时将播放头向前移动
                    else
                    {
                        //严格模式，根据时间定位播放头
                        if( strict )
                        {
                            var b=Math.round( t / interval ) % self.__length__ + 1 ;
                            var val= self.__flag__ ? b : self.__length__ - b -1  ;
                            self.__current__ = Math.min( Math.max( val, 0 ) , self.__length__ -1 );

                            //播放头是否到结尾
                            if( self.__counter__ % self.__length__===0 )
                            {
                                self.__current__ = self.__flag__ ? self.__length__ : -1 ;
                            }
                        }
                        //移动播放头
                        else
                        {
                            self.__flag__ ? self.__current__++ : self.__current__--;
                        }

                       var isRev = !self.__flag__  && self.__current__ < 0;

                        //播放头是否在结尾和开始的位置
                        if( ( self.__flag__ && self.__current__ >= self.__length__ ) || isRev  )
                        {
                            //需要重复的次数
                            if( repeat === -1 ||  self.__counter__ < length )
                            {
                                self.__current__= 0;

                                //倒放
                                if( reverse )
                                {
                                    isRev && dipatcher.call(self, TimelineEvent.REPEAT );
                                    self.__flag__=!self.__flag__;
                                    self.__current__=self.__flag__ ? 0 : self.__length__-1;
                                    dipatcher.call(self, TimelineEvent.REVERSE );

                                }else
                                {
                                    dipatcher.call(self, TimelineEvent.REPEAT );
                                }
                            }
                        }
                    }
                }
                self.__tid__=requestAnimationFrame( running );
            };

        //记录开始的时间
        if( this.__lastTime__ === 0 )
           this.__lastTime__ = this.__startTime__= getTime() ;

        //根据播放头的位置,计算从0到指定播放头所需要的时间增量
        if(  this.__current__ > 0 && this.__counter__=== 0 )
        {
            this.__startTime__ -= this.__current__ * interval;
            this.__lastTime__   = this.__startTime__;
        }

        //计数器初始值设置为与播放头同等
        if( this.__counter__ === 0 )
            this.__counter__=this.__current__;

        running(0);
        dipatcher.call(this, TimelineEvent.PLAY );
        return true;
    }

    /**
     * 跳转到指定祯并停止
     * @param index
     */
    Timeline.prototype.gotoAndStop=function( index )
    {
        this.__current__= Math.max(index-1,0);
        index=getFrameByIndex(this.__frames__,this.__current__);
        if( !this.__frames__[ index ] )
        {
            console.log('index invaild');
            return false;
        }
       this.stop();
       this.__name__=this.__frames__[index].name;
       this.__frames__[index].fn.call(this);
    }

    /**
     * 每秒播放多少侦
     * @returns {number|*}
     */
    Timeline.prototype.fps=function( fps )
    {
        if( typeof fps !== "undefined" )
        {
            fps = parseInt(fps);
            isNaN(fps) || (this.__fps__ = fps);
            return this;
        }
        return this.__fps__ || 50;
    }

    /**
     * 是否严格按时间来播放
     * @param val true 按时间来播放, false 按侦数来播放,默认为 true
     * @returns {Timeline|boolean}
     */
    Timeline.prototype.strict=function( val )
    {
        if( typeof val !== "undefined" )
        {
            this.__strict__= !!val;
            return this;
        }
        return !!this.__strict__;
    }

    /**
     * 当前播放到的侦
     * @returns {number}
     */
    Timeline.prototype.current=function()
    {
       return this.__current__+1;
    }

    /**
     * 获取当前侦的名称
     * @returns {*}
     */
    Timeline.prototype.currentName=function()
    {
        return this.__name__;
    }

    /**
     * 添加关键侦
     * @param object|function properties 当前侦上所需要修改的属性。如果是一个函数则会调用,并传递当前指定的缓动函数所返回的结果值。
     * @param length
     * @param name
     * @returns {Timeline}
     */

    /**
     * 添加关键侦
     * @param string from 指
     * @param to
     * @param length
     * @param properties
     * @param name
     * @returns {Timeline}
     */
    Timeline.prototype.addFrame=function(from,to,length,properties,name)
    {
        var start=this.__length__;
        this.__length__ += length ;
        name = name || this.__frames__.length;
        var frame={'name': name ,'properties':properties,'start':start,'end':this.__length__,'from':from,'to':to};
        this.__frames__.push( frame );
        dipatcher.call(this, TimelineEvent.ADD_FRAME , {'data':frame,'length':length} );
        return this;
    }

    /**
     * 清除所有的侦格
     */
    Timeline.prototype.cleanFrame=function()
    {
        this.__frames__=[];
        this.__length__=0;
    }

    /**
     * 删除关键侦或者裁剪时间轴
     * @param index  侦的名称或者播放头的位置
     * @param several 是否为关键侦,还是侦格
     * @returns {boolean}
     */
    Timeline.prototype.removeFrame=function( index , several )
    {
        index= typeof  index !== 'number' ? getFrameIndexByName(index) : index;
        index=getFrameByIndex(this.__frames__,index);
        if( index >=0 ) {
           var normal= typeof several === 'number';
           var frame= normal===true ? this.__frames__[index] : this.__frames__.splice(index,1)[0];
           if( frame )
           {
               var old=frame;
               var length=normal===true ? several : frame.end-frame.start,len=this.__frames__.length ;
               var i=index;
               while( i < len )
               {
                   frame=this.__frames__[ i ];
                   frame.start-=length;
                   frame.end-=length;
                   i++;
               }
               this.__length__ -=length;
               dipatcher.call(this, TimelineEvent.REMOVE_FRAME , {data:old,index:index,length:length,normal:normal} );
           }
           return true;
        }
        return false;
    }

    /*
     * Tween.js
     * t: current time（当前时间）
     * b: beginning value（初始值）
     * c: change in value（变化量）
     * d: duration（持续时间）
     */
    function setStyle( frame, fn )
    {
        var d = this.calculateDuration(frame.end - frame.start);
        var t = this.time();

        var targets =  this.targets();
        targets = targets instanceof Array ? targets : [targets];

        for(var i in targets )
        {
             var elem = targets[ i ];
             for( var p in frame.property )
             {
                 var c = parseFloat( frame.property[p] );
                 var b=0;

                 if( typeof frame.initValue[p] === 'undefined' )
                 {
                     frame.initValue[p]= parseFloat( elem.style[p] ) || 0;
                 }

                 b = frame.initValue[p];
                 var v= fn( t, b, c, d );
                 console.log( v  )
                 elem.style[ p ] = v;

             }
        }
    }

    function getFunByName( name )
    {
        if( typeof  name  === 'string' && typeof Tween === 'object' )
        {
            name =  name.split('.');
            var fn=Tween;
            for( var i in name ) if( fn[ name[i] ] )
            {
                fn= fn[ name[i] ];
            }
            return typeof fn === 'function' ? fn : null;
        }
        return null;
    }

    var createdAnimationStyle={};

    /**
     * 生成css3样式动画
     * @param frames 每个侦上所要改变元素的样式属性
     * @param duration 每个侦持续的时间以秒为单位
     * @param repeats 重复播放几次
     * @param reverse 是否需要倒放
     * @param delay  延迟多少秒后播放
     * @param length 总长度
     * @param index 当前侦的编号
     * @constructor
     */
    function CSS3Animation(frames, duration,repeats,reverse,delay,length,index )
    {
        var frame;
        var  css=[];
        for( var i in frames )
        {
            frame =frames[ i ];
            css.push( Math.round( frame.end / length * 100 ) + '% {');
            for( var p in frame.property )
            {
                css.push( p + ':' +  frame.property[p] + ';' );
            }
            css.push( '}' );
        }

        var stylename = 'a'+Utils.crc32( css.join('') ) ;
        if( createdAnimationStyle[ stylename ] !==true )
        {
           createdAnimationStyle[ stylename ]=true;
           var am_prefix = prefix==='' ? '' : '-'+prefix+'-';
           css.unshift('@'+am_prefix+'keyframes ' + stylename + '{');
           css.push('}');
           css.push( '.'+stylename+'{' );

           var param = {
               'name':stylename,
               'duration':duration+'s',
               'iteration-count': (repeats || 1),  //infinite
               'delay':(delay || 0)+'s',
               'fill-mode':'forwards',  //both backwards none forwards
               'direction': !!reverse ? 'alternate' : 'normal',  // alternate-reverse  reverse alternate normal
               'timing-function': this.timingFunction(),  //ease  ease-in  ease-out  cubic-bezier  linear
               'play-state':'running' //paused running
           }
           for( var p in  param )
           {
               css.push(am_prefix+'animation-'+p+':'+param[p]+';');
           }
           css.push('}');
           css = css.join("\r\n");

           var head = document.getElementsByTagName('head')[0];
           var style = document.createElement('style');
           style.setAttribute('id',stylename);
           style.innerHTML= css;
           head.appendChild( style );
        }

        for(var i in this.__elements__ )
        {
            var elem = this.__elements__[ i ];
            if( typeof Breeze !=="undefined" && elem instanceof Breeze )
            {
                elem.removeClass(stylename).addClass(stylename);
            }else
            {
                Utils.removeClass(elem,stylename);
                Utils.addClass(elem,stylename);
            }
        }
    }


    /**
     * 关键侦构造函数
     * @param from
     * @param to
     * @constructor
     */
    function Frame()
    {
        this.__from__= from
        this.__to__=to;
        this.__name__=0;
        this.__callback__=null;
    }

    Frame.prototype.constructor = Frame;
    Frame.prototype.__name__=0;
    Frame.prototype.__from__=0;
    Frame.prototype.__to__=0;
    Frame.prototype.__callback__=null;

    /**
     * 获取初始值
     * @param val
     * @returns {*}
     */
    Frame.prototype.from=function( from, to )
    {
        return this.__from__;
    }

    /**
     * 获取结束值
     * @param val
     * @returns {*}
     */
    Frame.prototype.to=function( val )
    {
        return this.__to__;
    }

    /**
     * 指定一个回调函数
     * @param function callback
     * @returns {*}
     */
    Frame.prototype.callback=function( callback )
    {
        if( typeof callback !== "undefined" )
        {
            if( typeof callback === "function" )
                this.__callback__ = callback;
            return this;
        }
        return this.__callback__;
    }

    /**
     * 设置获取关键侦名称
     * @param string name
     * @returns {*}
     */
    Frame.prototype.name=function( name )
    {
        if( typeof name !== "undefined" )
        {
            this.__name__ = name;
            return this;
        }
        return this.__name__;
    }

    window.Frame=Frame;
    window.Timeline=Timeline;

})(window)
