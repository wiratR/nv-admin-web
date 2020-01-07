
'use strict';

export function requestAccessTokenAPI(): Promise<String> {

    console.log("requestAccessTokenAPI() : start ...... ");

    const config = require("./paymentConfig.json");
    const request = require('request');
    const uuidv1 = require('uuid/v1');
    
    const headers = {
        "Content-Type"      : "application/json",
        "accept-language"   : "EN",
        "requestUId"        : uuidv1(),
        "resourceOwnerId"   : config.scbPay.apiKey          // Your API Key add './paymentConfig.json'
    };

    const dataString = {
        "applicationKey"    : config.scbPay.apiKey,         // You API Key add './paymentConfig.json'
        "applicationSecret" : config.scbPay.apiSecret       // Your API Secret './paymentConfig.json
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
            function (error: any, response: { statusCode: number }, body: any) {
                console.log("requestAccessTokenAPI() : get a https response status code = " + response.statusCode);
                console.log("requestAccessTokenAPI() : get a body status code = " + body.status.code);
                console.log("requestAccessTokenAPI() : get a body status description = " + body.status.description);
                if (!error && response.statusCode === 200) {
                    resolve(JSON.stringify(body));
                }
                else{ 
                    if( error === null ){
                        reject(JSON.stringify(body));
                    }else{
                        reject(error);
                    }
                }
            });
        console.log("requestAccessTokenAPI() : end ...... ");
    });
}

export function requestPaymentAPI(
        authorizationCode : string, 
        qrData  : string,
        txnValue : string,
        billId : string
    ): Promise<String>  {

    console.log("resquestPaymentAPI() : start ...... ");

    const config = require("./paymentConfig.json");
    const randomize = require('randomatic');

    const partnerTxnValue   = config.scbPay.merchardId + randomize('A0', 20);

    // debug.log
    console.log("resquestPaymentAPI() : authorization code = " + authorizationCode
        + " ,qrData = " + qrData
        + " ,transation value   = " + txnValue
        + " ,partnerTxn value   = " + partnerTxnValue
        + " ,billId = " + billId
    );

    const request = require('request');
    const uuidv1 = require('uuid/v1');

    const headers = {
        "Content-Type"          : "application/json",
        "accept-language"       : "EN",
        "requestUId"            : uuidv1(),
        "resourceOwnerId"       : config.scbPay.apiKey,         // Your API Key add './paymentConfig.json'
        "authorization"         : authorizationCode,            //'Bearer <accesToken>',
    };

    const dataString = { 
        "qrData"                : qrData,                       //  <QR data from scanning>,
        "payeeTerminalNo"       : config.scbPay.terminalId,
        "payeeBillerId"         : config.scbPay.merchardId,     //  <Your Bi ller ID> , Length: 15
        "transactionAmount"     : txnValue,                     //  <Transaction Amount>, "1500.00",
        "transationCurrency"    : "THB",
        "reference1"            : billId + randomize('0',5),
        "reference2"            : randomize('0', 5) + billId,
        "reference3"            : config.scbPay.prefixCode,     // <Your Prefix Code>,"SCB01061900001",
        "partnerTransactionId"  : partnerTxnValue               // <MerchantId 15 char + random generate 20 alphanumberic>
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
                console.log("resquestPaymentAPI() : get a https response status code = " + response.statusCode);
                console.log("resquestPaymentAPI() : get a body status code = " + body.status.code);
                console.log("resquestPaymentAPI() : get a body status description = " + body.status.description);
                if (!error && response.statusCode === 200) {
                    resolve(JSON.stringify(body));
                }
                else {
                    if(error === null){
                        reject(JSON.stringify(body));
                    }else{
                        reject(error);
                    }
                }
            });
        console.log("resquestPaymentAPI() : end ...... ");
    });
}

export function requestRefundAPI(
    authorizationCode   : string,
    partnerTxnId        : string
): Promise<String> {

    console.log("requestRefundAPI() : start ...... ");
 
    // debug.log
    console.log("requestRefundAPI() : authorization code = " + authorizationCode
        + " ,partnerTxn value   = " + partnerTxnId
    );

    const request = require('request');
    const config  = require("./paymentConfig.json");
    const uuidv1 = require('uuid/v1');

    const headers = {
        "content-type"      : "application/json",
        "authorization"     : authorizationCode,       
        "resourceOwnerID"   : config.scbPay.apiKey,
        "requestUID"        : uuidv1(),                     
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
                console.log("requestRefundAPI() : get a https response status code = " + response.statusCode);
                console.log("requestRefundAPI() : get a body status code = " + body.status.code);
                console.log("requestRefundAPI() : get a body status description = " + body.status.description);
                if (!error && response.statusCode === 200) {
                    resolve(JSON.stringify(body));
                }
                else {
                    if (error === null) {
                        reject(JSON.stringify(body));
                    } else {
                        reject(error);
                    }
                }
            });
        console.log("requestRefundAPI() : end ...... ");
    });
}




