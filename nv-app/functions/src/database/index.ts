'use strict';

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as payments from '../payment';

// Take the text parameter passed to this HTTP endpoint and insert it into the
export const addMessage = functions.https
    //exports.addMessage = functions.https
    .onRequest(async (req, res) => {
        const paymentcodeId = req.query.toString();
        console.log("addMessgae() : start write test " + paymentcodeId);
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
                passenger_count: "1",
                passenger_id: "1231536512",
                type: "1",
                value: "20.00",
                bill_id: "123456789012345"
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
        const paymentBillId = snapshot?.child("payment/bill_id").val();;

        console.log("processTxUsage() : payment Code '" + paymentCode
            + "' ,payment Value '" + paymentValue
            + "' ,payment bill id '" + paymentBillId
            + "'"
        );

        // generate UUID and save to database
        const uuidv1 = require('uuid/v1');
        const paymentUUID = uuidv1();           // 
        // add the UUID to database
        admin.database().ref('tx_usage')
            .parent?.child('/tx_usage/' + context.params.pushId + '/payment/uuid_token')
            .set(paymentUUID, function (error) {
                if (error) {
                    console.log("processTxUsage() : set UUID failed with code " + error);
                }
            });

        // 1. Request Access Token API
        let responseObj: any;
        try {
            responseObj = await payments.requestAccessTokenAPI(paymentUUID);
        } catch (error) {
            console.error(error);
        }

        console.log("processTxUsage() : response object '" + responseObj + "'");
        const obj = JSON.parse(responseObj);
        if (obj.status.code === 1000) {
            // Or Bearer <Your Access Token>
            const authCode = "Bearer " + obj.data.accessToken;
            console.log("processTxUsage() : get authenitaction Code = " + authCode);
            // 2. Call B Scan C payment api
            let responsePaymentObj: any;
            try {
                responsePaymentObj = await payments.requestPaymentAPI(authCode.toString(), paymentUUID, paymentCode, paymentValue, paymentBillId);
            } catch (error) {
                console.error(error);
            }

            console.log("processTxUsage() : response payment object '" + responsePaymentObj + "'");

        } else {
            //console.log("processTxUsage() : response object '" + responseObj + "'");
            // Access Authorization Errors
            // will be re-trying ?? 
        }


        return null;

    });

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