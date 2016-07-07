/**
 * Created by Administrator on 2016/6/21.
 */

require.config({

    paths : {
        'breezeEvent':'./events/BreezeEvent'
        ,'propertyEvent':'./events/PropertyEvent'
        ,'styleEvent':'./events/StyleEvent'
        ,'elementEvent':'./events/ElementEvent'
        ,'mouseEvent':'./events/MouseEvent'
        ,'scrollEvent':'./events/ScrollEvent'
        ,'touchEvent':'./events/TouchEvent'
        ,'eventDispatcher':'EventDispatcher'
        ,'dataArray':'DataArray'
        ,'breeze':'Breeze'
    },
    shim: {
        'propertyEvent': ['breezeEvent'],
        'elementEvent': ['breezeEvent'],
        'mouseEvent': ['breezeEvent'],
        'touchEvent': ['breezeEvent'],
        'scrollEvent': ['propertyEvent'],
        'styleEvent': ['propertyEvent'],
        'eventDispatcher': ['breezeEvent'],
        'breeze': ['eventDispatcher','dataArray','mouseEvent','scrollEvent','elementEvent','styleEvent','propertyEvent']
    }
});



require(['breeze'],function(){

   Breeze.ready(function(){


       require(['./components/Component'],function(){

           require(['./components/SkinComponent','./components/SkinGroup'],function(){

               require(['./components/Modality'],function(){


                    Modality(document.body).show()

               })
           })
       })



    })


});

