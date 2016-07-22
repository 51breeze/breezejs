<?php

$file='./test.as';

function content( $file )
{
    $content = file_get_contents( $file );
    return $content;
}

function code( $content )
{
    preg_match_all('/[^\;\r\n]+/s',$content, $match, PREG_OFFSET_CAPTURE );
    return $match[0];
}

function line( $file , $pos )
{
    $result = preg_split('/[\n]+/', substr($file, 0, $pos), -1, PREG_SPLIT_NO_EMPTY);
    return count( $result );
}


$content = content( $file );
$filecode = code( $content );


$data=array();
$package='';
$function=array();
$access=array();


$switch=false;

$tag_count_flag=false;
$tag_count_open=0;
$tag_count_close=0;


foreach( $filecode as $line )
{
    $pos = $line[1];
    $code = $line[0];

    /**
     * 需要关闭的代码块
     */
    if( preg_match('/^[\s\w]*(package|class|function|if|else|for|foreach|try|catch|switch|while|do)/i',$code, $m) )
    {
        $tag_count_flag=true;
    }

    if( $tag_count_flag )
    {
        $open = preg_split('/\{/', $code);
        $tag_count_open+=count( $open );
        $close = preg_split('/\}/', $code);
        $tag_count_open-=count( $close );
    }


    /*if( preg_match('/(package|public|class|protected|private|function|var|import)(\s+[\w\.]+)?(\s+[\w\.]+)?(\s+[\w\.]+)?\s+([\w\.\,]+)/i',$code, $m ) )
    {
        if( $m[1] === 'package' )
        {
            $package = $m[4];

        }else if( $m[1] === 'function' || $m[2] === 'function' )
        {
            $name = $m[4];
            if( !empty($m[3]) )
            {

            }else
            {
                $type = $m[1] === 'function' ? 'public' : $m[1];
                if ( !isset($function[$type]) )
                {
                    $function[ $type ] = array();
                }
                $function[ $type ][ $name ] = $name;
            }
        }
    }*/



}


echo $tag_count_open;
