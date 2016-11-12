
var Animal = (function () {

        var Animal = function()
        {
            Animal.prototype.name='Tom Animal +';
        }

        var map={
            props:{},
            methods:{
                sleep:function()
                {
                    console.log(this.name + '正在睡觉！');
                },
                setname:function (val) {
                    this.name=val;
                }
            }
        }

        Animal.prototype.prop=function (name,val) {

        }

        Animal.prototype.method=function (name,param) {
             map.methods[name].apply(this,param || []);
        }

        Animal.prototype.name='Tom Animal';
        return Animal;

    })();


var Cat = (function () {

     function Cat() {
        Animal.call(this);
       // this.name = 'Tom 123';
         Cat.prototype.name = 'Tom 123';
     }

    var s = function () {};
    s.prototype = Animal.prototype;
    Cat.prototype = new s();
    Cat.prototype.constructor = Cat;
    Cat.prototype.name='Tom';

    var map={
        props:{},
        methods:{
            age:function () {
                console.log( this.name ,'====');
            },
            setage:function (val) {
                Cat.prototype.name = val;
            }
        }
    }


    Cat.prototype.prop=function () {
    }

    Cat.prototype.method=function (name,param) {
        if( map.methods[name] )
        {
            map.methods[name].apply(this, param || []);
        }else {
            Animal.prototype.method.call(this, name, param);
        }
    }

    return Cat;

})();



var cat1 = new Cat();
cat1.method('setage',[99])
cat1.method('age')


var cat2 = new Cat();
cat2.method('setage',[120])
cat2.method('age')

cat1.method('age')

console.log( cat1.__proto__ === Cat.prototype )

/*cat.method('sleep')
cat.method('setname',['yejun'])
cat.method('sleep')*/


//console.log( cat.prop )

