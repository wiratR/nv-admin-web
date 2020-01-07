'use strict';

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as db from './database';

admin.initializeApp(functions.config().firebase);

export const paymentProcess     = db.processTxUsage;    // imports test functions 
export const paymentAddMessage  = db.addMessage;        // test add messages from Server for unit test

function clearArray<T>(array: T[]) {
    while (array.length) {
        array.pop();
    }
}

// crontab schedule for create TD 
exports.cronCreateRefundTd = functions
    .pubsub.schedule('every 3 minutes')
    .timeZone('Asia/Bangkok')
    .onRun(async context => {
        console.log("cronCreateRefundTd() : triggered every 3 minutes");

        //let itemObj: string[] = [{id: String}];
        const refRefundRequest = admin.database()
                            .ref("refund_request").orderByKey();

/*
state: "initial",
type: "scbAPI",
partnerTransactionId    : paymentObj.data.partnerTransactionId,
transactionAmount       : paymentObj.data.transactionAmount,
transactionDateTime     : paymentObj.data.transactionDateTime
*/

        const itemObj: {
            item_id                 : string;
            state                   : any;
            type                    : any;
            partnerTransactionId    : any;
            transactionAmount       : any;
            transactionDateTime     : any;
        }[] = [];

        // snapShot database
        refRefundRequest.on('value', (snapshot) => {
            const refundRequestObj = snapshot?.val();
            for (const item in refundRequestObj) {
                //console.log("cronSetRecheckDevice() : device id '" + item 
                //    + "' status '" + dv_statusObj[item].status 
                //    + "' recheck '" + dv_statusObj[item].recheck + "'");
                itemObj.push({
                    item_id : item,
                    state   : refundRequestObj[item].state, 
                    type    : refundRequestObj[item].type,
                    partnerTransactionId    : refundRequestObj[item].partnerTransactionId,
                    transactionAmount       : refundRequestObj[item].transactionAmount,
                    transactionDateTime     : refundRequestObj[item].transactionDateTime
                });
            }
        });

        for (const key of itemObj) {
            if (key.state === "initial" && key.type === "scbAPI") {
                console.log("cronCreateRefundTd() : start addMessageRefund() ...... ");
                await db.addRefundMessage (key.partnerTransactionId , key.transactionAmount);

                // update 'state' done
                admin.database().ref('refund_request')
                    .parent?.child('/refund_request/' + key.item_id+ '/state')
                    .set("done", function (error) {
                        if (error) {
                            console.log("updateTxnStatus() : failed with code " + error);
                        }
                    });

                console.log("cronSetRecheckDevice() : end addMessageRefund() ...... ");
            }else{
                console.log("cronCreateRefundTd() : state " + key.state);
                console.log("cronCreateRefundTd() : type "  + key.type);
                console.log("cronCreateRefundTd() : end No Update"); 
            }
        }

        // clear array object 
        clearArray(itemObj);

        return null;
    });

exports.cronSetRecheckDevice = functions
    //.pubsub.schedule('5 * * * *')
    .pubsub.schedule('every 5 minutes')
    .timeZone('Asia/Bangkok')
    .onRun(context => {
        console.log("cronSetRecheckDevice () : triggered every 5 minutes");
        
        //let itemObj: string[] = [{id: String}];
        const refdvStatus = admin.database().ref("dv_status").orderByKey();

        const itemObj: { 
            item_id: string; 
            device_id: any; 
            datetime: any; 
            status: any; 
            recheck: any;
        }[] = [];

        // snapShot database
        refdvStatus.on('value', (snapshot) => {
            const dv_statusObj = snapshot?.val();
            for (const item in dv_statusObj) {
                //console.log("cronSetRecheckDevice() : device id '" + item 
                //    + "' status '" + dv_statusObj[item].status 
                //    + "' recheck '" + dv_statusObj[item].recheck + "'");
                itemObj.push({ 
                    item_id: item,
                    device_id:  dv_statusObj[item].device_id,
                    datetime:   dv_statusObj[item].datetime,
                    status:     dv_statusObj[item].status,
                    recheck:    dv_statusObj[item].recheck
                });
            }
        });

        for (const key of itemObj) 
        {
            //console.log("cronSetRecheckDevice() : key " + key.item_id );

            if( key.status === "Out-Of-Service" && key.recheck === "0" )
            {
                console.log("cronSetRecheckDevice() : device was " + key.status);
            }
            if( key.status === "In-Service" && key.recheck === "1" )
            {
                // server will auto chnage to out-of-service
                console.log("cronSetRecheckDevice() : server auto update status " + key.status);
                admin.database().ref('dv_status')
                    //.parent?.child('/dv_status/evt_bus_0001/status')
                    .parent?.child('/dv_status/' + key.item_id + '/status')
                    .set("Out-Of-Service", function (error) {
                        if (error) {
                            console.log("cronSetRecheckDevice() : Data could not be saved." + error);
                        } 
                        //else {
                        //    console.log("cronSetRecheckDevice() : Data saved successfully.");
                        //}
                    });
            }
            // every 5 minutes re-check device
            admin.database().ref('dv_status')
                //.parent?.child('/dv_status/evt_bus_0001/recheck')
                .parent?.child('/dv_status/' + key.item_id + '/recheck')
                .set("1", function (error) {
                    if (error) {
                        console.log("cronSetRecheckDevice() : Data could not be saved." + error);
                    } 
                    //else {
                    //    console.log("cronSetRecheckDevice() : Data saved successfully.");
                    //}
                });
        }

        // clear array object 
        clearArray(itemObj);
        console.log("cronSetRecheckDevice() : --------------------------------------------- ");
        return null;
    });

