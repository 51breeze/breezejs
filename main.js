/**
 * Created by Administrator on 2016/6/21.
 */


require(['./EventDispatcher','./events/MouseEvent'],function(e){

    e( document ).addEventListener(BreezeEvent.READY,function( event ){

        console.log( event ,'====ok=====')

    })

    document.addEventListener('readystatechange',function(){

        console.log( document.readyState , '=====')

    })

    e( document ).addEventListener('click',function(ev){
            console.log( ev)
        })



});


