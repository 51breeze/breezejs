const fs = require('fs');
const root = process.cwd().replace('\\','/');
const suffix = '.as';
const global_module={};
const Ruler = require('./compiler/Ruler.js');
const r = new Ruler();


function global(name)
{
    var path = name.replace(/\s+/g,'').split('.');
    var deep=0;
    var obj=global_module;
    var len =path.length;
    while(deep < len )
    {
        name = path[deep];
        obj = obj[ name ] || (obj[ name ]={});
        deep++;
    }
    return obj;
}

function merge()
{
    var target = arguments[0];
    var len = arguments.length;

    for(var i=1; i<len; i++ )
    {
        var item = arguments[i];
        for( var p in item )
        {
            if( Object.prototype.isPrototypeOf( item[p] ) && Object.prototype.isPrototypeOf( target[p] ) )
            {
                target[p] = merge( target[p],  item[p] );
            }else{
                target[p] = item[p];
            }
        }
    }
    return target;
}

function pathfile( file )
{
    file = file && file !='' ? file.replace('.','/') : '';
    return root +'/'+ file + suffix;
}


function isExistsCacheFile(file )
{
    return fs.existsSync( getCacheFilePath(file) );
}

function getCacheFilePath(file, suffix )
{
    return root+'/compiler/cache/'+file.replace('.','_')+ (suffix || '.js');
}


/**
 * 去掉两边的空白
 * @param str
 * @returns {string|void|XML}
 */
function trim( str )
{
    return typeof str === "string" ? str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,'') : '';
}


var cacheEnable=true;


/**
 * 执行编译
 */
function make( file )
{

    var source = pathfile(file);
    var stat = fs.statSync( source );
    var id =  new Date(stat.mtime).getTime();
    var is = false;
    var data;
    console.log( source,'...' );

    if( isExistsCacheFile(file) && cacheEnable )
    {
         var json = fs.readFileSync( getCacheFilePath(file) , 'utf-8');
         data = JSON.parse( json );
         is = json.id === id;
    }

    if( !is )
    {
        var content = fs.readFileSync( source , 'utf-8');
        var scope = r.start(content);
        data = Ruler.createModule(scope, id);
        fs.writeFileSync(getCacheFilePath(file, '.js'), JSON.stringify(data) );
    }

    for( var i in data.import )
    {
        make( data.import[i] );
    }
}









function format(bytes)
{
    return (bytes/1024/1024).toFixed(2)+'MB';
}
function showMem()
{
    var mem = process.memoryUsage();
    console.log('Process: heapTotal '+format(mem.heapTotal) + ' heapUsed ' + format(mem.heapUsed) + ' rss ' + format(mem.rss));
}
var main='test';



console.log('========start make=======' );
var content = make( main , fs );
console.log('===========done=========\n' );


/*if( !global_error )
{
    var system = fs.readFileSync( './system.js' , 'utf-8');
    var app='\nreturn __g__.getInstance("'+main+'");\n';
    content = "(function(){\n" + system + content + app +'\n})()';
    fs.writeFileSync('./test-min.js', content );
}*/
//showMem()


