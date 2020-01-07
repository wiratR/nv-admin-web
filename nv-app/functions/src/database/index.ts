'use strict';

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as payments from '../payment';

function updateTxnStatus( txName : String, status : String ) : void {

    admin.database().ref('tx_usage')
        .parent?.child('/tx_usage/' + txName + '/txn_status')
        .set(status, function (error) {
            if (error) {
                console.log("updateTxnStatus() : failed with code " + error);
            }
        });
}

export async function addRefundMessage ( 
        partnerTransactionValue : string,
        txnAmountValue : string
    ) : Promise<void> {
    console.log("addRefundMessage() : partner TxnId = " + partnerTransactionValue
        + " ,refund Value = " + txnAmountValue
    );
    // current date
    const date = new Date();
    const txName = "TP_" + date.getFullYear()
        + (date.getMonth() + 1).toString().padStart(2, "0")
        + date.getDate().toString().padStart(2, "0")
        + "_"
        + (date.getHours() < 10 ? '0' : '') + date.getHours()
        + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes()
        + (date.getSeconds() < 10 ? '0' : '') + date.getSeconds()
        + "_000B_dat";
    
    await admin.database().ref('/tx_usage/' + txName).set({
        device_id       : "127.0.0.1",
        device_type     : "10",
        location: {
            accuracy    : "0",
            latitude    : "0",
            longitude   : "0"
        },
        location_code   : "0",
        payment: {
            partnerTransactionId    : partnerTransactionValue,
            transactionAmount       : txnAmountValue
        },
        txn_date: date.getFullYear()
            + "/" + (date.getMonth() + 1).toString().padStart(2, "0")
            + "/" + date.getDate().toString().padStart(2, "0"),
        txn_status: "0",
        txn_time: (date.getHours() < 10 ? '0' : '') + date.getHours()
            + ":" + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes()
            + ":" + (date.getSeconds() < 10 ? '0' : '') + date.getSeconds(),
        txn_type: "refund"
    });

}

// Take the text parameter passed to this HTTP endpoint and insert it into the
// sample url ::: /paymentAddMessage?qrData=''&payValue=''
export const addMessage = functions.https
    .onRequest(async (req, res) => {
/*
        for (const key in req.query){
            console.log("addMessage() : key " + key + " data " + req.query[key]);
        }
*/
        const paymentCodeId: any = req.query.qrData;
        let paymentValue: any = req.query.payValue;

        console.log("addMessgae() : QR data test = " + paymentCodeId + " , value = " + paymentValue);

        if( paymentValue === 'undefined'){
            // set default 
            paymentValue = '20.00';
        }

        // current date
        const date = new Date();
        const txName = "TP_" + date.getFullYear()
            + (date.getMonth() + 1).toString().padStart(2, "0")
            + date.getDate().toString().padStart(2, "0")
            + "_"
            + (date.getHours() < 10 ? '0' : '') + date.getHours()
            + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes()
            + (date.getSeconds() < 10 ? '0' : '') + date.getSeconds()
            + "_000A_dat";

        await admin.database().ref('/tx_usage/' + txName).set({
            device_id: "192.168.0.0",
            device_type: "15",
            location: {
                accuracy: "36",
                latitude: "13.6545973",
                longitude: "100.6042252"
            },
            location_code: "0",
            payment: {
                passenger_count : "1",
                passenger_id    : paymentCodeId,
                type            : "1",
                value           : paymentValue,
                bill_id         : "123456789012345"
            },
            txn_date: date.getFullYear()
                + "/" + (date.getMonth() + 1).toString().padStart(2, "0")
                + "/" + date.getDate().toString().padStart(2, "0"),
            txn_status: "0",
            txn_time: (date.getHours() < 10 ? '0' : '') + date.getHours()
                + ":" + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes()
                + ":" + (date.getSeconds() < 10 ? '0' : '') + date.getSeconds(),
            txn_type: "payment"
        });
        // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
        res.redirect(303, admin.database().ref('/tx_usage/' + txName).toString());
        // ----------------------------------------------------------------
        // ----------------------------------------------------------------
        console.log("addMessage() : done to add new " + txName);
    });

