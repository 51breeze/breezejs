

var str =[
    "@internal   Object.setPropertyOf \n",
    "Object.setPropertyOf = $Object.setPropertyOf \n",
    ];

str = str.join('');

var prefix = 'Object';
var p = 'setPropertyOf';

//\b((?!baidu)\w)+\b

//str = str.match( /([^(@|@internal)])ObjectsetPropertyOf/g );

str = str.replace(/Object\.setPropertyOf/g, function (a,b,c)
{
    if( c.substr(b-1,1) === '$' )return a;
    return 'Internal["' + prefix + '.' + p + '"]';
});






console.log( str )
