(function(window, undefined )
{
    'use strict';

    function Animation() {}

    /**
     *@private
     */
    var createTimeline=function( options )
    {
        options.duration = (parseFloat(options.duration) || 1);
        options.timing =  options.timing || Tween.Linear;
        options.state = !options.state;
        var tl =Timeline();
        for( var prop in options ) if( tl[prop] && typeof tl[prop] === "function" )
        {
            tl[prop]( options[prop] );
        }
        if( options.callback && typeof options.callback === "function" )
        {
            tl.addEventListener( TimelineEvent.FINISH , options.callback );
        }
        return tl;
    }


    /**
     *@private
     */
    function fade(name, duration, options)
    {
        options = options || {};
        options.duration = (parseFloat(duration) || 1);
        if( Utils.isAnimationSupport() && options.engine !=='timeline'  )
        {
            options.duration = (parseFloat(duration) || 1) + 's';
            var properties = null;
            switch (name)
            {
                case 'fadeIn'  :
                    properties = {'0%': 'opacity:0;', '100%': 'opacity:1;'};
                    break;
                case 'fadeOut' :
                    properties = {'0%': 'opacity:1;', '100%': 'opacity:0;'};
                    break;
            }
            var stylename = Utils.CSS3Animation(properties, options);

            if( options.callback && typeof options.callback === "function" )
            {
                var prefix =Utils.getBrowserPrefix().replace(/-/g,'');
                var end = Utils.lcfirst( prefix+'AnimationEnd' );
                var iteration = Utils.lcfirst( prefix+'AnimationIteration' );
                EventDispatcher(this).addEventListener([end,iteration],function(event){
                    options.callback.call(this, event.type === end );
                    this.removeEventListener(end);
                    this.removeEventListener(iteration);
                });
            }
            Utils.removeClass(this, stylename);
            Utils.addClass(this, stylename);
            return stylename;

        }else
        {
            var element = this;
            var tl = createTimeline( options );
            tl.addKeyFrame(KeyFrame(options.duration * 60).motions(function(t,d,f){
                var value = name === 'fadeOut' ? f(t,1,-1,d) : f(t,0,1,d);
                Utils.style(element,'opacity',value);
            }))
            if( options.state )tl.play();
            return tl;
        }
    }

    /**
     * 调整元素到指定的大小
     * @param NodeElement element 节点元素
     * @param number duration 持续的时间,秒为单位
     * @param object options 动画选项参数
     */
    Animation.fadeIn=function(element, duration, options )
    {
       return fade.call(element,'fadeIn',duration, options);
    }

    /**
     * 调整元素到指定的大小
     * @param NodeElement element 节点元素
     * @param number duration 持续的时间,秒为单位
     * @param object options 动画选项参数
     */
    Animation.fadeOut=function(element, duration, options )
    {
        return fade.call(element,'fadeOut',duration, options);
    }

    /**
     * 调整元素到指定的大小
     * @param NodeElement element 节点元素
     * @param number duration 持续的时间,秒为单位
     * @param object options 动画选项参数
     */
    Animation.resizeTo=function(element, duration, options )
    {
        options = options || {};
        options.duration = duration;

        var tl =createTimeline(options);
        var width = Utils.getSize(element,'width');
        var height =  Utils.getSize(element,'height');
        var motion = new Motions( element )

        if( typeof options.width === "number")motion.set('width', width, options.width )
        if( typeof options.height === "number")motion.set('height', height, options.height );

        if( options.point > 1  )
        {
            var position = Utils.style(element,'position');
            var propX = 'left';
            var propY = 'top';
            if (position === 'static' || position === '')
            {
                propX = 'marginLeft';
                propY = 'marginTop';
            }

            var fromX = parseInt(Utils.style(element, propX)) || 0;
            var fromY = parseInt(Utils.style(element, propY)) || 0;
            var toX = 0;
            var toY = 0;

            switch( parseInt(options.point) )
            {
                case 2 : toX = 1; break;
                case 3 : toY = 1; break;
                case 4 : toY = 1; toX = 1; break;
                case 5 : toY = 0.5;toX = 0.5;break;
            }
            if( toX > 0 )motion.set(propX, fromX, fromX-(options.width - width) * toX );
            if( toY > 0 )motion.set(propY, fromY, fromY-(options.height - height) * toY );
        }
        tl.addKeyFrame( KeyFrame(options.duration * 60).motions(motion) );
        if( options.state )tl.play();
        return tl;
    }


    /**
     * 移动元素到指定的位置
     * @param NodeElement element 节点元素
     * @param number duration 持续的时间,秒为单位
     * @param object options 动画选项参数
     */
    Animation.moveTo=function(element, duration, options )
    {
        options = options || {};
        options.duration = duration;

        var tl =createTimeline(options);
        var position = Utils.position(element);
        var motion = new Motions( element )

        if( typeof options.x === "number" )motion.set('left', position.left, options.x )
        if( typeof options.y === "number" )motion.set('top', position.top, options.y );
        tl.addKeyFrame( KeyFrame(options.duration * 60).motions(motion) );
        if( options.state )tl.play();
        return tl;
    }

    /**
     * 抖动元素
     * @param NodeElement element 节点元素
     * @param number duration 持续的时间,秒为单位
     * @param object options 动画选项参数
     */
    Animation.shake=function(element, duration, options )
    {
        options = options || {};
        options.duration = duration || 0.2;
        options.fps = options.fps || 30;
        var tl =createTimeline(options);
        var position = Utils.position(element);
        var size = options.size || 4;
        var keyframe = KeyFrame( options.duration * 60 )

        keyframe.action=function(){

            var i = tl.current();
            if( i >= tl.length()-1 )
            {
                Utils.style(element,'left', position.left);
                Utils.style(element,'top', position.top);
            }else {
                var prop = i % 2 == 0 ? 'left' : 'top';
                var val = position[prop];
                Utils.style(element,prop,i % 4 < 2 ?val: val + size);
            }
        }

        tl.addKeyFrame( keyframe  );
        if( options.state )tl.play();
        return tl;
    }

    window.Animation=Animation;

})(window)