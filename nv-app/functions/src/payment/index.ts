
'use strict';

/*
curl -X POST \
  https://api-sandbox.partners.scb/partners/sandbox/v1/oauth/token \
  -H 'Content-Type: application/json' \
  -H 'accept-language: EN' \
  -H 'requestUId: 85230887-e643-4fa4-84b2-4e56709c4ac4' \
  -H 'resourceOwnerId: <Your API Key>' \
  -d '{
      "applicationKey" : "<You API Key>",
      "applicationSecret" : "<Your API Secret>",
      "authCode" : "<Authorization Code>"
  }'

        // json body sample
        json        :
            {
                    "status": {
                            "code": 1000,
                            "description": "Success"
                    },
                    "data": {
                        "accessToken": "34362373-66e8-4db0-80e5-0755b67e51f9",
                        "tokenType": "Bearer",
                        "expiresIn": 1800,
                        "expiresAt": 1550133185,
                        "refreshToken": "9e80be84-5eb7-4e8c-a885-a36ff3eb6684",
                        "refreshExpiresIn": 3600,
                        "refreshExpiresAt": 1550134985
                    }
            }
*/

export function requestAccessTokenAPI(uuid: string): Promise<String> {

    console.log("requestAccessTokenAPI() : start ....... ");
    // debug.log
    console.log("requestAccessTokenAPI() : UUID = " + uuid);

    const config = require("./paymentConfig.json");
    const request = require('request');

    const headers = {
        "Content-Type"      : "application/json",
        "accept-language"   : "EN",
        "requestUId"        : uuid,
        "resourceOwnerId"   : config.scbPay.apiKey          //"<Your API Key>"
    };

    const dataString = {
        "applicationKey"    : config.scbPay.apiKey,         //"<You API Key>"
        "applicationSecret" : config.scbPay.apiSecret       //"<Your API Secret>"
    };

    const options = {
        url         : "https://api-sandbox.partners.scb/partners/sandbox/v1/oauth/token",
        method      : "POST",
        headers     : headers,
        body        : dataString,
        json        : true
    };

    return new Promise(function (resolve, reject) {
        request(options,
            function (error: any, response: { statusCode: number; }, body: any) {
                if (!error && response.statusCode === 200) {
                    resolve(JSON.stringify(body));
                }
                else{ 
                    reject(error);
                }
            });
        console.log("requestAccessTokenAPI() : end ....... ");
    });
}

export function requestPaymentAPI(
        authorizationCode : string, 
        uuid : string,
        qrData : string,
        txnValue : string,
        billId : string
    ): Promise<String>  {

    console.log("resquestPaymentAPI() : start ....... ");

    const config = require("./paymentConfig.json");
    
    const randomize = require('randomatic');
    // Generate randomized strings of a specified length using simple character sequences. The original generate-password.
    /* randomize(pattern, length, options);
    pattern
    a: Lowercase alpha characters (abcdefghijklmnopqrstuvwxyz')
    A: Uppercase alpha characters (ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    0: Numeric characters (0123456789')
    !: Special characters (~!@#$%^&()_+-={}[];\',.)
    *: All characters (all of the above combined)
    ?: Custom characters (pass a string of custom characters to the options)
    */

    const merchantId = "165134740692203";   // <15 chard> // testing ?!

    const partnerTxnValue = merchantId + randomize('A0', 20);

    const ref1Value = "12345678901234567890";
    const ref2Value = "1";
    const ref3Value = ""; // "<Your Prefix Code>"

    // debug.log
    console.log("resquestPaymentAPI() : UUID = " + uuid
        + " ,authorization code = " + authorizationCode
        + " ,transation value   = " + txnValue
        + " ,partnerTxn value   = " + partnerTxnValue
    );

    const request = require('request');

    const headers = {
        "Content-Type"      : "application/json",
        "authorization"     : authorizationCode,        //'Bearer 30915739-27ba-4d6d-acb6-6902fc8c49d7',
        "resourceOwnerId"   : config.scbPay.apiKey ,    //"<Your API Key>"
        "requestUId"        : uuid,
        "accept-language"   : "EN"
    };

    const dataString = { 
        "qrData"                : qrData,                   //  "<QR data from scanning>",,
        "payeeBillerId"         : billId,                   //  "<Your Bi ller ID>" , Length: 15
        "transactionAmount"     : txnValue,                 //  "<Transaction Amount>", "1500.00",
        // Bank Infomations
        "reference1"            : ref1Value,
        "reference2"            : ref2Value,
        "reference3"            : ref3Value,                // "<Your Prefix Code>" ,"SCB01061900001",
        "partnerTransactionId"  : partnerTxnValue           // "<MerchantId 15 char + random generate 20 alphanumberic>"
    };

    const options = {
        url     : "https://api-sandbox.partners.scb/partners/sandbox/v1/payment/merchant/rtp/confirm",
        method  : "POST",
        headers : headers,
        body    : dataString,
        json    : true
    };

    return new Promise(function (resolve, reject) {
        request(options,
            function (error: any, response: { statusCode: number; }, body: any) {
                if (!error && response.statusCode === 200) {
                    resolve(JSON.stringify(body));
                }
                else {
                    reject(error);
                }
            });

        console.log("resquestPaymentAPI() : end ....... ");
    });
}

export function requestRefundAPI(
    authorizationCode   : string,
    uuid                : string,
    partnerTxnId        : string
): Promise<String> {
 
    const request = require('request');
    const config  = require("./paymentConfig.json");

    const headers = {
        "content-type"      : "application/json",
        "authorization"     : authorizationCode,       
        "resourceOwnerID"   : config.scbPay.apiKey,
        "requestUID"        : uuid,                     
        "accept-language"   : "EN"
    };

    const dataString = {
        "partnerTransactionId": partnerTxnId
    };

    const options = {
        url         : 'https://api-sandbox.partners.scb/partners/sandbox/v1/payment/merchant/rtp/refund',
        method      : 'POST',
        headers     : headers,
        body        : dataString,
        json        : true
    };

    return new Promise(function (resolve, reject) {
        request(options,
            function (error: any, response: { statusCode: number; }, body: any) {
                if (!error && response.statusCode === 200) {
                    resolve(JSON.stringify(body));
                }
                else {
                    reject(error);
                }
            });
    });
}




