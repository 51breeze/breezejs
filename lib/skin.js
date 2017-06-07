const libxml = require('D:/node/node-global/node_modules/libxmljs');
const utils  = require('./utils.js');
const PATH = require('path');

//private
function __toString(skin)
{
    if( typeof skin === "string" )return skin;
    var tag = skin.name;
    var children = skin.children || [];
    var attr = skin.attr || {};
    var content='';
    for (var c in children)
    {
        var child = children[c];
        if ( child+"" === "[object Object]" )
        {
            content += __toString(child);
        } else
        {
            content += child.toString();
        }
    }
    if( tag==='text' ||  tag==='template' )return content;
    var temp = tag.indexOf(':');
    if( temp>=0 )
    {
        var syntax = tag.substr(0,temp);
        tag = tag.substr(temp+1);
        syntax = syntax || 'default';
        syntax = template_syntax[ syntax ];
        if( !syntax[tag] )throw new SyntaxError('Syntax tag is not supported for "'+tag+'"');
        return syntax[tag](attr,content);
    }

    var str = '<' + tag;
    for (var p in attr)
    {
        if( p !=='id' ){
            var v = attr[p].replace(/([\"\'])/g,'\\$1');
            str += " " + p + '="' + v + '"';
        }
    }
    str += '>' + content + '</' + tag + '>';
    return str;
}

//private
var template_syntax={
    'default': {
        'foreach': function (attr, content) {
            return '<? foreach(' + attr.name + ' as ' + (attr.key || 'key') + ' ' + (attr.value || 'item') + '){ ?>' + content + '<?}?>';
        },
        'if': function (attr, content) {
            return '<? if(' + attr.condition + '){ ?>'+content+'<?}?>';
        },
        'elseif': function (attr, content) {
            return '<? elseif(' + attr.condition + '){ ?>'+content+'<?}?>';
        },
        'else': function (attr, content) {
            return '<? }else{ ?>'+content+'<?}?>';
        },
        'do': function (attr, content) {
            return '<? do{ ?>'+content+'<?}?>';
        },
        'switch': function (attr, content) {
            return '<? switch(' + attr.condition + '){ ?>'+content+'<?}?>';
        },
        'case': function (attr, content) {
            content = '<? case "' + attr.condition + '": ?>'+content;
            if( attr["break"]==='true' )content+='<? break; ?>';
            return content;
        },
        'default': function (attr, content) {
            content='<? default: ?>'+content;
            if( attr["break"]==='true' )content+='<? break; ?>';
            return content;
        },
        'break': function (attr, content) {
            return '<? break; ?>'+content;
        },
        'end': function (attr, content) {
            return content+='<?}?>';
        },
        'while': function (attr, content) {
            return '<? while(' + attr.condition + '){ ?>'+content+'<?}?>';
        },
        'code': function (attr, content) {
            return '<? code{ ?>'+content+' <? } ?>';
        },'script': function (attr, content) {
            return '<? code{ ?>'+content+' <? } ?>';
        }
    }
}


function getSkinObject(name)
{
    return {
        "name":name,
        "attr":{},
        "children":[],
    };
}

function makeSkinObject(skin, attach )
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
    if( attach )
    {
        content = content.concat(attach);
    }
    return '{'+content.join(',')+'}';
}

var __uid__=1;
function uid(){return __uid__++;}

function parse( elem, config , root, parent , filepath , filename , isTemplate )
{
    var name = elem.name();
    if (name == null)
    {
        //CDATA
        var script = utils.trim( elem.text() );
        if( script )parent.script.push( script );
        return null;
    }
    var element=getSkinObject(name);
    if( !root )
    {
        root = element;
        root.components=[];
        root.style=[];
        root.script=[];
        root.hash={};
        root.fullclassname = filename;
        root.extends = name;
        root.bindable=[];
    }

    if( name==='comment' )
    {
       return null;
    }
    if( name==='style' )
    {
        var style = utils.trim( elem.text() );
        if( style )
        {
            root.style.push( style );
        }
        return null;
    }

    if( !isTemplate && (name==="template" || name.charAt(0) ===':') )
    {
        isTemplate=true;
        element.isTemplate = true;
    }

    var nodes = elem.childNodes();
    var attrs = elem.attrs();
    var _hash={};
    for(var p in attrs)
    {
        var attrName = attrs[p].name();
        var attrValue =  attrs[p].value();

        //绑定属性
        if( attrValue.slice(0,2) === '{{' && attrValue.slice(-2) === '}}' )
        {
            attrValue = attrValue.slice(2,-2);
            attrValue = attrValue.split('|');
            if( !element.id )
            {
                element.id = '__var'+uid()+'__';
                element.bindable=true;
                element.isPrivate=true;
            }
            var bindname = attrValue[0].replace(/\s/g,'');
            bindname = bindname.split('.');
            if( bindname[0] !== 'this' )bindname.unshift('this');
            var refname = bindname.pop();
            var refobj =  bindname.join('.');
            var binding = root.bindable[ refobj ] || (root.bindable[ refobj ]={name:[],bind:[]});
            if( binding.name.indexOf(refname) < 0 ){
                binding.name.push(refname)
            }
            binding.bind.push( {id:element.id,attr:attrName,name:refname,flag:(attrValue[1]||'').toLowerCase()!=="false"});
            attrValue  = "";
        }
        var hash = '@id';
        if( attrName.toLowerCase()==='id' )
        {
            if( attrValue.charAt(0)==='@' )
            {
                attrValue = attrValue.substr(1);
                element.id = attrValue;
                hash = true;
            }
            if( !/^[a-zA-Z\$\_]\w+$/.test(attrValue) )
            {
                throw new Error('"'+attrValue+'" is not valid id');
            }
            if (root.hash.hasOwnProperty(attrValue))
            {
                throw new Error('"' + attrValue + '" has already been declared');
            }
            root.hash[attrValue] = hash;
            _hash[attrValue]=hash;
        }
        if( hash !== true )
        {
            element.attr[attrName] = attrValue;
        }
    }

    if( element.id ){
        element.hash  = _hash;
        for(var p in _hash )delete root.hash[p];
    }

    var namespace = elem.namespace();
    if( namespace )
    {
        namespace = utils.trim( namespace.href() );
        var classname = namespace ? namespace+'.'+name : name;
        if( element === root  )
        {
            element.fullclassname = filename;
            element.extends = classname;
        }
        else
        {
            //private
            if( !parent.id )
            {
                parent.id = '__var'+uid()+'__';
                parent.isPrivate=true;
            }

            if ( !element.id )
            {
                element.id = '__var'+uid()+'__';
                element.isPrivate=true;
            }

            ////一个皮肤对象
            if( config.project_skin_path.indexOf( namespace.replace('.','/') ) >= 0 )
            {
                start(classname , config);
                element.isSkinComponent=true;

            }else
            ////一个组件
            {
                element.attr.viewport= '@'+parent.id+' as Element';
            }

            element.fullclassname = classname;
            element.classname = name;
            element.extends = '';
            element.package = namespace;
            element.filepath = filepath;
            element.script = [];
            element.style = [];
            element.hash = {};
            element.isComponent = true;
            root.components.push( element );
        }
    }

    //模板中不能添加组件或者皮肤对象
    if( isTemplate === true && (element.id || element.isComponent) )
    {
        throw new SyntaxError('can not add component in the template for "'+(element.isComponent ? element.fullclassname : element.id)+'"');
    }

    if( nodes.length > 0 )
    {
        for (var i in nodes)
        {
            var child= parse( nodes[i], config ,element.isComponent ? element : root, element, filepath , filename , isTemplate );
            if( child )
            {
                if( child.id )
                {
                    if( !element.id )
                    {
                        element.id = '__var'+uid()+'__';
                        element.isPrivate=true;
                    }
                    if( !child.isComponent )
                    {
                        element.children.push( child.id );
                    }else if( child.isSkinComponent )
                    {
                        element.children.push( child.id );
                    }


                }else
                {
                    element.children.push( child );
                }
            }
        }

    }else if( name === 'text' )
    {
        var t = utils.trim( elem.text() );
        if (t){
            return isTemplate ? t : '"'+t+'"';
        }else{
            return null;
        }
    }

    //如果有自定义代码就构建一个新的组件
    if( element.isComponent === true  )
    {
        if( element.script.length > 0 )
        {
            var obj = createModulObject(element.fullclassname, filename + '.' + name + uid(), filepath);
            element.fullclassname = obj.fullclassname;
            element.classname = obj.classname;
            element.extends = obj.extends;
            element.package = obj.package;
            element.filepath = filepath;
            element.script = makeModuleClass(config, element, {}, element.components || [], element.script.join(""), '', element, '');
            moduleContents.push(element);
        }
        return element;

    }else if( element.isTemplate === true )
    {
        var content = __toString( element );
        return "'"+content+"'";

    }else if( element.id && element !== root)
    {
        //实例化一个皮肤组件
        var module = createModulObject('' ,'Skin', '' );
        var attach = null;
        if( element.hash )
        {
            attach = '"hash":{'+getHash(element)+'}';
        }
        module.param = makeSkinObject( element , attach );
        module.name = element.name;
        module.id = element.id;
        //module.hash = element.hash;
        module.attr = element.attr;
        module.isPrivate = element.isPrivate;
        element.children.push( element.id );
        root.components.push( module );
    }
    return element;
}

function createModulObject(inherit, fullclassname , filepath )
{
    var skinModule={};
    var index = fullclassname.lastIndexOf('.');
    skinModule.fullclassname = fullclassname;
    skinModule.extends = inherit;
    skinModule.classname = fullclassname.substr(index+1);
    skinModule.package = fullclassname.substr(0,index);
    skinModule.filepath = filepath;
    return skinModule;
}

var moduleContents = [];
var styleContents = [];

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

    var skinObj= parse( xml.root() , config , null, null, filepath, filename );
    if( skinObj.name !=='Skin' )
    {
       // throw new Error('Invalid skin object "'+skinObj.name+'"' );
    }

    skinObj.name = 'div';
    if( skinObj.attr.name )
    {
        skinObj.name= skinObj.attr.name;
        delete skinObj.attr.name;
    }
    var skinModule = createModulObject( skinObj.extends, skinObj.fullclassname, filepath );
    skinModule.script = makeModuleClass(config, skinModule ,skinObj.attr, skinObj.components || [],utils.trim( skinObj.script.join("") ) , skinObj.style.join("\n"), skinObj, 'skinObject');

    //解析皮肤对象
    moduleContents.push( skinModule );
    return skinModule;
}

function makeModuleClass(config, classModule, attr, components, scriptContent ,styleContent, skinObject ,paramName )
{
    var imports = [];
    var body=[];
    var inherit = classModule.extends || '';
    var content = ['package ', classModule.package ,'{'];
    var property=[];
    var setProperty=[];
    var attach =  getHash(skinObject);
    //嵌套的组件
    for (var classname in components )
    {
        var component=components[classname];
        var value=component.classname;
        var param = component.param || '';

        //需要加载的组件
        if( classModule.fullclassname !==component.fullclassname && imports.indexOf(component.fullclassname)<0 )imports.push( component.fullclassname );

        body.push('var '+component.id+':'+value+'= new '+value+'('+param+');\n' );
        if( component.isPrivate !== true )
        {
            property.push('public var '+component.id+';\n' );
            setProperty.push('this.'+component.id+'='+component.id+';\n' );
            attach.push('"'+component.id+'":'+component.id);
        }

        attach = attach.concat( getHash(component) );
        if( component.isComponent===true )
        {
            makeSetProperty(setProperty, component.attr, component.id, config);
        }
    }
    body = body.concat( setProperty );
    if( inherit )imports.push( inherit );
    if( imports.length > 0 )
    {
        content.push( 'import '+imports.join(';\nimport ') +';\n' );
    }

    scriptContent = scriptContent.replace(/\b(import\s+[\w\.\s]+)([\;\n])/g, function (a,b,c) {
        content.push(b+';\n');
        return '';
    });

    content.push( 'class ')
    content.push( classModule.classname );
    if( inherit )
    {
        content.push(' extends ');
        content.push( inherit );
        body.push('super('+makeSkinObject( skinObject, ['"hash":{'+attach.join(',')+'}'] )+');\n');
    }

    //绑定元标签
    if( skinObject.bindable )
    {
        var bindableContent = [];
        var index = 0;
        for( var p in skinObject.bindable )
        {
             var item =skinObject.bindable[ p ];
             var varname = '__bind'+(index++)+'__';
             bindableContent.push('var '+varname+' = new Bindable('+p+','+JSON.stringify(item.name)+');\n' );
             for(var i in item.bind )
             {
                 var flag = !item.bind[i].flag ? '",false' : '"';
                bindableContent.push( varname+'.bind('+item.bind[i].id+',"'+item.bind[i].attr+'","'+item.bind[i].name+flag+');\n' );
             }
        }
        if( bindableContent.length > 0 )
        {
            body.push(
                'this.addEventListener("internal_create_children_completed",function(event){\n' +
                bindableContent.join("") +
                '});\n'
            );
        }
    }

    content.push('{');
    content.push( property.join("") );

    //绑定的属性{{property}}
    styleContent = styleContent.replace(/\{\{([\s\w]+)\}\}/g,function (a,prop){
        prop = utils.trim( prop );
        if( !prop )
        {
            throw new SyntaxError('binding must have a property name');
        }
        if( !attr.hasOwnProperty(prop) )
        {
            throw new SyntaxError('property name is not defined of binding');
        }
        return attr[prop];
    });
    styleContents.push( styleContent );
    makeSetProperty(body, attr, 'this', config );
    content.push( 'function '+classModule.classname+'('+(paramName || '')+')'+'{'+body.join("")+'}' );
    content.push( scriptContent );
    content.push( '}}' );
    return content.join("");
}

function getHash( skinObj ) {

    var attach = [];
    if( skinObj.hash )
    {
        for(var p in skinObj.hash )
        {
            if( skinObj.hash[p] === '@id')
            {
                attach.push('"'+p+'":"@id"');
            }
        }
    }
    return attach;
}

function makeSetProperty(body, attr, ref, config )
{
    for( var p in attr )
    {
        if( p === 'id' || p==='class')continue;
        var v = utils.trim(attr[p]);
        var isref = false ;
        if( v.charAt(0) ==='@' )
        {
            isref=true;
            v = v.substr(1);
        }

        if( p==="skin" )
        {
            start(v, config);
            v = "new " + v + "()";

        } else if( !isref && !/^\d+$/.test(v) && /^[\w\#]/.test(v)  )
        {
            v = '"'+v+'"';
        }
        body.push( ref+'.'+p+'='+v+';\n');
    }
}



function makeSkin(view , config )
{
    if( typeof config.loadedSkins !== "object" )config.loadedSkins={};

    //初始化皮肤对象
    moduleContents=[];
    styleContents=[];

    //开始解析皮肤
    start(view , config );

    return {
        styleContents:styleContents,
        moduleContents:moduleContents,
    };
}

module.exports = makeSkin;


