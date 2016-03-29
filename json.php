<?php


sleep(1);


$data =  array();

$total = 647;

$offset = intval($_GET['offset']);
$rows   = intval($_GET['rows']);


for( $i=0; $i< $total; $i++ )
{
    $data[]=array(
        'id'=>$i+1,
        'name'=> mt_rand(10000,999999),
        'phone'=> mt_rand(10000000,999999999),
    );
}

$data=array_slice($data,$offset,$rows);


header("Content-type: application/json; charset=utf-8");
echo json_encode(array('code'=>0,'data'=>$data,'msg'=>'ok','total'=>$total ));

?>