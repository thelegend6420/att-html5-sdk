<?php
namespace Att\Api\Payment;

/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 */

/**
 * Payment Library
 * 
 * PHP version 5.4+
 * 
 * LICENSE: Licensed by AT&T under the 'Software Development Kit Tools 
 * Agreement.' 2013. 
 * TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTIONS:
 * http://developer.att.com/sdk_agreement/
 *
 * Copyright 2013 AT&T Intellectual Property. All rights reserved.
 * For more information contact developer.support@att.com
 * 
 * @category  API
 * @package   Payment
 * @author    pk9069
 * @copyright 2013 AT&T Intellectual Property
 * @license   http://developer.att.com/sdk_agreement AT&amp;T License
 * @link      http://developer.att.com
 */

require_once __DIR__ . '../../Notary/Notary.php';
require_once __DIR__ . '../../Notary/NotaryService.php';
require_once __DIR__ . '../../Srvc/APIService.php';

use Att\Api\OAuth\OAuthToken;
use Att\Api\Restful\RestfulRequest;
use Att\Api\Restful\HttpPut;
use Att\Api\Srvc\APIService;
use Att\Api\Srvc\Service;
use Att\Api\Notary\Notary;

/**
 * Used to interact with version 3 of the Payment API.
 *
 * @category API
 * @package  Payment
 * @author   pk9069
 * @license  http://developer.att.com/sdk_agreement AT&amp;T License
 * @version  Release: @package_version@ 
 * @link     https://developer.att.com/docs/apis/rest/3/Payment
 */
class PaymentService extends APIService
{

    /** 
     * Gets the redirect URL.
     * 
     * @param string  $FQDN    fully qualified domain name
     * @param string  $cid     client id
     * @param Notary  $notary  notary
     * @param boolean $isTrans true if transaction, false if subscription
     *
     * @return string redirect URL
     */
    private static function _getURL(
        $FQDN, $cid, Notary $notary, $isTrans = true
    ) {

        $type = $isTrans ? 'Transactions' : 'Subscriptions';

        $url = $FQDN . '/rest/3/Commerce/Payment/' . $type;
        $signedDoc = $notary->getSignedDocument();
        $signature = $notary->getSignature();
        $url .= '?clientid=' . $cid . '&SignedPaymentDetail=' . $signedDoc 
            . '&Signature=' . $signature;

        return $url;
    }

    /**
     * Internal function used for handling common information requests, such
     * as getting a transaction or subscription status.
     *
     * @param string $url url to send request to
     *
     * @return array api response as an array of key-value pairs
     * @throws ServiceException if api request was not successful
     */
    private function _getInfo($url, $raw_response = false)
    {
        $req = new RestfulRequest($url);
        $result = $req
            ->setHeader('Accept', 'application/json')
            ->setAuthorizationHeader($this->getToken())
            ->sendHttpGet();
		
		if ($raw_response) {
			return Service::parseApiResposeBody($result); // Note: This could throw ServiceExeption
		}		
        
		return Service::parseJson($result);
    }

    /**
     * Internal function used for sending common transaction operation 
     * statuses, such as refunding a transaction or cancelling a subscription.
     *
     * @param string $rReasonTxt     reason for refunding
     * @param string $rReasonCode    reason code for refunding
     * @param string $transOptStatus transaction operation status 
     *                               (e.g. Refunded). 
     * @param string $url            URL used for sending request
     * 
     * @return string api response
     * @throws ServiceException if api request was not successful
     */
    private function _sendTransOptStatus(
        $rReasonTxt, $rReasonCode, $transOptStatus, $url, $raw_response = false
    ) {
        $req = new RestfulRequest($url);
        $req->setHeader('Accept', 'application/json');
        $req->setHeader('Content-Type', 'application/json');
        $req->setAuthorizationHeader($this->getToken());

        $bodyArr = array(
            'TransactionOperationStatus' => $transOptStatus,
            'RefundReasonCode' => $rReasonCode,
            'RefundReasonText' => $rReasonTxt,
        );

        $result = $req->sendHttpPut(new HttpPut(json_encode($bodyArr)));

        if ($raw_response) {
			return Service::parseApiResposeBody($result); // Note: This could throw ServiceExeption
        }		
        
        return $this->parseResult($result);
    }

    /**
     * Creates a PaymentService object with the following FQDN and following
     * access token.
     * 
     * @param string     $FQDN  fully qualified domain name 
     * @param OAuthToken $token token to use for authorization
     */
    public function __construct($FQDN, OAuthToken $token = null)
    {
        parent::__construct($FQDN, $token);
    }

    /**
     * Sends an API request for getting transaction status. 
     *
     * For getting status, a type and its value are used, where type can be one
     * of:
     * <ul>
     * <li>TransactionAuthCode</li>
     * <li>TransactionId</li>
     * <li>MerchantTransactionId</li>
     * </ul>
     *
     * @param string $type  type used for getting status
     * @param string $value the value of the specified type
     *
     * @return array api response
     * @throws ServiceException if api request was not successful
     */
    public function getTransactionStatus($type, $value, $raw_response = false)
    {
        $urlPath = '/rest/3/Commerce/Payment/Transactions/' . $type . '/' 
            . $value;

        $url = $this->getFqdn() . $urlPath;

        return $this->_getInfo($url, $raw_response);
    }

