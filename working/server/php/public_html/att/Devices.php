<?php
require_once("config.php");
header("Content-Type:application/json");

try {
	$response = "Invalid API Call";

	list($blank, $Devices, $operation) = split('[/]', $_SERVER['PATH_INFO']);
	switch (strtolower($operation)) {
		case "info":
			$response = $html5_provider->deviceInfo();
			break;
		default:
			$response = 'Invalid API Call - operation ' . $operation . ' is not supported. PATH_INFO: ' . var_dump($_SERVER['PATH_INFO']);
	}
	if (DEBUG) {
		Debug::init();
		$objDateTime = new DateTime('NOW');
		$now = $objDateTime->format('c');
		Debug::write("$now : $operation : $response");
		Debug::end();
	}
	echo $response;
}
catch(ServiceException $se) {
	//http_response_code(400); // Set response code to 400 - Bad Request in case of all exceptions
	header('X-PHP-Response-Code: 400'); // Set response code to 400 - Bad Request in case of all exceptions
	echo('ServiceException: ErrorCode: '.$se->getErrorCode().'. Response: ' . $se->_errorResponse());
}
catch(Exception $e) {
	//http_response_code(400); // Set response code to 400 - Bad Request in case of all exceptions
	header('X-PHP-Response-Code: 400'); // Set response code to 400 - Bad Request in case of all exceptions
	echo('Exception: '.$e->getMessage());
}

?>