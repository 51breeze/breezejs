<?php


//sleep( mt_rand(0,10) );

/*

header('Content-Type:text/javascript');
echo 'jsonp([{"jjj":"111"}], "'.$_GET['k'].'");';
exit;*/

error_reporting(0);


$data =  array();
$total = 300;

if( $_SERVER['REQUEST_METHOD'] == 'POST' )
{
    echo json_encode( array('code'=>0,'data'=>null,'msg'=>'ok','total'=>$total ) );
    EXIT;
}


$offset = intval($_GET['offset']);
$rows   = intval($_GET['rows']);

$rows = max(20, $rows);


for( $i=0; $i< $total; $i++ )
{
    $data[]=array(
        'id'=>$i+1,
        'name'=> mt_rand(10000,999999),
        'phone'=> mt_rand(10000000,999999999),
    );
}


if( isset($_GET['orderby']) )
{
    $type = $_GET['orderby']['id'];
    usort($data,function($a,$b)use($type){

        $s = $type==='desc' ? $b['id'] - $a['id'] :  $a['id']-$b['id'];

        return $s;

    });
}

$data=array_slice($data,$offset,$rows);


header("Content-type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
echo json_encode(array('code'=>0,'data'=>$data,'msg'=>'ok','total'=>$total ));

?>