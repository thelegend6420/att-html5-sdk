/**
 * JavaScript code can call AT&T back-end services using the methods
 * on this class.
 * @class AttApiClient
 * @singleton
 */
var AttApiClient = (function () {

    var _serverPath = "";
    var _serverUrl = "/att";

    var _onFail = function (error) { 
        var message = "Generic fail handler triggered - no specific error handler specified";
        if (typeof error == "string") {
            message = message + " - error message: " + error;
        }
        alert(message);
    };

    /**
     * Private function used to build url params
     * @ignore
     */
    function buildParams(o, separator) {
        var sep = typeof separator == "undefined" ? "&" : separator;
        var r = [];
        for (var key in o) {
            var item = o[key];
            if (item != null && typeof item == "object") {
                item = buildParams(item, ",");
            }
            item = encodeURIComponent(item);
            r.push(key + "=" + item);
        }
        return r.join(sep);
    }

    /**
     * private function used to check if required parameters have been passed
     * @param data Data to be checked
     * @param reqParams Array of required parameter names
     * @param fail Function to call when parameters have not been passed
     * @returns boolean
     * @ignore
     */
    function hasRequiredParams(data, reqParams, fail) {
        var errList = [];
        var lcKey = {};
        for (key in data) {
            lcKey[key.toLowerCase()] = key;
        }
        reqParams.forEach(function (n) {
            if (typeof lcKey[n.toLowerCase()] == "undefined") {
                errList.push("Expected Parameter: " + n);
            }
        });
        if (errList.length > 0) {
            fail(errList);
            return false;
        }
        return true;
    }

    function get(urlFragment, success, fail) {
        jQuery.get(_serverPath + _serverUrl + urlFragment).done(success).fail(typeof fail == "undefined" ? _onFail : fail);
    }

    function getWithParams(urlFragment, data, requiredParams, success, fail) {
        if (hasRequiredParams(data, requiredParams, fail)) {
            get(urlFragment + "?" + buildParams(data), success, fail);
        }
    }

    function post(urlFragment, success, fail) {
        jQuery.post(_serverPath + _serverUrl + urlFragment).done(success).fail(typeof fail == "undefined" ? _onFail : fail);
    }
    
    /**
     * private function used to post data on the query string
     * @param data Data to be checked
     * @param reqParams Array of required parameter names
     * @param success Function to call when post succeeds
     * @param fail Function to call when parameters have not been passed
     * @returns boolean
     * @ignore
     */
    function postWithParams(urlFragment, data, requiredParams, success, fail) {
        if (hasRequiredParams(data, requiredParams, fail)) {
            post(urlFragment + "?" + buildParams(data), success, fail);
        }
    }

    function postForm(fn, data, success, fail, opts) {

        var params = $.extend({
            type: "POST",
            url: _serverPath + _serverUrl + fn,
            data: data,
            processData: false,
            contentType: false
        }, opts);

        jQuery.ajax(params).done(success).fail(typeof fail == "undefined" ? _onFail : fail);
    }

    function postFormWithParams(urlFragment, params, requiredParams, formData, success, fail) {
        if (hasRequiredParams(params, requiredParams, fail)) {
            postForm(urlFragment + "?" + buildParams(params), formData, success, fail);
        }
    }

    // can't just call it 'delete', its a reserved JavaScript keyword
    function httpDelete(urlFragment, success, fail) {
        var params = {
            type: "DELETE",
            url: _serverPath + _serverUrl + urlFragment
        };
        jQuery.ajax(params).done(success).fail(typeof fail == "undefined" ? _onFail : fail);
    }
    
    function httpDeleteWithParams(urlFragment, params, requiredParams, success, fail) {
        if (hasRequiredParams(params, requiredParams, fail)) {
            httpDelete(urlFragment + "?" + buildParams(params), success, fail);
        }
    }

    function put(urlFragment, success, fail) {
        var params = {
            type: "PUT",
            url: _serverPath + _serverUrl + urlFragment
        };
        jQuery.ajax(params).done(success).fail(typeof fail == "undefined" ? _onFail : fail);
    }
    
    function putWithParams(urlFragment, params, requiredParams, success, fail) {
        if (hasRequiredParams(params, requiredParams, fail)) {
            put(urlFragment + "?" + buildParams(params), success, fail);
        }
    }

    function downloadBinaryBlob(verb, urlFragment, success, fail) {
        // currently, jQuery doesn't support binary results, so using AJAX directly
        xhr = new XMLHttpRequest();
        xhr.open(verb, _serverPath + _serverUrl + urlFragment);
        xhr.responseType = "arraybuffer";
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status < 300) {
                    var blob = new Blob([xhr.response], {type: xhr.getResponseHeader("Content-Type")});
                    success(blob);
                }
                else { // xhr.status >= 300, it failed
                    fail(String.fromCharCode.apply(null, new Uint8Array(xhr.response)));
                }
            }
        }
        xhr.send();
    }

    function eachParam(params, fn) {
        var paramArray = params.split('&');
        paramArray.forEach(function apply(param) {
            var keyValue = param.split('=');
            fn(decodeURIComponent(keyValue[0]), decodeURIComponent(keyValue[1]));
        });
    }
    
    function getQueryVariable(variable) {
        var params = window.location.search.substring(1);
        var result = undefined;
        eachParam(params, function checkParam(key, value) {
            if (key == variable) {
                result = value;
            }
        });
        return result;
    }

    var _authRetryParam = "attApiClientAuthRetryCount";
    var _authRetryParamEquals = _authRetryParam + "=";
    var _authRetryParamInit = "&" + _authRetryParamEquals + "1";
    var _authRetryFirstParamInit = "?" + _authRetryParamEquals + "1";

    function incrementAuthRetryCount(url) {
        var urlParts = url.split('?');
        if (urlParts.length == 1) {
            return url + _authRetryFirstParamInit;
        }
        var countFound = false;
        var updatedParams = [];
        eachParam(urlParts[1], function checkParam(key, value) {
            if (key == _authRetryParam) {
                value = Number(value) + 1;
            }
            updatedParams.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
        });
        updatedParams = updatedParams.join('&');
        if (!countFound) {
            updatedParams += _authRetryParamInit;
        }
        return urlParts[0] + "?" + updatedParams;
    }
    
    function htmlEncode(x) {
        return String(x)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '</br>');

    }

    function fixNullorEmpty(x, valueIfEmpty)  {
        return (typeof x == "undefined" || x == null || x == '') ? (valueIfEmpty == "undefined" ? '' : valueIfEmpty) : x;
    }
    
    return {

        /**
         * Sets default onFail function. If any service call in this library fails,
         * the library will first check if a fail callback was provided for the 
         * specific call. If one was not specified, it will next check if this default
         * fail handler has been set, and call it if available.
         * @param fail function to handle default fails for all AJAX functions
         */
        setOnFail: function (fail) {
            _onFail = fail;
        },
        /**
         * Sets server path. By default service requests are sent to
         * endpoints on the same host serving the Web app. Use this
         * method to override this behavior and send service requests
         * to a different host.
         * @param serverpath path to AJAX server
         */
        setServerPath: function (serverPath) {
            _serverPath = serverPath || "";
        },
        /**
         * Send and receive SMS messages from your application.
         *
         * @class AttApiClient.SMS
         * @singleton
         */
        SMS: {
            /**
             * Sends an SMS to a recipient
             *
             * @param {Object} data An object which may contain the following properties:
             *   @param {String} data.addresses Wireless number of the recipient(s).  This should be a comma-separated string where each item is either a phone number (including area code) or a shortcode. A phone number should be preceded by 'tel:', and a shortcode should be preceded by 'short:'. An example address string illustrating both types is "tel:4258675309,short:123456".
             *   @param {String} data.message The text of the message to send
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as follows:
             * <pre>
             *       { 'outboundSMSResponse': {
             *           'messageId': 'SMSa9b4e6580670f4cc',
             *           'resourceReference': {
             *               'resourceURL': 'https://api.att.com/sms/v3/messaging/outbox/SMSa9b4e6580670f4cc' } } }
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            sendSms: function sendSms(data, success, fail) {
                postWithParams("/sms/v3/messaging/outbox", data, ['addresses', 'message'], success, fail);
            },
            /**
             * Checks the status of a sent SMS
             *
             * @param {Object} data An object which may contain the following properties:
             *   @param {String} data.id The unique SMS ID as retrieved from the response of the sendSms method
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as follows:
             * <pre>
             *       {
             *         "DeliveryInfoList": {
             *           "DeliveryInfo": [
             *             {
             *               "Id": "msg0",
             *               "Address": "tel:4252832032",
             *               "DeliveryStatus": "DeliveredToTerminal"
             *             }
             *           ],
             *           "ResourceUrl": "https://api.att.com/sms/v3/messaging/outbox/SMSa9b151e448e820b4"
             *         }
             *       }
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            smsStatus: function smsStatus(data, success, fail) {
                if (hasRequiredParams(data, ["id"], fail)) {
                    jQuery.get(_serverPath + _serverUrl + "/sms/v3/messaging/outbox/" + data["id"]).success(success).fail(typeof fail == "undefined" ? _onFail : fail);
                }
            },
            /**
             * Gets a list of SMSs sent to the application's short code
             *
             * @param {Object} data An object which may contain the following properties:
             *   @param {Number} data.shortcode ShortCode/RegistrationId to receive messages from.
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as follows:
             * <pre>
             *       {
             *         "InboundSmsMessageList": {
             *           "InboundSmsMessage": [],
             *           "NumberOfMessagesInThisBatch": "0",
             *           "ResourceUrl": "https://api.att.com/sms/v3/messaging/inbox/48507076",
             *           "TotalNumberOfPendingMessages": "0"
             *         }
             *       }
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            getSms: function getSms(data, success, fail) {
                if (hasRequiredParams(data, ["shortcode"], fail)) {
                    jQuery.get(_serverPath + _serverUrl + "/sms/v3/messaging/inbox/" + data["shortcode"]).success(success).fail(typeof fail == "undefined" ? _onFail : fail);
                }
            }
        },
        /**
         * Send and receive MMS messages from your application
         *
         * @class AttApiClient.MMS
         * @singleton
         */
        MMS: {
            /**
             * Sends an MMS to a recipient
             *
             * @param {Object} params An object which may contain the following properties:
             *   @param {String} params.addresses Wireless number of the recipient(s).   This should be a comma-separated string where each item is either a phone number (including area code) or a shortcode. A phone number should be preceded by 'tel:', and a shortcode should be preceded by 'short:'. An example address string illustrating both types is "tel:4258675309,short:123456".
             *   @param {String} params.message The text of the message to send
             *   @param {String} params.fileId (optional) The name of the file on the server that should be attached to the message
             * @param (FormData) formData attachments to be included with the MMS message - pass null if there are no attachments
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as follows:
             * <pre>
             *       {
             *         "outboundMessageResponse": {
             *           "messageId": "MMSa9b612d714fc76f5",
             *           "resourceReference": {
             *             "resourceURL": "https://api.att.com/mms/v3/messaging/outbox/MMSa9b612d714fc76f5"
             *           }
             *         }
             *       }
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            sendMms: function sendMms(params, formData, success, fail) {
                postFormWithParams("/mms/v3/messaging/outbox", params, ['addresses', 'message'], formData, success, fail);
            },
            
            /**
             * Checks the status of a sent MMS
             *
             * @param {Object} data An object which may contain the following properties:
             *   @param {String} data.id The unique MMS ID as retrieved from the response of the sendMms method
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as follows:
             * <pre>
             *       {
             *         "DeliveryInfoList": {
             *           "DeliveryInfo": [
             *             {
             *               "Id": "msg0",
             *               "Address": "tel:4252832032",
             *               "DeliveryStatus": "DeliveredToTerminal"
             *             }
             *           ],
             *           "ResourceUrl": "https://api.att.com/mms/v3/messaging/outbox/MMSa9b612d714fc76f5"
             *         }
             *       }
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            mmsStatus: function mmsStatus(data, success, fail) {
                if (hasRequiredParams(data, ["id"], fail)) {
                    jQuery.get(_serverPath + _serverUrl + "/mms/v3/messaging/outbox/" + data["id"]).success(success).fail(typeof fail == "undefined" ? _onFail : fail);
                }
            }
        },

        /**
         * Get information about an AT&T device.
         *
         * @class AttApiClient.DeviceCapabilities
         * @singleton
         */
        DeviceCapabilities: {
            /**
             * Get detailed information about the AT&T device calling this method.
             * Refer to the API documentation at http://developer.att.com for more
             * information about the specific data that is returned.
             *
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object containing detailed device information, formatted as follows:
             * <pre>
             *       {
             *         "DeviceInfo": {
             *           "DeviceId": {
             *             "TypeAllocationCode": "357288042"
             *           },
             *           "Capabilities": {
             *             "Name": "SGH-i727",
             *             "Vendor": "SAM",
             *             "Model": "SGH-i727",
             *             "FirmwareVersion": "i727UCKJI2",
             *             "UaProf": "Not Found",
             *             "MmsCapable": "V",
             *             "AssistedGps": "Y",
             *             "LocationTechnology": "SUPLv2",
             *             "DeviceBrowser": "Not Found",
             *             "WapPushCapable": "Y"
             *           }
             *         }
             *       }
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            getDeviceInfo: function getDeviceInfo(success, fail) {
                jQuery.get(_serverPath + _serverUrl + "/Devices/Info").done(success).fail(typeof fail == "undefined" ? _onFail : fail);
            }
        },

        /**
         * Convert between written text and speech audio.
         *
         * @class AttApiClient.Speech
         * @singleton
         */
        Speech: {
            /**
             * Takes the specified audio file that is hosted on the server, and
             * converts it to text.
             *
             * Additional details for some allowed parameter values can be found
             * in the API documentation at http://developer.att.com
             *
             * @param {Object} data An object which may contain the following properties:
             *   @param {String} data.filename The server-based file to convert
             *   @param {String} [data.language="en-US"] (optional) the language of the text
             *   @param {String} data.context (optional) Type of speech, like 'Gaming' or 'QuestionAndAnswer'
             *   @param {String} data.subcontext (optional) Detailed type of speech
             *   @param {String} data.xargs (optional) Detailed conversion parameters
             *   @param {Boolean} data.chunked (optional) if any value is specified for this option, the file will be sent using HTTP chunking
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as follows:
             * <pre>
             *       {
             *         "Recognition": {
             *           "Info": {
             *             "metrics": {
             *               "audioBytes": 60480,
             *               "audioTime": 3.77999997
             *             }
             *           },
             *           "NBest": [
             *             {
             *               "Confidence": 1,
             *               "Grade": "accept",
             *               "Hypothesis": "bananas",
             *               "LanguageId": "en-US",
             *               "ResultText": "Bananas.",
             *               "WordScores": [
             *                 1
             *               ],
             *               "Words": [
             *                 "Bananas."
             *               ]
             *             }
             *           ],
             *           "ResponseId": "3a462372899874acb69387045552cfe5",
             *           "Status": "OK"
             *         }
             *       }
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            serverSpeechToText: function serverSpeechToText(data, success, fail) {
                postWithParams("/speech/v3/speechToText", data, ['filename'], success, fail);
            },

            /**
             * Takes the specified audio file that is hosted on the server, and
             * converts it to text. This 'Custom' variant of the speech-to-text
             * API also uses a custom dictionary file and grammar file, which
             * are also hosted on the SDK server.
             *
             * Additional details for some allowed parameter values can be found
             * in the API documentation at http://developer.att.com
             *
             * @param {Object} data An object which may contain the following properties:
             *   @param {String} data.filename The server-based file to convert
             *   @param {String} [data.language="en-US"] (optional) the language of the text
             *   @param {String} data.context (optional) Type of speech, like 'Gaming' or 'QuestionAndAnswer'
             *   @param {String} data.xargs (optional) Detailed conversion parameters
             *   @param {Boolean} data.chunked (optional) if any value is specified for this option, the file will be sent using HTTP chunking
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as follows:
             * <pre>
             *       {
             *         "Recognition": {
             *           "Info": {
             *             "metrics": {
             *               "audioBytes": 60480,
             *               "audioTime": 3.77999997
             *             }
             *           },
             *           "NBest": [
             *             {
             *               "Confidence": 1,
             *               "Grade": "accept",
             *               "Hypothesis": "bananas",
             *               "LanguageId": "en-US",
             *               "ResultText": "Bananas.",
             *               "WordScores": [
             *                 1
             *               ],
             *               "Words": [
             *                 "Bananas."
             *               ]
             *             }
             *           ],
             *           "ResponseId": "3a462372899874acb69387045552cfe5",
             *           "Status": "OK"
             *         }
             *       }
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            serverSpeechToTextCustom: function serverSpeechToTextCustom(data, success, fail) {
                postWithParams("/speech/v3/speechToTextCustom", data, ['filename'], success, fail);
            },

            /**
             * Takes the specified audio data and converts it to text.
             *
             * @param {Object} data An object which may contain the following properties:
             *   @param {Object} data.audioBlob a Blob object containing speech audio to be converted
             *   @param {String} [data.language="en-US"] (optional) the language of the text
             *   @param {String} data.context (optional) Type of speech, like 'Gaming' or 'QuestionAndAnswer'
             *   @param {String} data.subcontext (optional) Detailed type of speech
             *   @param {String} data.xargs (optional) Detailed conversion parameters
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as follows:
             * <pre>
             *       {
             *         "Recognition": {
             *           "Info": {
             *             "metrics": {
             *               "audioBytes": 60480,
             *               "audioTime": 3.77999997
             *             }
             *           },
             *           "NBest": [
             *             {
             *               "Confidence": 1,
             *               "Grade": "accept",
             *               "Hypothesis": "bananas",
             *               "LanguageId": "en-US",
             *               "ResultText": "Bananas.",
             *               "WordScores": [
             *                 1
             *               ],
             *               "Words": [
             *                 "Bananas."
             *               ]
             *             }
             *           ],
             *           "ResponseId": "3a462372899874acb69387045552cfe5",
             *           "Status": "OK"
             *         }
             *       }
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {String} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            speechToText: function speechToText(data, success, fail) {
                this.commonSpeechToText("", data, success, fail);
            },

            /**
             * Takes the specified audio data and converts it to text. This
             * 'Custom' variant of the speech-to-text API also uses a custom
             * dictionary file and grammar file, which are hosted on the SDK
             * server.
             *
             * @param {Object} data An object which may contain the following properties:
             *   @param {Object} data.audioBlob a Blob object containing speech audio to be converted
             *   @param {String} [data.language="en-US"] (optional) the language of the text
             *   @param {String} data.context (optional) Type of speech, like 'Gaming' or 'QuestionAndAnswer'
             *   @param {String} data.subcontext (optional) Detailed type of speech
             *   @param {String} data.xargs (optional) Detailed conversion parameters
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as follows:
             * <pre>
             *       {
             *         "Recognition": {
             *           "Info": {
             *             "metrics": {
             *               "audioBytes": 60480,
             *               "audioTime": 3.77999997
             *             }
             *           },
             *           "NBest": [
             *             {
             *               "Confidence": 1,
             *               "Grade": "accept",
             *               "Hypothesis": "bananas",
             *               "LanguageId": "en-US",
             *               "ResultText": "Bananas.",
             *               "WordScores": [
             *                 1
             *               ],
             *               "Words": [
             *                 "Bananas."
             *               ]
             *             }
             *           ],
             *           "ResponseId": "3a462372899874acb69387045552cfe5",
             *           "Status": "OK"
             *         }
             *       }
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            speechToTextCustom: function speechToTextCustom(data, success, fail) {
                this.commonSpeechToText("Custom", data, success, fail);
            },

            /**
             * @ignore
             */
            commonSpeechToText: function commonSpeechToText(urlSuffix, data, success, fail) {
                if (hasRequiredParams(data, ["audioBlob"], fail)) {
                    var fd = new FormData();
                    fd.append("speechaudio", data.audioBlob);
                    // remove audioBlob from the parameter object so it doesn't 
                    // get copied to the querystring parameters
                    delete data.audioBlob;
                    // don't pass required params because we already checked them above
                    postFormWithParams('/speech/v3/speechToText' + urlSuffix, data, [], fd, success, fail);
                }
            },

            /**
             * Takes the specified text and converts it to speech audio.
             *
             * Additional details for some allowed parameter values can be found
             * in the API documentation at http://developer.att.com
             *
             * @param {Object} data An object which may contain the following properties:
             *   @param {String} data.text the text to be converted
             *   @param {String} [data.language="en-US"] (optional) the language of the text
             *   @param {String} [data.accept="audio/amr-wb"] (optional) Desired Content-Type of the returned audio
             *   @param {String} data.xargs (optional) Detailed conversion parameters
             * @param {Function} success Success callback function
             *   @param {Object} success.audioBlob A JavaScript Blob object containing binary audio data.
             * @param {Function} failure Failure callback function
             *   @param {String} failure.info A description of the error.
             */
            textToSpeech: function textToSpeech(data, success, fail) {
                if (hasRequiredParams(data, ["text"], fail)) {
                    downloadBinaryBlob("POST", "/speech/v3/textToSpeech?" + buildParams(data), success, fail);
                }
            }
        },
        /**
         * Authorize your application to access AT&T Web services
         * on behalf of a user.
         *
         * @class AttApiClient.OAuth
         * @singleton
         */
        OAuth: {
            /**
             * Checks the SDK server to see if the user has already authorized
             * the specified services for this app.
             *
             * @param {String} scope a comma-separated list of services
             * @param {Function} success Success callback function
             *   @param {Boolean} success.authorized Set to true when the user is authorized.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            isUserAuthorized: function isUserAuthorized(scope, success, fail) {
                if (typeof fail == "undefined") {
                    fail = _onFail;
                }
                jQuery.get(_serverPath + _serverUrl + "/check?scope=" + encodeURIComponent(scope))
                    .done(function(response) { 
                        success(response.authorized);
                    }).fail(fail);
            },

            /**
             * Get the URL that will initiate the consent flow of Web pages
             * where the user can accept or reject the services that this
             * app wants to use on their behalf.
             *
             * @param {Object} data consent flow configuration options. The
             *  object may contain the following properties:    
             *   @param {String} data.scope a comma-separated list of services
             *   @param {String} data.returnUrl the page the user should end
             *      up on after the consent flow is complete. Note that if
             *      there is an error during the consent flow, this page will
             *      include an 'error' querystring parameter describing the error.
             * @param {Function} success Success callback function
             *   @param {String} success.url the requested consent flow URL
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            getUserAuthUrl: function getUserAuthUrl(data, success, fail) {
                if (typeof fail == "undefined") {
                    fail = _onFail;
                }
                if (hasRequiredParams(data, ["scope", "returnUrl"], fail)) {
                    var requestUrl = _serverPath
                        + _serverUrl
                        + "/oauth/userAuthUrl?scope=" 
                        + encodeURIComponent(data["scope"]) 
                        + "&returnUrl=" 
                        + encodeURIComponent(data["returnUrl"]);
                    jQuery.get(requestUrl)
                        .done(function(response) { success(response.url); })
                        .fail(fail);
                }
            },

            /**
             * Authorize this app to use the specified services on behalf of the user.
             * Get consent from the user if necessary. This method will navigate
             * away from the current Web page if consent is necessary.
             *
             * @param {Object} data consent flow configuration options. The
             *  object may contain the following properties:    
             *   @param {String} data.scope a comma-separated list of services
             *   @param {String} data.returnUrl (optional) the page the user
             *      should end up on after the consent flow is complete. If 
             *      this parameter isn't specified, the current page is used. 
             *      Note that if there is an error during the consent flow, 
             *      this page will include an 'error' querystring parameter 
             *      describing the error.
             *   @param {Boolean} data.skipAuthCheck (optional) when set to true, 
             *      initiates the consent flow without first checking to see if 
             *      the requested services are already authorized.
             * @param {Function} alreadyAuthorizedCallback called if the
             *      requested services are already authorized, and no page
             *      navigation is necessary.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error occurred during authorization, and the client was redirected back to the current page</b> 'info' is a string describing the authorization error.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             */
            authorizeUser: function authorizeUser(data, alreadyAuthorizedCallback, fail) {
                if (typeof fail == "undefined") {
                    fail = _onFail;
                }
                if (hasRequiredParams(data, ["scope"], fail)) {
                    if (!data["returnUrl"]) {
                        data.returnUrl = document.location.href;
                    }
                    var error = getQueryVariable("error");
                    if (typeof error != "undefined") {
                        fail(error);
                        return;
                    }
                    var redirectToAuthServer = function() {
                        var retries = getQueryVariable("attApiClientAuthRetryCount");
                        if (retries && retries > 2) {
                            fail("Too many authorization attempts - aborting");
                            return;
                        }
                        data.returnUrl = incrementAuthRetryCount(data.returnUrl);
                        AttApiClient.OAuth.getUserAuthUrl(
                            data, 
                            function(userAuthUrl) {
                                document.location.href = userAuthUrl;
                            },
                            fail
                        );
                    };
                    if (data["skipAuthCheck"]) {
                        redirectToAuthServer();
                    }
                    else {
                        AttApiClient.OAuth.isUserAuthorized(
                            data.scope,
                            function(isAuthorized) {
                                if (!isAuthorized) {
                                    redirectToAuthServer();
                                }
                                else {
                                    // if we're already authenticated, just go to the requested page
                                    if (document.location.href != data.returnUrl) {
                                        document.location.href = data.returnUrl;
                                    }
                                    else {
                                        alreadyAuthorizedCallback();
                                    }
                                }
                            },
                            fail
                        );
                    }
                }
            }
        },

        /**
         * Send and receive messages from a user's AT&T inbox.
         *
         * @class AttApiClient.InAppMessaging
         * @singleton
         */
        InAppMessaging: {
            /**
             * Create an index cache for the user's message inbox. Some inbox operations require
             * an existing index cache.
             *
             * @param {Function} success Success callback function
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            createMessageIndex: function createMessageIndex(success, fail) {
                post("/myMessages/v2/messages/index", success, fail);
            },

            /**
             * Get the current information about the user's inbox cache. This includes
             * whether the cache is initialized (if not, call createMessageIndex), and
             * what the current state is (if you want to see if anything changed before
             * calling getMessageDelta).
             *
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as follows:
             * <pre>
             *       {
             *         "messageIndexInfo": {
             *           "status":"INITIALIZED",
             *           "state":"1388102635555",
             *           "messageCount":164
             *         }
             *       }
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            getMessageIndexInfo: function getMessageIndexInfo(success, fail) {
                get("/myMessages/v2/messages/index/info", success, fail);
            },

            /**
             * Given a specified previous state, this method returns all the inbox
             * changes that occurred since that point, as well as returning a new
             * state marker for the current inbox.
             *
             * @param {String} state represents a specific prior inbox state
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as follows:
             * <pre>
             *       {
             *           "deltaResponse":{
             *               "state":"1388102635555",
             *               "delta": [
             *                   {
             *                       "adds": [
             *                           {
             *                               "messageId": "t123",
             *                               "isUnread": false
             *                           },
             *                           {
             *                               "messageId": "t456",
             *                               "isUnread": false
             *                           }
             *                       ],
             *                       "deletes": [
             *                           {
             *                               "messageId": "t789",
             *                               "isUnread": false
             *                           }
             *                       ],
             *                       "type": "TEXT",
             *                       "updates": [
             *                           {
             *                               "messageId": "t222",
             *                               "isUnread": false
             *                           },
             *                           {
             *                               "messageId": "t223",
             *                               "isUnread": false
             *                           }
             *                       ]
             *                   },
             *                   {
             *                       "adds": [
             *                       ],
             *                       "deletes": [
             *                       ],
             *                       "type": "MMS",
             *                       "updates": [
             *                       ]
             *                   }
             *               ]
             *           }
             *       } 
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            getMessageDelta: function getMessageDelta(state, success, fail) {
                get("/myMessages/v2/delta?state=" + encodeURIComponent(state), success, fail);
            },

            /**
             * Updates attributes (isUnread, isFavorite) on an existing message.
             *
             * @param {Object} data request parameters
             *   @param {String} data.id the ID of the message to be updated
             *   @param {Boolean} data.isUnread (optional) the new unread value for the message
             *   @param {Boolean} data.isFavorite (optional) the new favorite value for the message
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as follows:
             * <pre>
             *       {
             *           "message": {
             *               "isUnread":true
             *           }
             *       } 
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            updateMessage: function updateMessage(data, success, fail) {
                if (hasRequiredParams(data, ["id"], fail)) {

                    var attributes = {};
                    ['isUnread', 'isFavorite'].forEach(function(name) {
                        if (data.hasOwnProperty(name)) { attributes[name] = data[name]; }
                    });

                    jQuery.ajax({
                        url: _serverPath + _serverUrl + "/myMessages/v2/messages/" + encodeURIComponent(data.id),
                        type: "PUT",
                        processData: false,
                        data: JSON.stringify(attributes)
                    }).done(success).fail(typeof fail == "undefined" ? _onFail : fail);
                }
            },

            /**
             * Updates attributes (isUnread, isFavorite) for multiple messages.
             *
             * @param {Array} messages a list of messages and the associated 
             *        attributes to be updated. The objects in the array have 
             *        a required 'id' property, and optional 'isUnread' and 
             *        'isFavorite' properties.
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as follows:
             * <pre>
             *       {
             *           "messages": [
             *               {
             *                   "messageId":"a123",
             *                   "isUnread":true
             *               },
             *               {
             *                   "messageId":"b456",
             *                   "isUnread":true
             *               }
             *           ]
             *        }
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            updateMessages: function updateMessages(messages, success, fail) {
                msgJson = { messages: messages }
                jQuery.ajax({
                    url: _serverPath + _serverUrl + "/myMessages/v2/messages",
                    type: "PUT",
                    processData: false,
                    data: JSON.stringify(msgJson)
                }).done(success).fail(typeof fail == "undefined" ? _onFail : fail);
            },

            /**
             * Get a list of messages from the user's inbox.
             *
             * @param {Object} data query parameters. The object may contain the following properties:
             *   @param {Number} [data.count=5] (optional) the maximum number of messages to retrieve
             *   @param {Number} [data.offset=0] (optional) the index of the first message retrieved
             *   @param {String} data.messageIds (optional) a comma-seperated list of message ids listing the messages that should be returned
             *   @param {Boolean} data.isUnread (optional) filter the results to only show unread messages
             *   @param {Boolean} data.isFavorite (optional) filter the results to only show favorite messages
             *   @param {String} data.type (optional) filter the list by this comma-separated list of types (SMS, MMS)
             *   @param {String} data.keyword (optional) filter the list using this phone number; match sender for incoming messages and matches recipient for outgoing messages.
             *   @param {Boolean} data.isIncoming (optional) filter the list for incoming- or outgoing-only messages
             * @param {Function} success Success callback function
             *   @param {Object} success.messageList A JSON object enumerating the requested messages, formatted as follows:
             * <pre>
             *       {
             *           "messageList": {
             *               "messages": [
             *                   {
             *                       "messageId": "WU23435",
             *                       "from": {
             *                           "value": "+12065551212"
             *                       },
             *                       "recipients": [
             *                           {
             *                               "value": "+14255551212"
             *                           },
             *                           {
             *                               "value": "someone@att.com"
             *                           }
             *                       ],
             *                       "timeStamp": "2012-01-14T12:00:00",
             *                       "text": "This is a Group MMS text only message",
             *                       "isUnread": false,
             *                       "type": "TEXT",
             *                       "typeMetaData": {},
             *                       "isIncoming": true,
             *                   },
             *                   {
             *                       "messageId": "WU123",
             *                       "from": {
             *                           "value": "+12065551212"
             *                       },
             *                       "recipients": [
             *                           {
             *                               "value": "+14255551212"
             *                           }
             *                       ],
             *                       "timeStamp": "2012-01-14T12:01:00",
             *                       "text": "This is an SMS message",
             *                       "isUnread": false,
             *                       "type": "TEXT",
             *                       "typeMetaData": {
             *                           "isSegmented": true,
             *                           "segmentationDetails": {
             *                               "segmentationMsgRefNumber": 112,
             *                               "totalNumberOfParts": 4,
             *                               "thisPartNumber": 1
             *                           }
             *                       },
             *                   },
             *                   {
             *                       "messageId": "WU124",
             *                       "from": {
             *                           "value": "+14255551212"
             *                       },
             *                       "recipients": [
             *                           {
             *                               "value": "+14255551212"
             *                           },
             *                           {
             *                               "value": "someone@att.com"
             *                           }
             *                       ],
             *                       "timeStamp": "2012-01-14T12:00:00",
             *                       "isUnread": false,
             *                       "type": "MMS",
             *                       "typeMetaData": {
             *                           "subject": "Hello"
             *                       },
             *                       "mmsContent": [
             *                           {
             *                               "contentType": "text/plain",
             *                               "contentName": "part1.txt",
             *                               "contentUrl": "/myMessages/v2/messages/0",
             *                               "type": "TEXT"
             *                           },
             *                           {
             *                               "contentType": "image/jpeg",
             *                               "contentName": "sunset.jpg",
             *                               "contentUrl": "/myMessages/v2/messages/1",
             *                               "type": "MMS"
             *                           }
             *                       ]
             *                   }
             *               ],
             *               "offset": 50,
             *               "limit": 10,
             *               "total": 3,
             *               "state": "1388102635555",
             *               "cacheStatus": "INITIALIZED",
             *               "failedMessages": [
             *                   "S334",
             *                   "S443"
             *               ]
             *           }
             *       } 
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            getMessageList: function getMessageList(data, success, fail) {
                // optionally accept two parameters 'success' and 'fail', omitting 'data'
                if (data instanceof Function) {
                    fail = success;
                    success = data;
                    data = {};
                }
                data = data || {};
                data.count = data['count'] || 5;
                getWithParams("/myMessages/v2/messages", data, ["count"], success, fail);
            },

            /**
             * Retrieves details about the credentials, endpoint, and resource information required to set up a notification connection
             *
             * @param {String} data.queues Specifies the name of the resource the client is interested in subscribing for notifications. 
             *   The acceptable values for this parameter are:
             *   <ul><li>TEXT: The subscription to this resource provides notification related to messages stored as TEXT in the AT&T Messages inbox.</li>
             *   <li>MMS: The subscription to this resource provides notification related to messages stored as MMS in the AT&T Messages inbox.</li></ul>
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as follows:
             * <pre>
             *       {
             *           "notificationConnectionDetails": {
             *               "username":"fa26fb5c-e577-41c5-b024-150e8ed671bf",
             *               "password":"b9c1a24e-b235-4d69-95bb-81271939e017",
             *               "httpsUrl":"https://sockjs.messages.att.net/stomp",
             *               "wssUrl":"wss://sockjs.messages.att.net/stomp/websocket",
             *               "queues":
             *               {
             *                   "text":"/queue/afb193a9-c427-43c2-84d2-e4771800b6fe"
             *               }
             *           }
             *       } 
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            getNotificationConnectionDetails: function getNotificationConnectionDetails(data, success, fail) {
                getWithParams("/myMessages/v2/notificationConnectionDetails", data, ["queues"], success, fail);
            },

            /**
             * Get a single message from the user's inbox
             *
             * @param {String} id The id of the message to be retrieved
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as follows:
             * <pre>
             *       {
             *           "message": {
             *               "messageId": "WU124",
             *               "from": {
             *                   "value": "+12065551212"
             *               },
             *               "recipients": [
             *                   {
             *                       "value": "+14255551212"
             *                   },
             *                   {
             *                       "value": "someone@att.com"
             *                   }
             *               ],
             *               "timeStamp": "2012-01-14T12:00:00",
             *               "isUnread": false,
             *               "type": "MMS",
             *               "typeMetaData": {
             *                   "subject": "This is an MMS message with parts"
             *               },
             *               "isIncoming": false,
             *               "mmsContent": [
             *                   {
             *                       "contentType": "text/plain",
             *                       "contentName": "part1.txt",
             *                       "contentUrl": "/myMessages/v2/messages/0",
             *                       "type": "TEXT"
             *                   },
             *                   {
             *                       "contentType": "image/jpeg",
             *                       "contentName": "sunset.jpg",
             *                       "contentUrl": "/myMessages/v2/messages/1",
             *                       "type": "IMAGE"
             *                   }
             *               ]
             *           }
             *       } 
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            getMessage: function getMessage(id, success, fail) {
                get("/myMessages/v2/messages/" + encodeURIComponent(id), success, fail);
            },

            /**
             * Get a message attachment. Typically you will use getMessageList to
             * determine which messages have attachments, and how many there are.
             *
             * @param {Object} data request data
             *   @param {String} data.messageId which message's attachment to fetch
             *   @param {Number} data.partNum which attachment to fetch
             * @param {Function} success Success callback function
             *   @param {Object} success.binaryData a Blob object containing attachment data
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            getMessageContent: function getMessageContent(data, success, fail) {
                if (hasRequiredParams(data, ["messageId", "partNum"], fail)) {
                    downloadBinaryBlob("GET", "/myMessages/v2/messages/" + encodeURIComponent(data.messageId) + "/parts/" + encodeURIComponent(data.partNum), success, fail);
                }
            },

            /**
             * Delete a single message from the user's inbox.
             *
             * @param {String} id The id of the message to be deleted
             * @param {Function} success Success callback function
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            deleteMessage: function deleteMessage(id, success, fail) {
                httpDelete("/myMessages/v2/messages/" + encodeURIComponent(id), success, fail);
            },

            /**
             * Delete multiple messages from the user's inbox.
             *
             * @param {String} ids A comma-separated list of message ids for the messages to be
             *  deleted. An array of message id strings is also allowed.
             * @param {Function} success Success callback function
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            deleteMessages: function deleteMessages(ids, success, fail) {
                if (ids instanceof Array) {
                    ids = ids.join(",");
                }
                httpDeleteWithParams("/myMessages/v2/messages", {messageIds: encodeURIComponent(ids)}, ["messageIds"], success, fail);
            },

            /**
             * Send an SMS or MMS message as the currently-authorized user.
             *
             * @param {Object} data message parameters. The object may contain the following properties:
             *   @param {String} data.addresses the message recipients. This should be a comma-separated string where each item is either a phone number (including area code), a shortcode, or an email address. A phone number should be preceded by 'tel:', and a shortcode should be preceded by 'short:'. An example address string illustrating all three types is "demo@example.com,tel:4258675309,short:123456".
             *   @param {String} data.message the text message being sent. This parameter is optional if the message has attachments.
             *   @param {String} data.subject (optional)
             *   @param {Boolean} data.group (optional) when true, allows recipients to see each other and to reply-all
             *   @param {Object} data.attachments (optional) FormData object containing message attachments
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as shown below. Note that the id returned is for tracing use by AT&T support; it is not a valid messageId to use in the other In-App Messaging APIs.
             * <pre>
             *       {
             *           "id": "fa26fb5c-e577-41c5-b024-150e8ed671bf"
             *       } 
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            sendMessage: function sendMessage(data, success, fail) {
                var querystringParameters = {};
                if (data['addresses'] instanceof Array) {
                    data.addresses = data.addresses.join(",");
                }
                querystringParameters.addresses = data.addresses;
                if (data.hasOwnProperty('message')) {
                    querystringParameters.message = data.message;
                }
                if (data.hasOwnProperty('subject')) {
                    querystringParameters.subject = data.subject;
                }
                if (data.hasOwnProperty('group')) {
                    querystringParameters.group = data.group ? "true" : "false";
                }
                if (data.hasOwnProperty('attachments')) {
                    postFormWithParams("/myMessages/v2/messages", querystringParameters, ["addresses"], data.attachments, success, fail);
                }
                else {
                    postWithParams("/myMessages/v2/messages", querystringParameters, ["addresses"], success, fail);
                }
            }
        },

        /**
         * Get an appropriate advertisement.
         *
         * @class AttApiClient.Advertising
         * @singleton
         */
        Advertising: {
            /**
             * Get a link to an ad that matches the requested filters.
             *
             * Refer to the API documentation at http://developer.att.com for more
             * information about the specific data that is returned.
             *
             * @param {Object} data ad filters. The object may contain the properties 
             *  shown below. It may also contain additional detailed filter properties 
             *  as described in the online documentation.
             *   @param {String} data.category The type of ad; for example, 'auto' or 
             *      'medical'. The complete list of valid values can be found in the 
             *      online documentation.
             *   @param {String} data.useragent (optional) The User-Agent string of the 
             *      browser or app requesting the ad. This may be used to further filter 
             *      the available ads (for example, to size them to the requesting 
             *      device).
             *   @param {String} data.udid (optional) a unique identifier of the current 
             *      user. Must be at least 30 characters long. Should be anonymous - not 
             *      contain any personal information about the user.
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as follows:
             * <pre>
             *       {
             *           {
             *               "AdsResponse": {
             *                   "Ads": {
             *                       "Type": "thirdparty",
             *                       "ClickUrl": "http://ads.advertising.bf.sl.attcompute.com/1/redir/6dea9ca2-13fa-11e2-be80-001b21ccdb21/0/221707",
             *                       "TrackUrl": "http://bos-tapreq25.jumptap.com/a30/r/bos-tapreq25/1349997708/11468989/L",
             *                       "Text": "",
             *                       "Content":"<a href="http://ads.advertising.bf.sl.attcompute.com/1/redir/6dea9ca2-13fa-11e2-be80-001b21ccdb21/0/221707"><img src="http://i.jumptap.com/img/8749/1345061232746.jpg" alt="" width="320px" height="50px" /></a>\n<img src="http://bos-tapreq25.jumptap.com/a30/r/bos-tapreq25/1349997708/11468989/L" alt="" width="1px" height="1px" /><br />"
             *               }
             *           }
             *       }
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            getAd: function getAd(data, success, fail) {
                getWithParams("/rest/1/ads", data, ['Category'], success, fail);
            }
        },
        /**
         * Sign and encrypt payment request details.
         *
         * @class AttApiClient.Notary
         * @singleton
         */
        Notary: {
            /**
             * Converts a JSON payment request into an encrypted, signed, blob of data
             * which can be passed to the AT&T payment URLs.
             *
             * Refer to the API documentation at http://developer.att.com for more
             * information about the JSON request format required.
             *
             * @param {Object} payload the JSON payment request
             * @param {Function} success Success callback function
             *   @param {Object} success.response a JSON object containing the encrypted 
             *      payment request (under the 'SignedDocument' key) and its signature 
             *      (under the 'Signature' key).
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            signPayload: function signPayload(payload, success, fail) {
                var params = {
                    type: "POST",
                    url: _serverPath + _serverUrl + '/Security/Notary/Rest/1/SignedPayload',
                    data: payload instanceof Object ? JSON.stringify(payload) : payload,
                    processData: false
                };

                jQuery.ajax(params).done(success).fail(typeof fail == "undefined" ? _onFail : fail);
            }
        },
        /**
         * Make payments and start subscriptions.
         *
         * @class AttApiClient.Payment
         * @singleton
         */
        Payment: {
            /**
             * Create a new pending subscription and return an authorization URL that
             * will allow the user to consent and finalize it. Navigating to the URL 
             * will present pages to the user allowing them to authorize the purchase, 
             * after which they will be redirected to URL specified by the 
             * 'redirect_uri' parameter.
             *
             * Refer to the API documentation at http://developer.att.com for details on 
             * the required and optional payment properties, and their allowed values.
             *
             * @param {Object} data contains payment info, as described below:
             *   @param {String} data.amount how much each delivery of the subscription
             *      costs, rounds to 2 decimal places ("1.23", for example).
             *   @param {Number} category see online docs for valid values (for example, 
             *      use 1 for in-app purchases in a game.)    
             *   @param {String} desc short description of purchase, must be less than 
             *      128 characters.
             *   @param {String} merch_trans_id the transaction id in merchant's system, 
             *      must be unique for every purchase.
             *   @param {String} merch_prod_id specifies the product id of the item 
             *      purchased, must be less than 50 characters.
             *   @param {String} merch_sub_id_list the subscription id in the merchant's
             *      system.
             *   @param {Number} sub_recurrences the number of times the subscription
             *      will be delivered and billed.
             *   @param {String} redirect_uri the location to redirect to after the user 
             *      has authorized the new transaction.
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as follows:
             * <pre>
             *       {
             *           "url": "https://api.att.com/authorizepayment?details=stuff"
             *       } 
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in internal SDK server processing</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            createSubscriptionUrl: function createSubscriptionUrl(data, success, fail) {
                if (hasRequiredParams(data, ["amount", "category", "desc", "merch_trans_id", "merch_prod_id", "merch_sub_id_list", "sub_recurrences", "redirect_uri"], fail)) {
                    postForm("/rest/3/Commerce/Payment/Subscriptions", JSON.stringify(data), success, fail);
                }
            },

            /**
             * Create a new pending transaction and return an authorization URL that
             * will allow the user to consent and finalize it. Navigating to the URL 
             * will present pages to the user allowing them to authorize the purchase, 
             * after which they will be redirected to URL specified by the 
             * 'redirect_uri' parameter.
             *
             * Refer to the API documentation at http://developer.att.com for details on 
             * the required and optional payment properties, and their allowed values.
             *
             * @param {Object} data contains payment info, as described below:
             *   @param {String} data.amount how much the item costs, rounds to 2 decimal 
             *      places (e.g., "1.23").
             *   @param {Number} category see online docs for valid values (e.g., 
             *      use 1 for in-app purchases in a game)    
             *   @param {String} desc short description of purchase, must be less than 
             *      128 characters.
             *   @param {String} merch_trans_id the transaction id in merchant's system, 
             *      must be unique for every purchase.
             *   @param {String} merch_prod_id specifies the product id of the item 
             *      purchased, must be less than 50 characters.
             *   @param {String} redirect_uri the location to redirect to after the user 
             *      has authorized the new transaction.
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as follows:
             * <pre>
             *       {
             *           "url": "https://api.att.com/authorizepayment?details=stuff"
             *       } 
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in internal SDK server processing</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            createTransactionUrl: function createTransactionUrl(data, success, fail) {
                if (hasRequiredParams(data, ["amount", "category", "desc", "merch_trans_id", "merch_prod_id", "redirect_uri"], fail)) {
                    postForm("/rest/3/Commerce/Payment/Transactions", JSON.stringify(data), success, fail);
                }
            },

            /**
             * Get the status of a payment; for example, if it succeeded or not.
             *
             * @param {Object} data contains payment identifiers, as described below:
             *   @param {String} data.type identifies the source of the id being used;
             *      valid values include "TransactionAuthCode", "TransactionId", and 
             *      "MerchantTransactionId".
             *   @param {String} id the unique identifier of the desired payment.
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as follows:
             * <pre>
             *       {
             *           "Channel": "MOBILE_WEB",
             *           "Description": "T20120104223242088",
             *           "Currency": "USD",
             *           "TransactionType": "SINGLEPAY",
             *           "TransactionStatus": "SUCCESSFUL",
             *           "ConsumerId": "7569ad74-e2e1-4c1e-9f49-455cdccfa315",
             *           "MerchantTransactionId": "T20120104223242088",
             *           "MerchantApplicationId": "79b33cf0ddf375044d6b6dada43f7d10",
             *           "TransactionId": "3013735686002133",
             *           "OriginalTransactionId": "",
             *           "ContentCategory": "1",
             *           "MerchantProductId": "P20120104223242088",
             *           "MerchantId": "12345678-1234-1234-1234-1234567890abcdef",
             *           "Amount": "1.42",
             *           "Version": "1",
             *           "IsSuccess": "true"
             *       } 
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            getTransactionStatus: function getTransactionStatus(data, success, fail) {
                if (hasRequiredParams(data, ["type", "id"], fail)) {
                    var url = 
                        "/rest/3/Commerce/Payment/Transactions/" + 
                        encodeURIComponent(data.type) + 
                        "/" + 
                        encodeURIComponent(data.id);
                    get(url, success, fail);
                }
            },

            /**
             * Get the status of a subscription; for example, if it was successfully created or not.
             *
             * @param {Object} data contains subscription identifiers, as described below:
             *   @param {String} data.type identifies the source of the id being used;
             *      valid values include "SubscriptionAuthCode", "SubscriptionId", and 
             *      "MerchantTransactionId".
             *   @param {String} data.id the unique identifier of the desired subscription.
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as follows:
             * <pre>
             *       {
             *           "Version": "1",
             *           "IsSuccess": "true",
             *           "Amount": "1.35",
             *           "Channel": "MOBILE_WEB",
             *           "Description": "RECUR",
             *           "Currency": "USD",
             *           "SubscriptionType": "SUBSCRIPTION",
             *           "SubscriptionStatus": "SUCCESSFUL",
             *           "ConsumerId": "08660eb2-c9c4-48a6-93ea-1c440fa826e4",
             *           "MerchantTransactionId": "T20120619152559466",
             *           "MerchantApplicationId": "029c091549fd96788537c5c5cbbb94a3",
             *           "SubscriptionId": "6108486931402157",
             *           "OriginalTransactionId": "",
             *           "ContentCategory": "1",
             *           "MerchantProductId": "P20120619152559466",
             *           "MerchantId": "12345678-1234-1234-1234-1234567890abcdef",
             *           "MerchantSubscriptionId": "619152559466",
             *           "PeriodAmount": "1",
             *           "Recurrences": "99999",
             *           "SubscriptionPeriod": "MONTHLY",
             *       } 
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            getSubscriptionStatus: function getSubscriptionStatus(data, success, fail) {
                if (hasRequiredParams(data, ["type", "id"], fail)) {
                    var url = 
                        "/rest/3/Commerce/Payment/Subscriptions/" + 
                        encodeURIComponent(data.type) + 
                        "/" + 
                        encodeURIComponent(data.id);
                    get(url, success, fail);
                }
            },

            /**
             * Get details of a subscription.
             *
             * @param {Object} data contains subscription identifiers, as described below:
             *   @param {String} data.consumerId identifies user of the subscription.
             *   @param {String} data.merchantSubscriptionId the app-supplied unique identifier of the desired subscription.
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as follows:
             * <pre>
             *       {
             *           "Currency": "USD",
             *           "Status": "ACTIVE",
             *           "CreationDate": "2011-06-13T16:11:16.000+0000",
             *           "GrossAmount": 0.05,
             *           "Recurrences": 99999,
             *           "IsActiveSubscription": true,
             *           "CurrentStartDate": "2011-06-13T16:11:16.000+0000",
             *           "CurrentEndDate": "2011-07-13T16:11:16.000+0000",
             *           "RecurrencesLeft": 2147483647,
             *           "Version": "1",
             *           "IsSuccess": true
             *       } 
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            getSubscriptionDetail: function getSubscriptionDetail(data, success, fail) {
                if (hasRequiredParams(data, ["consumerId", "merchantSubscriptionId"], fail)) {
                    var url = 
                        "/rest/3/Commerce/Payment/Subscriptions/" + 
                        encodeURIComponent(data.merchantSubscriptionId) +
                        "/Detail/" + 
                        encodeURIComponent(data.consumerId);
                    get(url, success, fail);
                }
            },

            /**
             * Refund a payment or subscription.
             *
             * @param {Object} data contains the refund details, as described below:
             *   @param {String} data.transactionId identifies the transaction being refunded.
             *   @param {Number} data.reasonId a numeric code describing the reason for the refund.
             *   @param {String} data.reasonText written notes with additional details about the reason for the refund.
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as follows:
             * <pre>
             *       {
             *           "IsSuccess": true,
             *           "Version": "1",
             *           "TransactionId": "MCKMCK6999352834302185",
             *           "TransactionStatus": "SUCCESSFUL",
             *           "OriginalPurchaseAmount": "0.01",
             *           "CommitConfirmationId": ""
             *       } 
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            refundTransaction: function refundTransaction(data, success, fail) {
                data.state = 'Refunded';
                putWithParams("/rest/3/Commerce/Payment/Transactions", data, ["transactionId", "reasonId", "reasonText"], success, fail);
            },

            /**
             * Cancel a subscription.
             *
             * @param {Object} data contains the cancellation details, as described below:
             *   @param {String} data.transactionId identifies the subscription being canceled.
             *   @param {Number} data.reasonId a numeric code describing the reason for the cancellation.
             *   @param {String} data.reasonText written notes with additional details about the reason for the cancellation.
             * @param {Function} success Success callback function
             *   @param {Object} success.response A JSON object formatted as follows:
             * <pre>
             *       {
             *           "IsSuccess": true,
             *           "Version": "1",
             *           "TransactionId": "MCKMCK6999352834302185",
             *           "TransactionStatus": "SUCCESSFUL",
             *           "OriginalPurchaseAmount": "0.01",
             *           "CommitConfirmationId": ""
             *       } 
             * </pre>
             *   @param {String} success.successString The string 'success'
             *   @param {Object} success.jqXHR The jQuery object used to send the network request.
             * @param {Function} failure Failure callback function
             *   @param {Object} failure.info A description of the error. Depending on the source of the error, the contents of this object may differ, as follows:
             * <ol>
             * <li><b>An error detected in client processing (typically, when missing parameters are detected)</b> 'info' is an array of strings, each an error description.</li>
             * <li><b>An error in the connection between client and SDK server</b> 'info' is the jQuery object used to send the network request (jqXHR). This is structurally similar to a native XMLHttpRequest object; the 'status' property gives the HTTP status code, and the 'response' property may contain any additional detail.</li>
             * <li><b>An error in either internal SDK server processing or in network communication between the SDK server and the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'status' property will be a 4xx status code. The 'response' property is a JSON object whose 'error' property is a string describing the error.</li>
             * <li><b>An error from the AT&T back-end services</b> 'info' is a jqXHR as described above. The 'response' property is a JSON object whose 'error' property is another JSON object - the structured error object returned by the back-end. Please refer to the online developer documentation for possible fields in this error object; one example is shown below.
             * <pre>
             * {'error': {
             *     'RequestError': {
             *         'ServiceException': {
             *             'MessageId' 'SVC0004',
             *             'Text': 'No valid addresses provided in the message part %1',
             *             'Variables': 'Address' } } } }
             * </pre>
             * </li>
             * </ol>
             *   @param {String} failure.errorString The string 'error'
             *   @param {Object} failure.statusText A text description of the HTTP status code; for example 'Not Found' (404) or 'Access Denied' (403)
             */
            cancelSubscription: function cancelSubscription(data, success, fail) {
                data.state = 'SubscriptionCancelled';
                putWithParams("/rest/3/Commerce/Payment/Transactions", data, ["transactionId", "reasonId", "reasonText"], success, fail);
            }
        },

        /**
         * Utility methods.
         *
         * @class AttApiClient.util
         * @singleton
         */
        util: {
            /**
             *  Given a binary text blob, returns a text node by callback function.
             *
             *  @param {Object} blob Blob object to be converted
             *  @param {Function} callback Callback function
             */
            blobToText: function blobToText(blob, callback) {
                var reader = new FileReader();
                reader.readAsText(blob);
                reader.onload = function () {
                    callback(htmlEncode(reader.result));
                };
            },

            /**
             * @private
             */
            padIfNotNullOrEmpty: function padIfNotNullOrEmpty(before, x, after, valueIfNull) {
                return typeof x == 'undefined' || x == null || x == '' ? fixNullorEmpty(valueIfNull) : before + x + fixNullorEmpty(after);
            },
            htmlEncode: htmlEncode,
            /**
             *
             * Given a binary image blob, return an url by callback function
             *
             * @param {Function} success Callback success
             * @param {Function} fail Callback failure function
             */
            blobToImage: function blobToImage(blob, success, fail) {
                
                var imageType = /image.*/;
                if (blob.type.match(imageType)) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        success(reader.result);
                    }
                    reader.readAsText(blob); 
                } else {
                    fail("Unsupported format");
                }
            },

            /**
             *
             * Given a phone number, returns true or false if the phone number is in a valid format.
             *
             * @param {String} phone the phone number to validate
             * @return {Boolean}
             */
            isValidPhoneNumber: function isValidPhoneNumber(phone) {
                return (/^(1?([ -]?\(?\d{3})\)?[ -]?)?(\d{3})([ -]?\d{4})$/).test(phone);
            },
            /**
             * Given an email, returns true or false if the it is in a valid format.
             * @param {String} email the email to validate
             * @return {Boolean}
             */
            isValidEmail: function isValidEmail(email) {
                return (/^[a-zA-Z]\w+(.\w+)*@\w+(.[0-9a-zA-Z]+)*.[a-zA-Z]{2,4}$/i).test(email);
            },
            /**
             * Given a shortcode, returns true or false if the it is in a valid format.
             * @param {String} shortcode the short code to validate
             * @return {Boolean}
             */
            isValidShortCode: function isValidShortCode(shortcode) {
                return (/^\d{3,8}$/).test(shortcode);
            },
            /**
             * Given an address will determine if it is a valid phone, email or shortcode.
             * @param address {String} the address to validate
             * @returns {Boolean}
             */
            isValidAddress: function isValidAddress(address) {
                return AttApiClient.util.isValidPhoneNumber(address) || AttApiClient.util.isValidEmail(address) || AttApiClient.util.isValidShortCode(address);
            },

            /**
             * Given a phone number, returns the phone number with all characters, other than numbers, stripped
             * @param {String} phone the phone number to normalize
             * @return {String} the normalized phone number
             */
            normalizePhoneNumber: function normalizePhoneNumber(phone) {
                phone = phone.toString();
                return phone.replace(/[^\d]/g, "");
            },

            /**
             * Given a valid address, if it is a phone number will return the normalized phone number. See {@link AttApiClient.util#normalizePhoneNumber} 
             * Otherwise, returns the address as it is.
             * @param address {String} the address to normalize.
             * @returns {String} the normalize phone number or address.
             */
            normalizeAddress: function normalizeAddress(address) {
                address = address.toString();
                if (AttApiClient.util.isValidPhoneNumber(address)) {
                    address = AttApiClient.util.normalizePhoneNumber(address);
                }
                return address;
            },

            /**
             * This helper routine will return a properly formatted URL to the SDK routine which will provide the source content (image, text, etc)
             * for the specified message number and part. 
             * @param {String} messageId The message id of the message
             * @param {String} partNumber The part number to retrieve
             * @return {String} The source URL which returns the content of the message part along with appropriate content headers.
             */
            getContentSrc: function getContentSrc(messageId, partNumber) {
                return "/att/content?messageId=" + messageId + "&partNumber=" + partNumber;
            }
        }
    }
}());
