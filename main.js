/**
 * Created by Administrator on 2016/6/21.
 */


require(['./EventDispatcher'],function(e){

    e( document.body ).addEventListener(BreezeEvent.READY,function( event ){


        console.log( event.target, '====ok=====')

    })

});


