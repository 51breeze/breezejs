const libxml = require('D:/node/node-global/node_modules/libxmljs');
const utils  = require('./utils.js');
const PATH = require('path');
var styleContents=[];
var template_syntax={
    'default': {
        'foreach': function (skin) {
            skin.before.unshift('<? foreach(' + skin.attr.name + ' as ' + (skin.attr.key || 'key') + ' ' + (skin.attr.value || 'item') + '){ ?>');
            skin.after.push('<?}?>');
        },
        'if': function (skin) {
            skin.before.unshift('<? if(' + skin.attr.condition + '){ ?>');
            skin.after.push('<?}?>');
        },
        'elseif': function (skin) {
            skin.before.unshift('<? }elseif(' + skin.attr.condition + '){ ?>');
            skin.after.push('<?}?>');
        },
        'else': function (skin) {
            skin.before.unshift('<? }else{ ?>');
            skin.after.push('<?}?>');
        },
        'do': function (skin) {
            skin.before.unshift('<? do{ ?>');
            skin.after.push('<?}?>');
        },
        'switch': function (skin, content) {
            skin.before.unshift('<? switch(' + skin.attr.condition + '){ ?>');
            skin.after.push('<?}?>');
        },
        'case': function (skin) {
            skin.before.unshift('<? case "' + skin.attr.condition + '": ?>');
        },
        'default': function (skin) {
            skin.before.unshift('<? default: ?>');
        },
        'break': function (skin) {
            skin.before.unshift('<? break; ?>')
        },
        'end': function (skin) {
            skin.after.push('<?}?>');
        },
        'function': function (skin) {
            skin.before.unshift('<? function ' + skin.attr.name + '(){ ?>');
            skin.after.push('<?}?>')
        },
        'while': function (skin) {
            skin.before.unshift('<? while(' + skin.attr.condition + '){ ?>');
            skin.after.push('<?}?>')
        },
        'code': function (skin) {
            skin.before.unshift('<? code{ ?>');
            skin.after.push('<?}?>')
        },
        'script': function (skin) {
            skin.before.unshift('<? code{ ?>');
            skin.after.push('<?}?>')
        },
    }
}

//@private
function __toString( skin )
{
    if( typeof skin === "string" )return skin;
    var tag = skin.name;
    var content=[];
    var temp = tag.indexOf(':');
    if( skin.children instanceof Array )
    {
        for(var c in skin.children )
        {
            var child = skin.children[c];
            if( child+"" === "[object Object]" )
            {
                content =  content.concat( __toString( child ) )
                skin.before=skin.before.concat( child.before );
                skin.after=skin.after.concat( child.after );

            }else if( child )
            {
                content.push( child )
            }
        }
    }

    if( temp>=0 )
    {
        var syntax = tag.substr(0,temp);
        tag = tag.substr(temp+1);
        syntax = syntax || 'default';
        syntax = template_syntax[ syntax ];
        if( !syntax[tag] )throw new SyntaxError('Syntax tag is not supported for "'+tag+'"');
        syntax[tag](skin);
        return content;
    }

    if( tag==='text' || skin.id )return content;
    var val;
    var str='<'+tag;
    for(var p in skin.attr )
    {
        val = skin.attr[p];
        str+=" "+p+'=\\"'+val+'\\"';
    }
    str+='>';
    skin.before.unshift(str);
    skin.after.push('</'+tag+'>');
    return content;
}

function getSkinObject(name)
{
    return {
        "name":name,
        "attr":{},
        "children":[],
    };
}

function makeSkinObject(skin)
{
    if( typeof skin === "string" )return skin;
    if( skin.name==='text' || skin.name==='script' )
    {
        return skin.children.join(',');
    }

    var content=[];
    content.push('"name":"'+skin.name+'"')
    content.push('"attr":'+JSON.stringify( skin.attr ) )
    var child=[];
    for( var i in skin.children )
    {
        child.push( makeSkinObject(skin.children[i]) );
    }
    content.push('"children":['+child.join(',')+']')
    return '{'+content.join(',')+'}';
}

var __uid__=1;
function uid(){return __uid__++;}


function parse( elem, config , root, parent )
{
    var name = elem.name();
    var element=getSkinObject(name);
    if( !root ){
        root = element;
        root.components={};
        root.style=[];
        root.container={};
    }
    if( name==='style' )
    {
        root.style.push( elem.text().replace(/^\B\s+/gm,'') );
        return null;
    }

    var nodes = elem.childNodes();
    var attrs = elem.attrs();
    for(var p in attrs)
    {
        var attrName = attrs[p].name();
        var attrValue =  attrs[p].value();
        if( attrName.toLowerCase()==='id' )
        {
            if( attrValue.charAt(0)==='@' )
            {
                attrValue = attrValue.substr(1);
                element.id = attrValue;
            }
            attrValue=utils.uid();
        }
        element.attr[ attrName ] = attrValue;
    }

    var namespace = elem.namespace();
    if( namespace)
    {
        namespace = utils.trim( namespace.href() );
        var classname = namespace ? namespace+'.'+name : name;
        element.name='component';
        if( classname.charAt(0)==='@' )
        {
            classname = classname.substr(1);
            if( classname.substr(0,10) ==='components' )classname = classname.substr(11);
            if( classname.charAt(0)==='.' )classname =classname.substr(1);
        }
        element.classname =  classname;
        if( element.attr.skin )
        {
            start( element.attr.skin, config);
            element.attr.skin="Reflect.construct( Internal.define(\""+element.attr.skin+"\") )";
        }
        if( !element.id )
        {
            element.id = 'var_'+uid();
        }
        root.components[ classname ]=element;
    }

    if (name == null)name = 'script';
    if( nodes.length > 0 )
    {
        for (var i in nodes)
        {
            var child= parse( nodes[i], config , root, element );
            if( child )
            {
                if( child.id )
                {
                    if( child.name!=='component' )root.container[ child.id ] = child;
                    if( child.id.substr(0,4) === 'var_' )
                    {
                        element.children.push( child.id )
                    }else {
                        element.children.push('this.' + child.id)
                    }

                }else
                {
                    element.children.push( child );
                }
            }
        }

    }else if( name === 'text' || name === 'script' )
    {
        var t = elem.text().replace(/(\B\s+\B)/g, '');
        if (t){
            element.children.push('"'+t+'"');
        }else{
            return null;
        }
    }
    return element;
}

