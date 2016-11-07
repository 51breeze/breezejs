(function(_object){

    var Object = function(){};


   // Object.prototype=_object.create(_object.prototype)


    Object.prototype.valueOf=function()
    {
        return {};
    }

    Object.prototype.ccc=function(){}



    //Object.prototype.create=c;

    console.log( new Object()  )

})(Object,Array,Number,RegExp,Boolean);



