
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

     var prefix=Utils.fix().cssPrefixName.replace(/-/g,''),
         now= window.performance ? window.performance.now || window.performance[ prefix+'Now' ] || null : null,
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
    function getFrameIndexByName( frames, name )
    {
        for( var index in frames ) if(  frames[ index ].name()===name )
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
            for( var i in frames ) if( frames[ i ].start() <= index && frames[ i ].end() >= index )
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

    function Timeline()
    {
        if( !(this instanceof Timeline ) )
          return new Timeline();

        this.__fps__= 60 ;
        this.__length__=0;
        this.__frames__=[];
        this.__current__=0;
        this.__repeats__=1;
        this.__reverse__=false;
        this.__tid__=null;
        this.__strict__=false;
        this.__pauseTime__=0;
        this.__pauseTimes__=0;
        this.__paused__=false;
        this.__time__=0;
        this.__startTime__=0;
        this.__lastTime__=0;
        this.__counter__=0;
        this.__positive__=true; //播放头是处于正序播放还是倒序播放的状态
        this.__delay__=0;
        EventDispatcher.call(this);
    }

    Timeline.prototype=new EventDispatcher();
    Timeline.prototype.constructor=Timeline;

    /**
     * 重复播放多少次-1为无限循环播放
     * @param number
     * @returns {Timeline}
     */
    Timeline.prototype.repeats=function( num )
    {
        if( typeof num !== "undefined" )
        {
            num= parseInt(num) || 1;
            isNaN(num) || (this.__repeats__=num);
            return this;
        }
        return this.__repeats__ || 1;
    }

    /**
     * 动画函数
     * @returns {function}
     */
    Timeline.prototype.timing=function( timing )
    {
        var type = typeof timing;
        if( type !== "undefined" )
        {
            if( type !=='function' )throw new Error('invalid timing')
            this.__timing__= timing ;
            return this;
        }
        return this.__timing__ || null;
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
     * 播放头是处于正序播放还是倒序播放的状态
     * @returns {boolean}
     */
    Timeline.prototype.positive=function()
    {
        return !!this.__positive__;
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
     * @pirvate
     * 初始状态
     */
    var initState = function()
    {
        this.__paused__=false;
        this.__isPlaying__=false;
        this.__time__=0;
        this.__lastTime__=0;
        this.__startTime__=0;
        this.__pauseTime__=0;
        this.__counter__=0;
        this.__current__ = 0;
        this.__delay__=0;
        this.__positive__ = true;
    }

    //private
    var cancel = function()
    {
        if( this.__tid__ !==null ){
            cancelAnimationFrame( this.__tid__ );
            this.__tid__=null;
        }
    }

    /**
     * 停止播放时间轴
     * @returns {Timeline}
     */
    Timeline.prototype.stop=function()
    {
        cancel.call(this);
        initState.call(this);
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
            cancel.call(this);
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
     * 获取心跳间隔
     * @returns {number}
     */
    Timeline.prototype.interval=function()
    {
       return Math.max(1000 / this.fps(), 16.7 );
    }

    /**
     * 获取当前动画需要持续的总时长,以毫秒为单位。
     * @returns {number}
     */
    Timeline.prototype.duration=function( length )
    {
        return Math.round( ( length >=0 ? length : this.__length__ ) * this.interval() );
    }

    /**
     * 根据侦格索引返回当前时间。以毫秒为单位。
     * @returns {number}
     */
    Timeline.prototype.timeByIndex=function( index )
    {
        return Math.round( index * this.interval() );
    }

    /**
     * 时间轴侦格的总长度。
     * @return number
     */
    Timeline.prototype.length=function()
    {
        return this.__length__;
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

        index = parseInt(index) || 0;
        if( index > this.__length__ )
        {
            throw new Error('Then index out range')
        }

        var interval = this.interval();
        var keyframes = this.getKeyFrame();
        var self=this;
        var delay = this.delay();

        //是否启用延时播放
        if( delay > 0 )
        {
            this.delay(0);
            setTimeout(function(){
                self.gotoAndPlay( index );
            },delay);
            return true;
        }

        this.__isPlaying__=true;
        this.__paused__=false;
        this.__current__=index;
        this.__counter__=index;

        //统计暂停总时间
        this.__pauseTimes__+=this.__pauseTime__ > 0 ? getTime()-this.__pauseTime__ : 0;
        this.__pauseTime__=0;

        var frame,
            repeat=this.repeats(),
            strict = this.strict(),
            reverse=this.reverse(),
            duration=reverse ? this.duration() * 2 : this.duration() , //此时间轴需要持续的总时间包括倒放时间
            length= reverse? this.length()*2 :  this.length() , //此时间轴的总长度包括倒放
            lastIndex = -1,
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

                //根据整个时间轴的播放速率来控制心跳间隔时长
                var a=Math.round( ( duration - t ) / ( length - self.__counter__ ) ) ;

                //上一次与现在的心跳间隔
                var d=  Math.round(curtime - self.__lastTime__);

                //运行总时长不能大于时间轴侦格长度
                if( duration-t <= interval )
                {
                    a=0;
                    t=duration;
                }

                self.__time__=t;

                //tick
                if( d >= a )
                {
                    //记录最近一次播放的时间
                    self.__lastTime__= curtime;

                    //根据播放头找到关键侦的位置
                    index = self.__current__ != lastIndex ? getFrameByIndex( keyframes, self.__current__ ) : -1;
                    lastIndex=  self.__current__;

                    //定位到指定的关键侦
                    frame= index >=0 ?  self.__frames__[ index ] : null;

                    //调用关键侦上的方法
                    if( frame  )
                    {
                        frame.action();
                    }

                    //判断播放头是否达到结尾状态
                    var finish = strict ? duration <= t : self.__counter__ >= length;

                    //播放完成.
                    if( finish && repeat > 0 )
                    {
                        initState.call(self);
                        if( repeat > 1 )
                        {
                            self.__repeats__ = repeat -1;
                            dipatcher.call(self, TimelineEvent.REPEAT );
                            return self.gotoAndPlay( index );
                        }

                        cancel.call(self);
                        dipatcher.call(self, TimelineEvent.FINISH );
                    }
                    else
                    {
                        //严格模式，根据时间定位播放头
                        if( strict )
                        {
                            var b=Math.round( t / interval );
                            self.__current__ = self.__positive__ ? b : self.__length__ - ( b % self.__length__ ) ;
                        }
                        //移动播放头
                        else
                        {
                            self.__positive__ ? self.__current__++ : self.__current__--;
                        }

                        //改变播放头方向
                        if( reverse && self.__positive__ && self.__current__ >= self.__length__ )
                        {
                            self.__positive__ = !self.__positive__;
                            self.__current__  = self.__length__;
                        }
                    }
                    self.__counter__++;
                }
                self.__tid__=requestAnimationFrame( running );
            };

        //记录开始的时间
        if( this.__lastTime__ === 0 )
           this.__lastTime__ = this.__startTime__= getTime() ;

        //根据播放头的位置,计算从0到指定播放头所需要的时间增量
        if(  this.__current__ > 0 )
        {
            this.__startTime__ -= this.__current__ * interval;
            this.__lastTime__  -= (this.__current__-1) * interval;
        }

        running(0);
        return true;
    }

    /**
     * 跳转到指定祯并停止
     * @param index
     */
    Timeline.prototype.gotoAndStop=function( index )
    {
        index = parseInt(index) || 0;
        if( index > this.__length__ )
        {
            throw new Error('Then index out range')
        }
        this.stop();
        this.__current__ = index;
        var frame = this.getKeyFrame(index);
        if( frame )
        {
            frame.action();
            return true;
        }
        return false;
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
        return this.__fps__ || 60;
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
       return this.__current__;
    }

    /**
     * 添加关键侦
     * @param KeyFrame keyframe 关键侦对象
     * @param length 持续侦格的长度
     * @returns {Timeline}
     */
    Timeline.prototype.addKeyFrame=function( keyframe )
    {
        if( !(keyframe instanceof KeyFrame) )
        {
            throw new Error('invalid frame. The frame must be is Frame instance');
        }

        if( !keyframe.name() )
        {
            keyframe.name( this.__frames__.length )
        }

        var len =  this.__frames__.length;
        if( len > 0 )
        {
            var prevKeyFrame = this.__frames__[ len-1 ];
            keyframe.__prevKeyFrame__= prevKeyFrame;
            prevKeyFrame.__nextKeyFrame__= keyframe;
        }
        keyframe.__timeline__ = this;
        keyframe.__start__ = this.__length__;
        this.__length__ += keyframe.length();
        keyframe.__end__ = this.__length__-1;
        this.__frames__.push( keyframe );
        return this;
    }

    /**
     * 根据名称或者索引获取关键侦
     * @param number|string name 名称或者索引
     * @returns {*}
     */
    Timeline.prototype.getKeyFrame=function(name)
    {
        if( typeof name === "string" )
        {
            var index =  getFrameIndexByName(this.__frames__, name );
            return  this.__frames__[index] || null;

        }else if( typeof name === "number"  )
        {
            var index =  getFrameByIndex(this.__frames__, name );
            return  this.__frames__[index] || null;
        }
        return this.__frames__;
    }

    /**
     * 删除关键侦或者裁剪时间轴
     * @param number|string index  关键侦的名称或者索引
     * @param number frameLength 要删除的侦格长度。如果不传则删除指定索引下的整个关键侦。
     * @returns {boolean}
     */
    Timeline.prototype.removeKeyFrame=function( index , frameLength )
    {
        index= typeof  index !== 'number' ? getFrameIndexByName(this.__frames__,index) : getFrameByIndex(this.__frames__,index);
        if( index >=0 ) {

            var frame, len=this.__frames__.length;
            if( typeof frameLength === 'number' )
            {
                frame = this.__frames__[index];
                if( frameLength < 0 )
                {
                    frameLength+=frame.length();
                }
                frameLength = Math.min( frameLength , frame.length()- 1 );

            }else
            {
                frame=this.__frames__.splice(index,1)[0];
                frameLength = frame.length();
            }

            if( frameLength > 0 )
            {
                var old = frame;
                while (index < len) {
                    frame = this.__frames__[index];
                    if (frame) {
                        frame.__start__ -= frameLength;
                        frame.__end__ -= frameLength;
                    }
                    index++;
                }
                this.__length__ -= frameLength;
                dipatcher.call(this, TimelineEvent.REMOVE_FRAME, {keyframe: frame, index: index, length: frameLength});
                return true;
            }
        }
        return false;
    }

    /**
     * 关键侦构造函数
     * @param length
     * @constructor
     */
    function KeyFrame( length )
    {
        if( !(this instanceof  KeyFrame) )
           return new KeyFrame(length);
        this.__motions__=[];
        this.length( length );
    }

    KeyFrame.prototype.constructor = KeyFrame;
    KeyFrame.prototype.__name__=0;
    KeyFrame.prototype.__lenght__=1;
    KeyFrame.prototype.__start__=0;
    KeyFrame.prototype.__end__=0;
    KeyFrame.prototype.__timeline__=null;
    KeyFrame.prototype.__motions__=[];
    KeyFrame.prototype.__prevKeyFrame__=null;
    KeyFrame.prototype.__nextKeyFrame__=null;


    /**
     * 紧邻的上一个关键侦
     * @read-only
     * @returns {KeyFrame}
     */
    KeyFrame.prototype.prevKeyFrame=function()
    {
        return this.__prevKeyFrame__;
    }

    /**
     * 紧邻的下一个关键侦
     * @read-only
     * @returns {KeyFrame}
     */
    KeyFrame.prototype.nextKeyFrame=function()
    {
        return this.__nextKeyFrame__;
    }

    /**
     * 获取时间轴对象
     * @read-only
     * @returns {Timeline}
     */
    KeyFrame.prototype.timeline=function()
    {
        if( !(this.__timeline__ instanceof Timeline) )
        {
            throw new Error('timeline instance is empty');
        }
        return this.__timeline__;
    }

    /**
     * 当前关键需要播放的总时长
     * @read-only
     * @returns {number}
     */
    KeyFrame.prototype.timeByIndex=function()
    {
        return this.timeline().timeByIndex( this.timeline().current() - this.start() );
    }

    /**
     * 动作入口
     * @read-only
     * @returns {null|NodeElement}
     */
    KeyFrame.prototype.action=function()
    {
           var motion,motions = this.motions();
           var len = motions.length,index=0;
           var d = this.timeline().duration( this.length() );
           var t = this.timeByIndex();
           var timing = this.timeline().timing();

           for( ;index< len ; index++ )
           {
               motion = motions[index];
               if( motion instanceof Motions )
               {
                   var properties = motion.get();
                   var target = motion.getEventTarget();
                   var i= 0, l= properties.length;
                   for( ; i<l; i++ )
                   {
                        var property = properties[i];
                        var to = property.to;
                        var from  = property.from;
                        var value =timing ? Math.round( timing(t,from, to-from, d) ) : NaN;
                        if( !motion.isNodeElement )
                        {
                           target.call( this, value);
                        }else
                        {
                            property.flag ? property.property.call(target, value) : Utils.style(target, property.property, value);
                        }
                   }

               }else if( typeof motion === "function" )
               {
                   motion.call(this,t,d,timing);
               }
           }
    }


    /**
     * 关键侦在侦格上的开始位置
     * @read-only
     * @returns {number}
     */
    KeyFrame.prototype.start=function()
    {
        return this.__start__;
    }

    /**
     * 关键侦在侦格上的结束位置
     * @read-only
     * @returns {number}
     */
    KeyFrame.prototype.end=function()
    {
        return this.__end__;
    }

    /**
     * 关键侦在侦格上持续的长度
     * @param length
     * @returns {*}
     * @public
     */
    KeyFrame.prototype.length=function( length )
    {
         if( typeof length !==  "undefined" )
         {
             length = parseInt( length );
             if( isNaN(length) || length < 1 )throw new Error('invalid length. The keyframe lenght must be greater than 0');
             this.__lenght__ = length;
             return this;
         }
         return this.__lenght__;
    }

    /**
     * 设置获取运动属性对象
     * @param Motions motions 目标运动属性对象
     * @returns {Array|KeyFrame}
     * @public
     */
    KeyFrame.prototype.motions=function( motions )
    {
        if( typeof motions !== "undefined" )
        {
            if( !(motions instanceof Motions) && typeof motions !== "function" )
                throw new Error('invalid motionProperties');
            this.__motions__.push(motions);
            return this;
        }
        return this.__motions__;
    }

    /**
     * 设置获取关键侦名称
     * @public
     * @param string name
     * @returns {*}
     */
    KeyFrame.prototype.name=function( name )
    {
        if( typeof name !== "undefined" )
        {
            this.__name__ = name;
            return this;
        }
        return this.__name__;
    }

    /**
     * 目标运动属性对象
     * @param nodeElement|function target 需要运动的目标元素
     * @constructor
     */
    function Motions( target )
    {
        if( !(this instanceof  Motions) )
          return new Motions(target);
        this.isNodeElement=Utils.isNodeElement(target);
        if( !this.isNodeElement && typeof target !== "function" )
        {
            throw new Error('invalid target');
        }
        this.__target__=target;
        this.__properties__=[];
    }

    Motions.prototype.constructor=Motions;
    Motions.prototype.__target__=null;
    Motions.prototype.__properties__=[];

    /**
     * 运动目标对象
     * @read-only
     * @returns {null|NodeElement}
     */
    Motions.prototype.getEventTarget=function()
    {
        return this.__target__;
    }

    /**
     * 设置运动属性方位
     * @param string|function property  属性名称
     * @param number from  开始点
     * @param number to  结束点
     * @returns {Motions}
     */
    Motions.prototype.set=function(property,from,to)
    {
        var type =  typeof property;
        if( type !== "string" && type !== "function" )
           throw new Error('invalid property');

        from =  parseFloat( from );
        to =  parseFloat( to );
        if( isNaN(from)  )throw new Error('The from type must be is number');
        if( isNaN(to)  )throw new Error('The to type must be is number');
        this.__properties__.push( {'property':property,'from': from, 'to': to, flag: type === "function" } );
        return this;
    }

    /**
     * 获取运动属性
     * @param string|function property 属性名称
     * @returns {*}
     */
    Motions.prototype.get=function( property )
    {
        if( typeof property === "undefined" )
          return this.__properties__;

        var len = this.__properties__.length;
        var index = 0;
        for(; index < len; index++ )if( this.__properties__[index].property === property )
        {
            return this.__properties__[index];
        }
        return null;
    }

    window.Motions=Motions;
    window.KeyFrame=KeyFrame;
    window.Timeline=Timeline;

})(window)
