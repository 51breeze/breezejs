(function(){




    +(function (packages) {

        var map= {

            'function':{
                'position': function (event) {
                    return true;
                }
                'resize':function (aa) {
                    map.function.position.call(this, aa )
                }
            }
            'static':{
                'ppp':function () {

                 },
                 'ttt':666
            }
            'variable': {
                'cccc':123
            }
        };


        var module = {
            'constructor': function () {
                this.__uniqid__= uniqid();
                variable.call(this,{name:'join'})
            },
            'package':'',
            'class':'',
            'function': {
                'protected': {'position':map.function.position},
                'internal': {}
            },
            'static': {
                'protected': {'ppp':map.static.ppp},
                'internal': {}
            },
            'variable': {
                'protected': {'ppp':map.variable.cccc},
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

        proto.onResize = map.variable.cccc;
        proto.onResize = map.function.resize


    })(packages)


});