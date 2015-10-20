<?php

$data =  array();

for($i=0; $i<100; $i++)
{
    $data[]=array(
        'id'=>$i+1,
        'name'=> mt_rand(10000,999999),
        'phone'=> mt_rand(10000000,999999999),
    );
}

header("Content-type: application/json; charset=utf-8");
echo json_encode(array('code'=>0,'data'=>$data,'msg'=>'ok','total'=>count($data)));

?>