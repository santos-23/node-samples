const Kafka = require('node-rdkafka');
const protobuf = require("protobufjs");
const mysql = require('mysql');
const fs = require('fs');
const ROOT_DIR = __dirname;
console.log('root path ', ROOT_DIR);
require('dotenv').config();

const KAFKA_TOPIC = process.env.KAFKA_TOPIC_NAME;
const KAFKA_BROKERS = process.env.KAFKA_BROKERS;
const KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID;
const KAFKA_PARTITION = Number(process.env.KAFKA_PARTITION);

const FILE_OFFSET = ROOT_DIR + `/${KAFKA_TOPIC}_offset1.data`;
let OFFSET = 0;
let values_arr = [];
let values_str;
let insert_limit = Number(process.env.INSERT_COUNT);
let count = 0, exeCount = 0;

const consumer = new Kafka.KafkaConsumer(
    {
        'group.id': KAFKA_GROUP_ID,
        'metadata.broker.list': KAFKA_BROKERS,
        "bootstrap.servers": KAFKA_BROKERS,
        'enable.auto.offset.store':false,  // change this to true if we want to store the offset in memory
        "enable.auto.commit": false,
        "statistics.interval.ms": 100,
        'enable.partition.eof': true,
    }, {
        "auto.offset.reset": 'largest',
    });


consumer.connect({topic: KAFKA_TOPIC, timeout: 1000}, (errConnect, data) => {
    if (errConnect) {
        console.log({message: 'Kafka consumer not connected', error: errConnect});
        return;
    }
    console.log('Consumer connected');
});

const pool = mysql.createPool({
    host: process.env.STAGE_HOST,
    user: process.env.STAGE_USER,
    password: process.env.STAGE_PASSWORD,
    database: process.env.STAGE_DB,
    connectTimeout: 3000000
});

consumer.on("ready", async (info, metadata) => {
    const fileExist = await fs.promises.stat(FILE_OFFSET).then((d) => true).catch((e) => false);
    consumer.subscribe([KAFKA_TOPIC]);
    if (fileExist) {
        consumer.queryWatermarkOffsets(KAFKA_TOPIC, KAFKA_PARTITION, 1000, async (err, offsets1) => {
            if (err) {
                console.error('queryWatermarkOffsets failed. review kafka config; error :', err);
                return;
            }
            console.log(offsets1)
        });
        fs.readFile(FILE_OFFSET, 'utf-8', (err, data) => {
            const json = JSON.parse(data);
            console.log("Consumer ready. From data from file, moved to offset: " + (json.offset + 1));
            consumer.assign([{topic: KAFKA_TOPIC, partition: KAFKA_PARTITION, offset: 31590}]);
            consumer.consume(1);
        });
    } else {
        // const timestamp = Date.now() - (24 * 60 * 60 * 1000); // One day ago
        // const topicPartition = {
        //     topic: KAFKA_TOPIC,
        //     partition: KAFKA_PARTITION,
        //     offset: 1713777743, // Optional: starting offset
        //     // timestamp: 1713777743,
        // };
        consumer.offsetsForTimes(
            [ {topic: KAFKA_TOPIC, partition: 0, offset: 1713790419000 } ],
            10000,
            (err,offsets)=>{
                console.log(offsets)
                consumer.assign([{topic: KAFKA_TOPIC, partition: KAFKA_PARTITION, offset: offsets[0].offset}]);
                consumer.consume(20)
            }
        );
        // consumer.queryWatermarkOffsets(KAFKA_TOPIC, KAFKA_PARTITION, 1000, async (err, offsets) => {
        //     if (err) {
        //         console.error('queryWatermarkOffsets failed. review kafka config; error :', err);
        //         return;
        //     }
        //     console.log(offsets)
        //     console.log("Consumer ready. From kafka data, moved to offset: " + offsets.lowOffset);
        //     consumer.assign([{topic: KAFKA_TOPIC, partition: KAFKA_PARTITION, offset: offsets.lowOffset}]);
        //     consumer.consume(1);
        // });
    }
});


