(function(window, undefined )
{
    'use strict';





    function Animation( target )
    {
        this.target=  target;
        Timeline.call(this, true );
    };

    Animation.prototye= new Timeline();

    Animation.prototye.fadeIn=function( duration , tween )
    {
        tween = tween || Tween.Linear;
        this.addKeyFrame(function(){

        },duration);
    }

    window.Animation=Animation;

})(window)