/**
 * Created by Administrator on 2016/6/21.
 */

require.config({

    shim:{}

})

require(['./Breeze' ],function(Breeze){


   /* require(['./components/Component', './components/Layout'],function(){

        Layout( Breeze('#layout') ).percentWidth(50).percentHeight(30).updateDisplayList()


    })*/


    Breeze.ready(function(){



       Breeze('div p').width(200).height('+=30').style('backgroundColor','#ccc')



        Breeze('div')
            .addChild('<div class="a"> insert div 1</div>')
            .addChild('<div class="a"> insert div 2</div>')

        //console.log( Breeze('div > p > div').length )

      Breeze('div > div').wrap('<p style="border-bottom: solid 1px #59d6ff" />')

        var i=1;
        Breeze('div.a').parent().forEach(function(){

            this.property('name', i++ )

        })


        Breeze('div.a').unwrap('p')


        Breeze('div > div').html('<h1>222222</h1>')


        Breeze('div').hide().show()


        Breeze('div').addEventListener(MouseEvent.CLICK,function(event){

            console.log( event )

        })


    })


});