// prepare when create new tx_usage will call paument API
export const processTxUsage = functions.database
    .ref("/tx_usage/{pushId}")
    .onCreate(async (snapshot, context) => {
        console.log("processTxUsage() : txn name '" + context.params.pushId + "'");
        // read form database are done
        const paymentCode = snapshot?.child("payment/passenger_id").val();
        const paymentValue = snapshot?.child("payment/value").val();
        const paymentBillId = snapshot?.child("payment/bill_id").val();
        const txnType = snapshot?.child("txn_type").val();

        console.log("processTxUsage() : payment Code '" + paymentCode
            + "' ,payment Value '" + paymentValue
            + "' ,payment bill id '" + paymentBillId
            + "' ,txn type '" + txnType
            + "'"
        );

        // 1. Request Access Token API
        let responseObj: any;
        try {
            responseObj = await payments.requestAccessTokenAPI();
        } catch (error) {
            console.error(error);
        }

        console.log("processTxUsage() : response object '" + responseObj + "'");

        const obj = JSON.parse(responseObj);

        if (obj.status.code === 1000) {

            const authCode = "Bearer " + obj.data.accessToken;
            console.log("processTxUsage() : get authenitaction Code = " + authCode);

            switch (txnType) {
                case "payment" : {
//////////////////////////////////////////////////////////////////////////////////////////
// ---------------------------- precess Payment API ----------------------------------- //
                    let responsePaymentObj: any;
                    try {
                        responsePaymentObj = await payments.requestPaymentAPI(
                            authCode,
                            paymentCode,
                            paymentValue,
                            paymentBillId
                        );
                    } catch (error) {
                        console.log("processTxUsage() : requestPaymentAPI failed = " + error);
                    }
                    // handle return undefined
                    if (typeof responsePaymentObj === "undefined") {
                        console.log("processTxUsage() :  " + paymentCode + " is failed.");
                        // update transaction "status to error."
                        updateTxnStatus(context.params.pushId, "error");
                    } else {
                        //console.log("processTxUsage() : response payment object '" + responsePaymentObj + "'");
                        const paymentObj = JSON.parse(responsePaymentObj);
                        //  Business status code sucess ............. 
                        if (paymentObj.status.code === 1000) {
                            // store response message to database firestore
                            await admin.firestore()
                                .collection('txn_usage').doc(context.params.pushId).set(
                                    paymentObj
                                );
                            // update transaction "status to sucess."
                            updateTxnStatus(context.params.pushId, "sucess");
                            // add to new RDS for auto process refund API
                            await admin.database().ref('/refund_request/' + context.params.pushId).set({
                                state: "initial",
                                type: "scbAPI",
                                partnerTransactionId    : paymentObj.data.partnerTransactionId,
                                transactionAmount       : paymentObj.data.transactionAmount
                            });

                        } else {
                            // update transaction "status to reject."
                            updateTxnStatus(context.params.pushId, "reject");
                            console.log("processTxUsage() : payment failed code " + paymentObj.status.code);
                            console.log("processTxUsage() : description " + paymentObj.status.description);
                        }
                    }       
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
                }
                break;
                case "refund" : {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ------------------------------------- precess Refund API ------------------------------------------------- //
                    const partnerTransactionIdRef = snapshot?.child("payment/partnerTransactionId").val();
                    /*
                    {
                        payment : {
                            partnerTransactionId : "",
                            transactionAmount : "",
                            transactionDateTime : ""
                        }
                    }
                    */
                    let responseRefundObj: any;
                    try {
                        responseRefundObj = await payments.requestRefundAPI(
                            authCode,
                            partnerTransactionIdRef
                        );
                    } catch (error) {
                        console.log("processTxUsage() : requestPaymentAPI failed = " + error);
                    }
                    // handle return undefined
                    if (typeof responseRefundObj === "undefined") {
                        // update transaction "status to error."
                        updateTxnStatus(context.params.pushId, "error");
                    } else {
                        const refundObj = JSON.parse(responseRefundObj);
                        //  Business status code sucess ............. 
                        if (refundObj.status.code === 1000) {
                            // store response message to database firestore
                            await admin.firestore()
                                .collection('txn_usage').doc(context.params.pushId).set(
                                    refundObj
                                );
                            // update transaction "status to sucess."
                            updateTxnStatus(context.params.pushId, "sucess");
                            // update request_refund 'initial' to 'sucess'
                            
                        } else {
                            // update transaction "status to reject."
                            updateTxnStatus(context.params.pushId, "reject");
                            console.log("processTxUsage() : payment failed code " + refundObj.status.code);
                            console.log("processTxUsage() : description " + refundObj.status.description);
                        }
                    }       
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                }
                break;
                default :
                    console.log("processTxUsage() : get authenitaction Code = " + authCode);
                break;
            }

        } else {
            //console.log("processTxUsage() : response object '" + responseObj + "'");
            // Access Authorization Errors
            // will be re-trying ?? 
            console.log("processTxUsage() : authen accessToken failed code " + obj.status.code);
            console.log("processTxUsage() : description " + obj.status.description);
            updateTxnStatus(context.params.pushId, "error");
        }

        return null;

    });

    /*
export const processTxRefund = functions.database
    .ref("/refund_request/{txnId}")
    .onCreate(async (snapshot, context) => {

        console.log("processTxnRefund() : partnerTransactionId '" + context.params.pushId + "'");
        // read form database are done
        const state = snapshot?.child("state").val();
        console.log("processTxnRefund() : get state = " + state);
        
        if (state === "initial"){
            // generate UUID and save to database
            const uuidv1 = require('uuid/v1');
            const paymentUUID = uuidv1();          

            // add the UUID to database
            admin.database().ref('refund_request')
                .parent?.child('/refund_request/' + context.params.pushId + '/uuid_token')
                .set(paymentUUID, function (error) {
                    if (error) {
                        console.log("processTxnRefund() : set UUID failed with code " + error);
                    }
                });

            // call
        }else{
            console.log("processTxnRefund() : the txnId " + context.params.pushId + " is not request to refund." );
        }
        return null;
    });
    */