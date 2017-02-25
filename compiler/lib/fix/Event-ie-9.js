/**
 * IE9 以下
 */
if( system.env.platform('IE') && System.env.version(8) )
{
    Event.fix.map[ Event.READY ] = 'readystatechange';
}