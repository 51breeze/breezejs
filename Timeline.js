
/********************************************************
 @class : 时间轴模拟类。
          这个时间轴实现了添加关键侦和跳转到指定的侦进行播放或者停止动作。
          实现了重复播放多少次或者倒放的功能，时间轴的播放时长是由每个添加的关键侦所决定的。
 @param: fps 播放速率,按每秒来计算,默认为24侦每秒
 @example
var tl= new Timeline(24).addFrame(function(){
        console.log( this.current() +'>>'+this.__name__ )
    },3,'one').reverse( true ).addFrame(function(){
        console.log( this.current() +'>>'+this.__name__ )
    },21,'two')
    tl.play();
**********************************************************/

(function(window,undefined)
{
    'use strict';

     var lastTime = 0,
         requestAnimationFrame=window.requestAnimationFrame,
         cancelAnimationFrame=window.cancelAnimationFrame,
         vendors = ['webkit','moz','o','ms'],
         now = window.performance && (performance.now || performance.mozNow || performance.msNow ||
                                      performance.oNow || performance.webkitNow);
     function getTime()
     {
        return ( ( now && now.call( performance ) ) || ( new Date().getTime() ) );
     };

     for( var x = 0; x < vendors.length && !requestAnimationFrame ; x++ )
     {
         requestAnimationFrame = window[ vendors[x] + 'RequestAnimationFrame'] ;
         cancelAnimationFrame  = window[ vendors[x] + 'CancelAnimationFrame'] || window[ vendors[x] + 'CancelRequestAnimationFrame'];
     }

     if( !requestAnimationFrame )
     {
         requestAnimationFrame = function(callback)
         {
             var currTime = getTime();
             var interval = Math.max(0, 16.7 - (currTime - lastTime));
             var id = window.setTimeout(callback, interval);
             lastTime = currTime + interval;
             return id;
         };
     }

    if ( !cancelAnimationFrame )
    {
         cancelAnimationFrame = function(id)
         {
             window.clearTimeout(id);
         };
    }

    function Timeline( fps )
    {
        this.__fps__=( parseFloat(fps) || 24 );
        this.__interval__=  1000 / this.__fps__;
        this.__length__=0;
        this.__frame__=[];
        this.__current__=0;
        this.__repeats__=0;
        this.__repeat_count__=0;
        this.__reverse__=false;
        this.__tid__=null;
        this.__strict__=true;
        EventDispatcher.call(this);
    }

    Timeline.prototype=new EventDispatcher();
    Timeline.prototype.constructor=Timeline;

    function TimelineEvent(src, props){BreezeEvent.call(this,src,props);}
    TimelineEvent.prototype=new BreezeEvent();
    TimelineEvent.prototype.constructor=TimelineEvent;
    TimelineEvent.PLAY='play';
    TimelineEvent.STOP='stop';
    TimelineEvent.FINISH='finish';
    TimelineEvent.BEFORE_REPEAT='beforeRepeat';
    TimelineEvent.AFTER_REPEAT='afterRepeat';
    TimelineEvent.BEFORE_REVERSE='beforeReverse';
    TimelineEvent.ADD_FRAME='addframe';
    TimelineEvent.REMOVE_FRAME='removeframe';
    window.TimelineEvent=TimelineEvent;

    /**
     * 重复播放多少次-1为无限循环播放
     * @param num
     * @returns {Timeline}
     */
    Timeline.prototype.repeat=function(num)
    {
        this.__repeats__=  Math.max(parseInt(num) || 0, this.__reverse__ ? 1 : 0);
        return this;
    }

    /**
     * 开始播放时间轴
     * @returns {Timeline}
     */
    Timeline.prototype.play=function()
    {
        this.gotoAndPlay( this.__current__ );
        return this;
    }

    /**
     * 停止播放时间轴
     * @returns {Timeline}
     */
    Timeline.prototype.stop=function()
    {
        this.gotoAndStop( this.__current__ );
        return this;
    }


    /**
     * 跳转到指定祯并播放
     * @param index
     */
    Timeline.prototype.gotoAndPlay=function( index )
    {
        if( this.__played__ )
           return false;
        this.__played__=true;

        index = index || 0;
        this.__current__=index;
        index=getFrameByIndex.call(this,index);
        if( !this.__frame__[ index ] )
        {
            console.log('index invaild');
            return false;
        }

        var frame,
            n=Math.max(this.__repeats__* 2,1),
            duration= this.__length__*n * this.__interval__,
            self=this,
            counter= 0,
            flag=true,
            running=function()
            {
                var curtime=getTime();
                var t=curtime - self.__startTime__;
                var u=Math.max( duration - t ,0 );
                var s= self.__length__*n - counter
                var a= s > 0 && self.__repeats__!== -1 && self.__strict__ ?  u / s : self.__interval__*0.95
                var d=  curtime - self.__lastTime__

                if( d >= a || self.__lastTime__=== 0 )
                {
                    //console.log( u,s,a,d, duration)
                    self.__lastTime__= curtime;

                    //播放头是否在结尾和开始的位置
                    if( self.__current__ >= self.__length__ || ( self.__current__<0 && !flag ) )
                    {
                        !self.__reverse__ && flag && self.__repeat_count__++;

                        //需要重复的次数
                        if( self.__repeats__=== -1 || self.__repeats__ > self.__repeat_count__ )
                        {
                            self.__reverse__ && flag && self.__repeat_count__++;

                            dipatcher.call(self, TimelineEvent.BEFORE_REPEAT );

                            //倒放
                            if( self.__reverse__ )
                            {
                                flag=!flag;
                                index=flag ? 0 : Math.max(self.__frame__.length-1,0);
                                self.__current__=flag ? 0 : self.__length__-1;
                                dipatcher.call(self, TimelineEvent.BEFORE_REVERSE );

                            }else
                            {
                                self.__current__=0;
                                index=0;
                                dipatcher.call(self, TimelineEvent.PLAY );
                            }
                        }
                    }

                    //定位到指定的关键侦
                    frame=self.__frame__[ index ];
                    while( frame && !( frame.start <= self.__current__ && frame.end > self.__current__ ) )
                    {
                        flag ?  index++ : index-- ;
                        frame=self.__frame__[ index ];
                    }

                    //调用关键侦上的方法
                    var has= self.__strict__ ?  Math.round( self.__current__ * self.__interval__ ) <= duration : s > 0
                    if( frame && has )
                    {
                        self.__name__=frame.name;
                        frame.fn.call(self);
                    }
                    //播放完成，停止关键侦播放
                    else
                    {
                        self.__played__=false;
                        cancelAnimationFrame( self.__tid__ );
                        self.__tid__=null;
                        dipatcher.call(self, TimelineEvent.FINISH,{time:Math.round(self.__lastTime__-self.__startTime__)} );
                        return;
                    }
                    counter++;

                    //当前播放的侦
                    flag ? self.__current__++ : self.__current__--;
                }
                self.__tid__=requestAnimationFrame( running );
            };
        this.__startTime__=getTime();
        this.__lastTime__=0;
        running();
        return true;
    }

    /**
     * 跳转到指定祯并停止
     * @param index
     */
    Timeline.prototype.gotoAndStop=function( index )
    {
        index = index || 0;
        this.__current__=index;
        index=getFrameByIndex.call(this,index);
        if( !this.__frame__[ index ] )
        {
            console.log('index invaild');
            return false;
        }
       this.__name__=this.__frame__[index].name;
       this.__frame__[index].fn.call(this);
       if( this.__tid__ !==null ){
           cancelAnimationFrame( this.__tid__ );
           this.__tid__=null;
       }
       this.__played__=false;
       dipatcher.call(this, TimelineEvent.STOP );
    }

    /**
     * 每秒播放多少侦
     * @returns {number|*}
     */
    Timeline.prototype.fps=function()
    {
       return this.__fps__;
    }

    /**
     * 当播放头到达结尾时是否需要倒转播放
     * @param val
     * @returns {Timeline}
     */
    Timeline.prototype.reverse=function( val )
    {
        this.__reverse__=!!val;
        if( this.__reverse__ && this.__repeats__===0 )
        {
            this.repeat(1);
        }
        return this;
    }

    /**
     * 是否严格按时间来播放
     * @param val true 按时间来播放, false 按侦数来播放,默认为 true
     * @returns {Timeline}
     */
    Timeline.prototype.strict=function( val )
    {
       this.__strict__= !!val;
       return this;
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
     * 添加关键侦
     * @param fn
     * @param duration
     * @param name
     * @returns {Timeline}
     */
    Timeline.prototype.addFrame=function(fn,duration,name)
    {
        var start=this.__length__;
        this.__length__ += ( duration || 1 );
        var frame={'name': name || this.__frame__.length ,'fn':fn,start:start,end:this.__length__};
        this.__frame__.push( frame );
        dipatcher.call(this, TimelineEvent.ADD_FRAME , {data:frame,duration:duration} );
        return this;
    }

    /**
     * 删除关键侦或者裁剪时间轴
     * @param index
     * @param several
     * @returns {boolean}
     */
    Timeline.prototype.removeFrame=function( index , several )
    {
        index= typeof  index !== 'number' ? getFrameIndexByName(index) : index;
        index=getFrameByIndex.call(this,index);
        if( index >=0 ) {
           var normal= typeof several === 'number';
           var frame= normal===true ? this.__frame__[index] : this.__frame__.splice(index,1)[0];
           if( frame )
           {
               var old=frame;
               var length=normal===true ? several : frame.end-frame.start,len=this.__frame__.length ;
               var i=index;
               while( i < len )
               {
                   frame=this.__frame__[ i ];
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

    function dipatcher( type , data )
    {
        if( this.hasEventListener(type) )
        {
            var event= new TimelineEvent( type, data );
            this.dispatchEvent( event );
        }
    }

    function getFrameIndexByName( name )
    {
       for( var index in __frame__) if(  __frame__[ index ].name===name )
       {
          return index;
       }
       return -1;
    }

    function getFrameByIndex( index )
    {
        if( index !== 0 )
        {
            for( var i in this.__frame__ ) if( this.__frame__[ i ].start <= index && this.__frame__[ i ].end > index )
            {
                index=i;
                break;
            }
        }
        return index;
    }
    window.Timeline=Timeline;

})(window)
