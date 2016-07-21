<?php


$file='./test.as';

$content = file_get_contents( $file );

//$content = preg_replace('/\/\*.*?\*\//s','', $content );
//$content = preg_replace('/\/\/.*?\r\n/','', $content );

preg_match_all('/[^\;\r\n]+/s',$content,$match, PREG_OFFSET_CAPTURE );



$data=array();
$package='';
$function=array();

foreach( $match[0] as $item )
{
    if( preg_match('/class\s+(\w+)\s+(extends\s+([\w\,]+))?/i',$item[0], $m ) )
    {


    }else if( preg_match('/(package|public|protected|private|function|var)(\s+[\w\.]+)?(\s+[\w\.]+)?\s+([\w\.]+)/',$item[0], $m ) )
    {
         if( $m[1] === 'package' )
         {
             $package = $m[4];
             $data[ $package ]= array();

         }else if( $m[1] === 'function' || $m[2] === 'function' )
         {
             $acess= $m[1] === 'function' ? 'public' : $m[1];
             if( !isset($function[ $acess ])  )
             {
                 $function[ $acess ]=array();
             }
             $function[ $acess ][]=$m[4];
         }

        print_r( $m );
    }
}

print_r( $data );
print_r( $function );




//preg_match_all('//','',$match);