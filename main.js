/**
 * Created by Administrator on 2016/6/21.
 */


require(['./Breeze'],function(b){


    Breeze.ready(function(){

       Breeze('div p').width(200)
       Breeze('div p').height(200)

        console.log( Breeze('div p').parent() )


      // Breeze('div p').parent().style('backgroundColor','red')

    })


});

