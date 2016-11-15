(function(){



    var A = (function () {

        var uid = 123456;
        var A = function () {
            this[uid] = {
                _name: '123 A',
                age:30,
            }
        };

        A.prototype.constructor = A;
        A.prototype.name = function () {
            console.log(this[uid]._name);
        }

        A.prototype.age=30;
        A.prototype.getAge = function () {
            console.log( this[uid].age );
        }

        A.prototype.setAge = function (age) {
            this[uid].age = age;
        }

        return A;

    })()



    var B = (function (A){

        var uid = 54996565;
        var map={};

        var B = function () {
            A.call(this);
            this.BP={
               _name: '123 B',
               age:28,
            }
        };

        var s = function(){};
        s.prototype= A.prototype;
        B.prototype= new s();
        B.prototype.constructor = B;
        B.prototype.BM=map;


        map.name =function () {

            A.prototype.name.call(this);
            //console.log( this[uid]._name );
        }

        map.age=28;
        map.getAge =function () {

           // console.log( this[uid].age );

             A.prototype.getAge.call(this);
        }


        map.setAge =function (age) {

           // console.log( this[uid].age );

             A.prototype.setAge.call(this, age+1 );
        }

        return B;


    })(A)


    var b =  new B();
    b.name();

    b.getAge();

    b.setAge(98);

    b.getAge();


    for( var i in b )
    {

        if( Object.prototype.propertyIsEnumerable.call(b, i ) )
            console.log( i ,'==')

    }





})()


