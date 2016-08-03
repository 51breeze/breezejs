(function(){


    var object = {};
    function variable(id, name, value)
    {

    }

    function uniqid()
    {
        var id;
        do{
            id=new Date().getTime() + '' + Math.random() * 10000000000;
        }while( object[id] );
        return id;
    }


    +(function (packages) {

        var func = {
            'position': function (event) {
                return true;
            }
        };

        var module = {
            'constructor': function () {
                this.__uniqid__= uniqid();
                variable.call(this,{name:'join'})
            },
            'fn': {
                'protected': {},
                'internal': {}
            }
        };
        var proto = module.constructor.prototype;

        var p = packages[""] || (packages[""] = {});

        p["test"] = module;

        proto.constructor = module.constructor;

        Object.defineProperties(proto, {
            'names': {
                set: function (names) {
                    this.name = names;
                },
                get: function () {
                    return this.name;
                }
            },
            'style': {
                get: function () {
                    return this.__style__;
                }
            }
        });

        proto.onResize = function (kkkss, lll, bb) {

        };


    })(packages)


}