consumer.on("data", async (data) => {
    console.log("offset : ",data.offset)
    const protoPath = './proto/pool.proto';
    const protoType = 'pool.Share';
    try {
        // Load the protobuf definition
        const root = protobuf.loadSync(protoPath);
        const messageType = root.lookupType(protoType);
        let isErr = messageType.verify(data.value);
        if (isErr) {
            console.error(logMsg.join(''), ' message decode error: ', isErr)
            return;
        }
        let decodedMessage = messageType.decode(data.value);
        const decoded = decodedMessage.toJSON();  // start 1713724200 --- april 22 --- end 1713810599
        // if(decoded.result != 1){
        //     console.log(decoded)
        // }
        // console.log(decoded)
        if((decoded.shareTime >= 1713724200 && decoded.shareTime <= 1713810599) || (decoded.shareTime > 1713810599 && values_arr.length != 0)){
            if(decoded.shareTime > 1713810599){
                console.log('remaining data to be inserted is : ',values_arr.length)
            }else{
                values_str = `('${decoded.serverJobId ? decoded.serverJobId : null}', '${decoded.userNameHash ? decoded.userNameHash : null}', '${decoded.workerId ? decoded.workerId : null}', ${decoded.jobBits ? decoded.jobBits : null}, ${decoded.blkBits ? decoded.blkBits : null}, ${decoded.blkHeight ? decoded.blkHeight : null}, ${decoded.blkReward ? decoded.blkReward : null}, ${decoded.ip ? decoded.ip : null}, ${decoded.result ? decoded.result : null}, ${decoded.shareTime ? decoded.shareTime : null}, '${decoded.userName ? decoded.userName : null}', 
                        '${decoded.workerName ? decoded.workerName : null}', '${decoded.minerAgent ? decoded.minerAgent : null}', '${decoded.uniqueId ? decoded.uniqueId : null}', ${decoded.extraNonce_2 ? decoded.extraNonce_2 : null}, ${decoded.headerNonce ? decoded.headerNonce : null}, '${decoded.sserverId ? decoded.sserverId : null}', ${decoded.actualMiningCoin ? decoded.actualMiningCoin : null}, ${decoded.shareDifficulty ? decoded.shareDifficulty : null}, ${decoded.blkVersion ? decoded.blkVersion : null}, ${decoded.blkTime ? decoded.blkTime : null}, '${decoded.shareType ? decoded.shareType : null}', '${decoded.blkHash ? decoded.blkHash : null}', ${decoded.currentDiffIndex ? decoded.currentDiffIndex : null}, ${decoded.isStale ? decoded.isStale : null}, '${decoded.rejectType ? decoded.rejectType : null}', ${decoded.blkFee ? decoded.blkFee : null}, ${decoded.ip2 ? decoded.ip2 : null})`
                values_arr.push(values_str)
            }
            count++;
            if(values_arr.length === insert_limit || decoded.shareTime > 1713810599){
                exeCount++;
                console.log('execute count : ', exeCount)
                let query = `
                    INSERT INTO stats_share_log_messages (serverJobId, userNameHash, workerId, jobBits, blkBits, blkHeight, blkReward, ip, result, shareTime, userName, workerName, minerAgent, uniqueId, extraNonce_2, headerNonce, sserverId, actualMiningCoin, shareDifficulty, blkVersion, blkTime, shareType, blkHash, currentDiffIndex, isStale, rejectType, blkFee, ip2)
                    VALUES ${values_arr};
                `
                // console.log(query)
                executeQuery(query)
                    .then((data)=>{
                        console.log('data is : ',data)
                    })
                    .catch((err)=>{
                        console.log(err)
                        // console.log(decoded)
                        // console.log(query)
                        // process.exit(0);
                    })
                values_arr = []
            }
            // console.log(decoded)
            // console.log("shareTime is : ", decoded.shareTime)
        }
    } catch (error) {
        console.error(' messageError:', error);
    }
    write_file(data.offset);
});

