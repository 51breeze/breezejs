(function(window, undefined )
{
    'use strict';

    var Animation={};
    Animation.fadeIn=function(element, duration, options )
    {
        options = options || {};
        options.duration = (parseFloat(duration) || 1);
        if( Utils.isAnimationSupport() )
        {
            options.duration = (parseFloat(duration) || 1)+'s';
            Utils.CSS3Animation( element, {'0%':'opacity:0;','100%':'opacity:1;'} ,options );

        }else
        {
            Timeline().timing(Tween.Linear).addKeyFrame(new KeyFrame(options.duration * 60).motions(function(t,d,f){
                var value = f(t,0,1,d);
                Utils.style(element,'opacity',value);
            }));
        }
    }
    Animation.fadeOut=function(element, duration, options )
    {
        options = options || {};
        options.duration = (parseFloat(duration) || 1);
        if( Utils.isAnimationSupport() )
        {
            options.duration = (parseFloat(duration) || 1)+'s';
            Utils.CSS3Animation( element, {'0%':'opacity:1;','100%':'opacity:0;'} ,options );

        }else
        {
            Timeline().timing(Tween.Linear).addKeyFrame(new KeyFrame(options.duration * 60).motions(function(t,d,f){
                var value = f(t,1,-1,d);
                Utils.style(element,'opacity',value);
            })).play();
        }
    }

    window.Animation=Animation;

})(window)