var skinPakage = {};
function start(view , config)
{
    //工程路径
    var project_path = config.project.path;
    if( view.charAt(0)==='@' )
    {
        view = view.substr(1);
        //获取系统路径
        project_path = config.root_path;
    }

    //格式化皮肤文件路径
    view = PATH.relative( project_path , view.replace(/\./g,'/') ).replace(/\\/g,'/');
    var filename = view.replace(/\//g,'.');

    //如果是已经加载过
    if( config.loadedSkins[ filename ] === true )
    {
        return;
    }

    var filepath = utils.getResolvePath( project_path , view );
    filepath = filepath+config.skin_file_suffix;
    if( !utils.isFileExists(filepath) )throw new Error('not found skin. for "'+filepath+'"');
    var content = utils.getContents( filepath );
    utils.info('  Making '+filepath);
    var xml = libxml.parseXmlString( content ,{noblanks:false,nocdata:false} );
    config.loadedSkins[ filename ] = true;

    //解析皮肤对象
    skinPakage[ filename ]= parse( xml.root() , config );
    return skinPakage[ filename ];
}

function makeClass(classname,inherit,body,proto,requirements )
{
    var index = classname.lastIndexOf('.');
    var name = classname.substr(index+1);
    inherit = inherit || 'Object';
    requirements = ['Object',inherit].concat( requirements || [] );
    var _class = "(function("+requirements.join(",")+"){function "+name+"(){"+body+"}\n";
    _class+=name+'.prototype=Internal["Object.create"]('+inherit+'.prototype);\n';
    _class+=name+'.prototype.constructor='+name+';\n';
    _class+=name+'.toString=function toString(){return "function '+classname+'(){[native code]}";};\n';
    if( proto )for (p in proto)
    {
        _class+=name+'.prototype.'+p+'='+proto[p]+';\n';
    }
    _class+='return '+name+';\n}(System.'+requirements.join(",System.")+'))';
    return 'Internal.define("'+classname+'",'+_class+');\n';
}

function makeSkin(view , config)
{
    if( typeof config.requirements !== "object" )config.requirements={};
    if( typeof config.loadedSkins !== "object" )config.loadedSkins={};
    config.requirements.Skin=true;

    //初始化皮肤对象
    skinPakage={};

    //开始解析皮肤
    start(view , config );

    var skinContent={};
    for( var skinName in skinPakage )
    {
        var initialize = [];
        var skinInitialized = [];
        var skinObj = skinPakage[ skinName ];
        var requirements= {};
        for (var classname in skinObj.components)
        {
            requirements[classname]=true;
            var component=skinObj.components[classname];
            var ref='';
            if( component.id.substr(0,4) === 'var_' )
            {
                ref=component.id;
                initialize.push('var '+component.id+' = Reflect.construct( Internal.define("'+classname+'") )');
            }else
            {
                ref='this.'+component.id;
                initialize.push(ref+'=Reflect.construct( Internal.define("'+classname+'") )');
            }
            skinInitialized.push( ref+'.skinInitialized()' );
            if( component.attr.id )delete component.attr.id;
            for(var p in component.attr )
            {
                var n=p;
                if( p==='skin' )n='setSkin';
                initialize.push(ref +'.'+n+ '(' + component.attr[p] + ')');
            }
        }

        for (var p in skinObj.container)
        {
            var value=skinObj.container[p];
            if( skinObj.container[p]+""==="[object Object]")
            {
                value = 'new Skin('+makeSkinObject( skinObj.container[p] )+')';
            }
            if( p.substr(0,4) === 'var_' )
            {
                //skinInitialized.push( p+'.skinInitialized()');
                initialize.push('var '+p+'='+value );

            }else
            {
               // skinInitialized.push( 'this.'+p+'.skinInitialized()');
                initialize.push('this.' + p + '=' + value );
            }
        }

        if( skinInitialized.length>0)
        {
           // initialize.push('this.addEventListener(SkinEvent.INITIALIZED,function(e){'+ skinInitialized.join(";\n") + ';this.removeEventListener(SkinEvent.INITIALIZED);})');
        }

        //initialize.push("this.skinInitialized=function(){"+skinInitialized.join(";\n")+"}");

        initialize.push("Skin.call(this,"+makeSkinObject( skinObj )+");\n");
        skinContent[skinName]= {
            "skin":makeClass(skinName, 'Skin',initialize.join(';\n'), null , ['SkinEvent'] ),
            "style":skinObj.style.join("\n"),
            "requirements":requirements,
        };
    }
    return skinContent;
}

module.exports = makeSkin;


