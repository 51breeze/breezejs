/**
 * Created by Administrator on 2016/6/21.
 */


require(['./Breeze'],function(Breeze){


    Breeze.ready(function(){


       Breeze('div p').width(200)
       Breeze('div p').height(200)

        Breeze('div').addEventListener(MouseEvent.CLICK,function(event){

            console.log( event )


        })

       /* document.addEventListener(MouseEvent.CLICK,function(event){

            console.log( event,'=====div=====' )


        })*/


      // Breeze('div p').parent().style('backgroundColor','red')

    })


});

