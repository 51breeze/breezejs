const libxml = require('D:/node/node-global/node_modules/libxmljs');
const utils  = require('./utils.js');
const PATH = require('path');
var styleContents=[];
var hash={};
function parse( elem )
{
    var nodes = elem.childNodes();
    var name = elem.name();
    if( name==='style' )
    {
        styleContents.push( elem.text().replace(/^\B\s+/gm,'') );
        return null;
    }

    var element={
        name:name,
        attr:{},
        children:[],
    };

    var attrs = elem.attrs();
    for(var p in attrs)
    {
        var attrName = attrs[p].name();
        var attrValue =  attrs[p].value();
        if( attrName.toLowerCase()==='id' && attrValue.charAt(0)==='@' )
        {
            element.id = utils.uid();
            attrValue = attrValue.substr(1);
            element[ attrValue ]=element.id;
        }
        element.attr[ attrName ] = attrValue;
    }

    if( nodes.length > 0 )
    {
        for (var i in nodes)
        {
            var child= parse( nodes[i] );
            if( child )
            {
                element.children.push( child );
            }
        }

    }else
    {
        var t = elem.text().replace(/(\B\s+\B)/g,'');
        if( name==null  )
        {
            element.name='cdata';
            element.children.push(t);

        }else if( t )
        {
            element.children.push(t);

        }else if( name ==='text' )
        {
            return null;
        }
    }
    return element;
}

function start( view , config )
{
    var working = utils.getProjectPath(config,'project.client.skin',null);
    var project_path = config.project.path;
    styleContents=[];
    view = PATH.relative( project_path , view.replace(/\./g,'/') ).replace(/\\/g,'/');
    var filename = view.replace(/\//g,'.');
    if( hash[filename]===true )
    {
        throw new Error('Skin namespace conflicts. for "'+filename+'"');
    }
    hash[filename]=true;
    var filepath = utils.getResolvePath( project_path , view );
    filepath = filepath+working.suffix;
    var content = utils.getContents( filepath );
    utils.info('  Making '+filepath);
    var xml = libxml.parseXmlString( content ,{noblanks:false,nocdata:false} );
    var skin = parse( xml.root() );
    var pakage = {
        "skin": skin,
        "style":styleContents,
        "filename":filename
    };
    return pakage;
}
module.exports = start;