function executeQuery(query){
    return new Promise((resolve,reject)=>{
        pool.getConnection((err,connection)=>{
            if(err){
                return reject(err);
            }
            connection.query(query,(err,results)=>{
                connection.destroy()
                if(err){
                    resolve(err)
                    console.log(err)
                }else{
                    var string=JSON.stringify(results);
                    var json =  JSON.parse(string);
                    resolve(json)
                }
            })
        })
    })
}

function write_file(newOffset) {
    if (newOffset <= OFFSET) {
        return;
    }
    OFFSET = newOffset;
    const content = {
        offset: newOffset
    };
    fs.writeFile(FILE_OFFSET, JSON.stringify(content), "utf-8", (error) => {
        if (error) {
            console.error('An error has occurred ', error);
            return;
        }
        // console.log('Offset saved ', newOffset);
    })
}

consumer.on("partition.eof", (eofEvent) => {
    console.log('Reached end of topic(s)' + JSON.stringify(eofEvent));
    write_file(eofEvent.offset);
});

consumer.on("event.error", (error) => {
    console.log("event.error " + JSON.stringify(error));
});

consumer.on("disconnected", (error) => {
    console.log("disconnected");
});

let exited = false;
async function exitHandler(options, exitedBy) {
    if(exited){
        return;
    }
    exited = true;
    console.log('count is : ',count)
    if(values_arr.length != 0){
        console.log('remaining data is now inserted to DB, count : ',values_arr.length)
        let query = `
            INSERT INTO stats_share_log_messages (serverJobId, userNameHash, workerId, jobBits, blkBits, blkHeight, blkReward, ip, result, shareTime, userName, workerName, minerAgent, uniqueId, extraNonce_2, headerNonce, sserverId, actualMiningCoin, shareDifficulty, blkVersion, blkTime, shareType, blkHash, currentDiffIndex, isStale, rejectType, blkFee, ip2)
            VALUES ${values_arr};
        `
        await executeQuery(query)
            .then((data)=>{
                console.log('data is : ',data)
            })
            .catch((err)=>{
                console.log(err)
            })
    }
    const data = {"offset": OFFSET};
    try {
        console.log('options: ', options, ' exitedBy ', exitedBy);
        fs.writeFileSync(FILE_OFFSET, JSON.stringify(data, null, 2));
        console.log('exitHandler offset ', OFFSET, ' saved to file');
    } catch (err) {
        console.error('exitHandler file write failed. error :', err);
    }

    try {
        if (options.exit) {
            consumer.unsubscribe();
            consumer.disconnect();
            process.kill(process.pid)
            process.exit(0)
        }
    } catch (err) {
        console.error('exitHandler error:', err);
    }
}

// setTimeout(()=>{
//     process.kill(process.pid)
//     process.exit(0)
// },5000)

//do something when app is closing
process.on('exit', exitHandler.bind('exit', {exit: true, event: 'exit'}));

process.on('disconnect', exitHandler.bind('disconnect', {exit: true, event: 'disconnect'}));

process.on('beforeExit', exitHandler.bind('beforeExit', {exit: true, event: 'beforeExit'}));

//catches ctrl+c event [interrupts]
process.on('SIGINT', exitHandler.bind('SIGINT', {exit: true, event: 'SIGINT'}));

//catches ctrl+z event [terminates]
process.on('SIGTSTP', exitHandler.bind('SIGTSTP', {exit: true, event: 'SIGTSTP'}));

//catches ctrl+\ event [core dump]
process.on('SIGQUIT', exitHandler.bind('SIGQUIT', {exit: true, event: 'SIGQUIT'}));

//catches kill [pid]
process.on('SIGTERM', exitHandler.bind('SIGTERM', {exit: true, event: 'SIGTERM'}));

//catches kill -9 [pid]
// process.on('SIGKILL', exitHandler.bind('SIGKILL', {exit:true}) )

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind('uncaughtException', {exit: true, event: 'uncaughtException'}));
