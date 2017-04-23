const libxml = require('D:/node/node-global/node_modules/libxmljs');
const utils  = require('./utils.js');
const PATH = require('path');

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
    if( skin.name==='text' || skin.name==='cdata' )
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
        root.script=[];
    }

    if (name == null)
    {
        //CDATA
        parent.script.push( elem.text().replace(/(\B\s+\B)/g, '') );
        return null;
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
        element.script=[];
        if( classname.charAt(0)==='@' )
        {
            classname = classname.substr(1);
            if( classname.substr(0,10) ==='components' )classname = classname.substr(11);
            if( classname.charAt(0)==='.' )classname =classname.substr(1);
        }

        element.extends = classname;
        var index = classname.lastIndexOf('.');
        classname = classname.substr(index+1);
        classname+=uid();
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

    if( nodes.length > 0 )
    {
        for (var i in nodes)
        {
            var child= parse( nodes[i], config , root, element );
            if( child )
            {
                if( child.id )
                {
                    if( child.name !== 'component' )root.container[ child.id ] = child;
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

    }else if( name === 'text' )
    {
        var t = elem.text().replace(/(\B\s+\B)/g, '');
        if (t){
            return '"'+t+'"';
        }else{
            return null;
        }
    }
    return element;
}

var skinContents = {};
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
    utils.info('Checking file '+filepath);
    var xml = libxml.parseXmlString( content ,{noblanks:false,nocdata:false} );
    config.loadedSkins[ filename ] = true;

    //解析皮肤对象
    skinContents[ filename ]= parse( xml.root() , config );
    skinContents[ filename ].path = filepath;
    return skinContents[ filename ];
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
    _class+=name+'.toString=function toString(){return "['+classname+' Class]";};\n';
    if( proto )for (p in proto)
    {
        _class+=name+'.prototype.'+p+'='+proto[p]+';\n';
    }
    _class+='return '+name+';\n}(System.'+requirements.join(",System.")+'))';
    return 'Internal.define("'+classname+'",'+_class+');\n';
}

function makeSkin(view , config )
{
    if( typeof config.requirements !== "object" )config.requirements={};
    if( typeof config.loadedSkins !== "object" )config.loadedSkins={};
    config.requirements.Skin=true;

    //初始化皮肤对象
    skinContents={};

    //开始解析皮肤
    start(view , config );

    var requirements= {};
    var skinModules=[];
    var styleContents=[];
    var scriptContents=[];

    for( var skinName in skinContents )
    {
        var initialize = [];
        var skinObj = skinContents[ skinName ];

        //皮肤中使用了组件
        for (var classname in skinObj.components)
        {
            var component=skinObj.components[classname];
            var scriptStr =utils.trim( component.script.join('\n') );

            if( scriptStr )
            {
                //自定义的组件
                classname = view+'.'+classname;
                scriptContents.push({"classname":classname,"content":scriptStr,'extends':component.extends,'filepath':skinObj.path});

            }else
            {
                //需要加载的组件
                requirements[ component.extends ]=true;
                classname = component.extends;
            }

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

            if( component.attr.id )delete component.attr.id;
            for(var p in component.attr )
            {
                var n=p;
                if( p==='skin' )n='skin';
                initialize.push('Reflect.set('+ref+', "'+n+'", '+component.attr[p]+')' );
            }
        }

        for (var p in skinObj.container )
        {
            var value=skinObj.container[p];
            if( skinObj.container[p]+""==="[object Object]")
            {
                value = 'new Skin('+makeSkinObject( skinObj.container[p] )+')';
            }
            if( p.substr(0,4) === 'var_' )
            {
                initialize.push('var '+p+'='+value );
            }else
            {
                initialize.push('this.' + p + '=' + value );
            }
        }
        initialize.push("Skin.call(this,"+makeSkinObject( skinObj )+");\n");
        styleContents.push( skinObj.style.join("\n") );
        skinModules.push( makeClass(skinName, 'Skin',initialize.join(';\n') ) );
    }
    return {
        "skins":skinModules,
        "styles":styleContents,
        "scripts":scriptContents,
        "requirements":requirements,
    };
}

module.exports = makeSkin;


