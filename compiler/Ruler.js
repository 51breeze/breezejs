function Ruler( content )
{
  this.lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  this.line=0;
  this.cursor=0;
  this.text='';
}


Ruler.prototype.prev=function()
{

}

Ruler.prototype.current=function()
{

}

var delimiter=/([\{\(\[\]\)\}\,\;\?]|[\!\&\|\<\>\=\+\-\*\/\^\%]+|\s+)/;

Ruler.prototype.next=function()
{
    var str = this.lines[ this.line ];
    var s,ident='',balancer=0;
    var type="(identifier)";


    while ( str.length > this.cursor )
    {
        s= str[this.cursor++];

        if( s !==' ' )
        {

            if( isIdentifier( s ) )
            {
                if( ident )
                {
                    this.cursor--;
                    break;
                }
            }


            if( ( s==='{' || s==='}' || s==='(' || s===')' || s==='[' || s===']' || s===';' || s===',' || s==='=' ) && ident.charAt(ident.length)!=='\\' )
            {
               ident=s;
               break;

            }else if( (s==='"' || s==="'" ) && ident.charAt(ident.length)!=='\\' )
            {
                type= "(string)";
                balancer++;

            }else
            {
                ident+=s;
            }

            if( balancer > 0 && balancer===2 )
            {
                break;
            }

        }else if( ident && !balancer )
        {
            break;
        }
    };

    if( this.cursor >= str.length )
    {
        this.cursor=0;
        this.line++;
    }
}



function isIdentifier( str )
{

    switch(str)
    {
        case '{' :
        case '(' :
        case '[' :
        case ']' :
        case ')' :
        case '}' :
        case ',' :
        case ';' :
        case '=' :
        case '?' :
        case '!' :
        case '&&' :
        case '||' :
        case '<=' :
        case '>=' :
        case '==' :
        case '===' :
        case '!==' :
        case '<<' :
        case '>>' :
        case '+' :
        case '-' :
        case '*' :
        case '/' :
        case '++' :
        case '--' :
        case '&' :
        case '|' :
        case '^' :
        case '%' :
        case '-=' :
        case '+=' :
        case '/=' :
        case '*=' :
        case '&=' :
        case '|=' :
        case '^=' :
        case '%=' :
             return str;
        break;
    }
    return '';
}


function Syntax()
{




}