    /**
     * Sends an API request for getting subscription status. 
     *
     * For getting status, a type and its value are used, where type can be one
     * of:
     * <ul>
     * <li>SubscriptionAuthCode</li>
     * <li>MerchantTransactionId</li>
     * <li>SubscriptionId</li>
     * </ul>
     *
     * @param string $type  type used for getting status
     * @param string $value the value of the specified type
     *
     * @return array api response
     * @throws ServiceException if api request was not successful
     */
    public function getSubscriptionStatus($type, $value, $raw_response = false)
    {
        $urlPath = '/rest/3/Commerce/Payment/Subscriptions/' . $type . '/' 
            . $value;

        $url = $this->getFqdn() . $urlPath;

        return $this->_getInfo($url, $raw_response);
    }

    /**
     * Sends an API request for getting details about a subscription.
     * 
     * @param string $merchantSId merchant subscription id
     * @param string $consumerId  consumer id 
     *
     * @return array api response
     * @throws ServiceException if api request was not successful
     */
    public function getSubscriptionDetails($merchantSId, $consumerId, $raw_response = false)
    {
        $urlPath =  '/rest/3/Commerce/Payment/Subscriptions/' . $merchantSId 
            . '/Detail/' . $consumerId;

        $url = $this->getFqdn() . $urlPath;

        return $this->_getInfo($url, $raw_response);
    }

    /**
     * Sends an API request for cancelling a subscription.
     * 
     * @param string $subId      subscription id
     * @param string $reasonTxt  reason for cancelling
     * @param int    $reasonCode reason code for cancelling (defaults to 1)
     *
     * @return array api response
     * @throws ServiceException if api request was not successful
     */
    public function cancelSubscription($subId, $reasonTxt, $reasonCode = 1, $raw_response = false)
    {
        $urlPath = '/rest/3/Commerce/Payment/Transactions/' . $subId;
        $url = $this->getFqdn() . $urlPath; 
            
        $type = 'SubscriptionCancelled';
        return $this->_sendTransOptStatus($reasonTxt, $reasonCode, $type, $url, $raw_response);
    }

    /**
     * Sends an API request for refunding a subscription.
     * 
     * @param string $subId      subscription id
     * @param string $reasonTxt  reason for refunding 
     * @param int    $reasonCode reason code for refunding (defaults to 1)
     *
     * @return array api response
     * @throws ServiceException if api request was not successful
     */
    public function refundSubscription($subId, $reasonTxt, $reasonCode = 1, $raw_response = false)
    {
        $urlPath = '/rest/3/Commerce/Payment/Transactions/' . $subId;
        $url = $this->getFqdn() . $urlPath;

        $type = 'Refunded';
        return $this->_sendTransOptStatus($reasonTxt, $reasonCode, $type, $url, $raw_response);
    }

    /**
     * Sends an API request for refunding a transaction.
     * 
     * @param string $transId    transaction id
     * @param string $reasonTxt  reason for refunding 
     * @param int    $reasonCode reason code for refunding (defaults to 1)
     *
     * @return array api response
     * @throws ServiceException if api request was not successful
     */
    public function refundTransaction($transId, $reasonTxt, $reasonCode = 1, $raw_response = false)
    {
        $urlPath = '/rest/3/Commerce/Payment/Transactions/' . $transId;
        $url = $this->getFqdn() . $urlPath;

        $type = 'Refunded';
        return $this->_sendTransOptStatus($reasonTxt, $reasonCode, $type, $url, $raw_response);
    }

    /**
     * Sends an API request for getting information about a notification.
     * 
     * @param string $notificationId notification id
     *
     * @return array api response
     * @throws ServiceException if api request was not successful
     */
    public function getNotificationInfo($notificationId, $raw_response = false)
    {
        $urlPath = '/rest/3/Commerce/Payment/Notifications/' . $notificationId;
        $url = $this->getFqdn() . $urlPath;

        return $this->_getInfo($url, $raw_response);
    }

    /**
     * Sends an API request for removing the notification from the api server, 
     * thereby causing any future calls to getNotificationInfo() to fail. Also,
     * prevents the api from sending any further notifications. 
     *
     * Unless this method is called, the api will keep sending the same 
     * notification id indefinitely.
     * 
     * @param string $notificationId notification id
     *
     * @return array api response
     * @throws ServiceException if api request was not successful
     */
    public function deleteNotification($notificationId, $raw_response = false)
    {
        $urlPath = '/rest/3/Commerce/Payment/Notifications/' . $notificationId;
        $url = $this->getFqdn() . $urlPath;

        $req = new RestfulRequest($url);
        $req->setHeader('Accept', 'application/json');
        $req->setAuthorizationHeader($this->getToken());

        $result = $req->sendHttpPut(new HttpPut(json_encode(array())));
		
		if ($raw_response) {
			return Service::parseApiResposeBody($result); // Note: This could throw ServiceExeption
		}		
        
        return $this->parseResult($result);
    }
    
    /**
     * Redirects the browser to the consent flow page for creating a new 
     * transaction.
     *
     * @param string $FQDN     fully qualified domain name
     * @param string $clientId client id
     * @param Notary $notary   notary
     *
     * @return void
     */
    public static function newTransaction($FQDN, $clientId, Notary $notary, $raw_response = false)
    {
        $url = PaymentService::_getURL($FQDN, $clientId, $notary, true);
		if ($raw_response) return $url;
        header('Location: ' . $url);
    }

    /**
     * Redirects the browser to the consent flow page for creating a new 
     * subscription.
     *
     * @param string $FQDN     fully qualified domain name
     * @param string $clientId client id
     * @param Notary $notary   notary
     *
     * @return void
     */
    public static function newSubscription($FQDN, $clientId, Notary $notary, $raw_response = false)
    {
        $url = PaymentService::_getURL($FQDN, $clientId, $notary, false);
		if ($raw_response) return $url;
        header('Location: ' . $url);
    }
}
?>
