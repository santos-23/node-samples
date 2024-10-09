const Kafka = require('node-rdkafka');
const protobuf = require("protobufjs");
const fs = require('fs');
const ROOT_DIR = __dirname;
console.log('root path ', ROOT_DIR);
require('dotenv').config();
const args = require('yargs').argv;

console.log(args.kafka_topic)
if(!args.kafka_topic){
    process.exit(0);
}

const KAFKA_TOPIC = args.kafka_topic ? args.kafka_topic : 'ON_PREM_SHARE_LOG';
const isWorkerMinute = KAFKA_TOPIC === 'ON_PREM_WORKER_MINUTE';
const isFoundBlock = KAFKA_TOPIC === 'ON_PREM_FOUND_BLOCK_SHA256_COIN';
const isShareLog = KAFKA_TOPIC === 'ON_PREM_SHARE_LOG';
const KAFKA_BROKERS = process.env.KAFKA_BROKERS;
const KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID;
const KAFKA_PARTITION = Number(process.env.KAFKA_PARTITION);
const KAFKA_CONSUME_COUNT = Number(
    isShareLog && "KAFKA_SHARE_CONSUME_COUNT" in process.env ? process.env.KAFKA_SHARE_CONSUME_COUNT :
        "KAFKA_CONSUME_COUNT" in process.env ? process.env.KAFKA_CONSUME_COUNT : 1
);

const protoPath = (isWorkerMinute || isShareLog) ? './proto/pool.proto' : './proto/pool_rpc.proto';
const protoType = isWorkerMinute ? 'pool.WorkerMinute' :
        isShareLog ? 'pool.Share' : 'pool.service.SubmitBlockSha256Coin'

const FILE_OFFSET = ROOT_DIR + `/${KAFKA_TOPIC}_offset.data`;
let OFFSET = 0;

const consumer = new Kafka.KafkaConsumer(
    {
        'group.id': KAFKA_GROUP_ID,
        'metadata.broker.list': KAFKA_BROKERS,
        "bootstrap.servers": KAFKA_BROKERS,
        "enable.auto.commit": false,
        "statistics.interval.ms": 100,
        'enable.partition.eof': true,
    }, {
        "auto.offset.reset": 'earliest',
    });

consumer.connect({topic: KAFKA_TOPIC, timeout: 1000}, (errConnect, data) => {
    if (errConnect) {
        console.log({message: 'Kafka consumer not connected', error: errConnect});
        return;
    }
    console.log('Consumer connected');
});

consumer.on("ready", async (info, metadata) => {
    const fileExist = await fs.promises.stat(FILE_OFFSET).then((d) => true).catch((e) => false);
    consumer.subscribe([KAFKA_TOPIC]);
    if (fileExist) {
        fs.readFile(FILE_OFFSET, 'utf-8', (err, data) => {
            const json = JSON.parse(data);
            console.log("Consumer ready. From data from file, moved to offset: " + (json.offset + 1));
            consumer.assign([{topic: KAFKA_TOPIC, partition: KAFKA_PARTITION, offset: (json.offset + 1)}]);
            consumer.consume(KAFKA_CONSUME_COUNT, consumeCallback);
        });
    } else {
        consumer.queryWatermarkOffsets(KAFKA_TOPIC, KAFKA_PARTITION, 1000, async (err, offsets) => {
            if (err) {
                console.error('queryWatermarkOffsets failed. review kafka config; error :', err);
                return;
            }
            const offset = offsets.lowOffset;
            console.log("Consumer ready. From kafka data, moved to offset: " + offset);
            consumer.assign([{topic: KAFKA_TOPIC, partition: KAFKA_PARTITION, offset: offset}]);
            consumer.consume(KAFKA_CONSUME_COUNT, consumeCallback);
        });
    }
});

async function consumeCallback(err, messages) {
    if (err) {
        console.error('consumeError ', err);
        return false;
    }
    if (Array.isArray(messages)) {
        if (messages.length > 0) {
            console.error('array size------------', messages.length);
            let promises = []
            for (const message of messages) {
                promises.push(processMessage(message));
            }
            Promise.all(promises).then((result) => {
                consumer.commit();
                console.error('array commited------------',);
                consumer.consume(KAFKA_CONSUME_COUNT, consumeCallback);
            });
        } else {
            consumer.consume(KAFKA_CONSUME_COUNT, consumeCallback);
        }
    } else {
        await processMessage(messages);
        consumer.commit();
        consumer.consume(KAFKA_CONSUME_COUNT, consumeCallback);
    }
}

async function processMessage(data) {
    console.log(data)
    //fs.writeFileSync('/home/bsetec/Documents/sample_decode_package/ON_PREM_WORKER_MINUTE_sample.txt',data.value);
    try {
        // Load the protobuf definition
        const root = protobuf.loadSync(protoPath);
        const messageType = root.lookupType(protoType);
        let isErr = messageType.verify(data.value)
        if (isErr) {
            console.error(' message decode error: ', isErr)
            return false;
        }
        let decodedMessage = messageType.decode(data.value);
        let decodedMessageJson = {};
        decodedMessageJson = decodedMessage.toJSON();
        let resObject;
        if(isWorkerMinute){
            resObject = workerMinuteToJson(decodedMessageJson)
        }else if(isShareLog){
            resObject = shareDataToJson(decodedMessageJson)
        }else{
            resObject = foundBlockToJson(decodedMessageJson)
        }
        console.log(resObject)
        await saveToFile(data.offset);
        return true;
    } catch (error) {
        console.error(' messageError:', error);
        await saveToFile(data.offset);
        return false;
    }
}

function workerMinuteToJson(decodedMessageJson){
    let workerObject = {
        userName : decodedMessageJson.userName ? decodedMessageJson.userName : '',
        workerName : decodedMessageJson.workerName ? decodedMessageJson.workerName : '',
        minute : decodedMessageJson.minute ? decodedMessageJson.minute : '',
        shareAccept : decodedMessageJson.shareAccept ? decodedMessageJson.shareAccept : 0,
        shareReject : decodedMessageJson.shareReject ? decodedMessageJson.shareReject : 0,
        rejectRate : decodedMessageJson.rejectRate ? decodedMessageJson.rejectRate : 0,
        createdAt : decodedMessageJson.createdAt ? decodedMessageJson.createdAt : '',
    }
    return workerObject;
}

function shareDataToJson(decodedMessageJson){
    let shareObject = {
        sserverId : decodedMessageJson.sserverId ? decodedMessageJson.sserverId : '',
        userNameHash : decodedMessageJson.userNameHash ? decodedMessageJson.userNameHash : '',
        workerId : decodedMessageJson.workerId ? decodedMessageJson.workerId : '',
        jobBits : decodedMessageJson.jobBits ? decodedMessageJson.jobBits : 0,
        blkBits : decodedMessageJson.blkBits ? decodedMessageJson.blkBits : 0,
        blkHeight : decodedMessageJson.blkHeight ? decodedMessageJson.blkHeight : 0,
        blkReward : decodedMessageJson.blkReward ? decodedMessageJson.blkReward : 0,
        blk_fee : decodedMessageJson.blk_fee ? decodedMessageJson.blk_fee : 0,
        ip : decodedMessageJson.ip ? decodedMessageJson.ip : 0,
        ip2 : decodedMessageJson.ip2 ? decodedMessageJson.ip2 : 0,
        result : decodedMessageJson.result ? decodedMessageJson.result : 0,
        shareTime : decodedMessageJson.shareTime ? decodedMessageJson.shareTime : 0,
        userName : decodedMessageJson.userName ? decodedMessageJson.userName : '',
        workerName : decodedMessageJson.workerName ? decodedMessageJson.workerName : '',
        minerAgent : decodedMessageJson.minerAgent ? decodedMessageJson.minerAgent : '',
        uniqueId : decodedMessageJson.uniqueId ? decodedMessageJson.uniqueId : '',
        extraNonce2 : decodedMessageJson.extraNonce2 ? decodedMessageJson.extraNonce2 : 0,
        headerNonce : decodedMessageJson.headerNonce ? decodedMessageJson.headerNonce : 0,
        serverJobId : decodedMessageJson.serverJobId ? decodedMessageJson.serverJobId : 0,
        actualMiningCoin : decodedMessageJson.actualMiningCoin ? decodedMessageJson.actualMiningCoin : 0,
        shareDifficulty : decodedMessageJson.shareDifficulty ? decodedMessageJson.shareDifficulty : 0,
        blkVersion : decodedMessageJson.blkVersion ? decodedMessageJson.blkVersion : 0,
        blkTime : decodedMessageJson.blkTime ? decodedMessageJson.blkTime : 0,
        shareType : decodedMessageJson.shareType ? decodedMessageJson.shareType : 0,
        blkHash : decodedMessageJson.blkHash ? decodedMessageJson.blkHash : '',
        currentDiffIndex : decodedMessageJson.currentDiffIndex ? decodedMessageJson.currentDiffIndex : 0,
        isStale : decodedMessageJson.isStale ? decodedMessageJson.isStale : false,
        rejectType : decodedMessageJson.rejectType ? decodedMessageJson.rejectType : 0,
    }
    return shareObject;
}

function foundBlockToJson(decodedMessageJson){
    let baseInformation;
    let baseJson = decodedMessageJson.baseInformation ? decodedMessageJson.baseInformation : ''
    if(baseJson){
        baseInformation = {
            componentId : baseJson.componentId ? baseJson.componentId : '',
            createTimeNanosecond : baseJson.createTimeNanosecond ? baseJson.createTimeNanosecond : '',
            sendTimeNanosecond : baseJson.sendTimeNanosecond ? baseJson.sendTimeNanosecond : '',
        }
    }
    let foundBlockObject = {
        baseInformation : baseInformation ? baseInformation : '',
        coinId : decodedMessageJson.coinId ? decodedMessageJson.coinId : 0,
        rawSha256CoinJobHash : decodedMessageJson.rawSha256CoinJobHash ? decodedMessageJson.rawSha256CoinJobHash : '',
        height : decodedMessageJson.height ? decodedMessageJson.height : '',
        reward : decodedMessageJson.reward ? decodedMessageJson.reward : '',
        fee : decodedMessageJson.fee ? decodedMessageJson.fee : 0,
        hash : decodedMessageJson.hash ? decodedMessageJson.hash : '',
        previousHash : decodedMessageJson.previousHash ? decodedMessageJson.previousHash : '',
        bits : decodedMessageJson.bits ? decodedMessageJson.bits : 0,
        version : decodedMessageJson.version ? decodedMessageJson.version : 0,
        nonce : decodedMessageJson.nonce ? decodedMessageJson.nonce : 0,
        time : decodedMessageJson.time ? decodedMessageJson.time : 0,
        merkleRootHash : decodedMessageJson.merkleRootHash ? decodedMessageJson.merkleRootHash : '',
        coinbaseTransactionHex : decodedMessageJson.coinbaseTransactionHex ? decodedMessageJson.coinbaseTransactionHex : '',
        headerHex : decodedMessageJson.headerHex ? decodedMessageJson.headerHex : '',
        userName : decodedMessageJson.userName ? decodedMessageJson.userName : '',
        workerName : decodedMessageJson.workerName ? decodedMessageJson.workerName : '',
        userNameHash : decodedMessageJson.userNameHash ? decodedMessageJson.userNameHash : '',
        workerId : decodedMessageJson.workerId ? decodedMessageJson.workerId : '',
        depositAddress : decodedMessageJson.depositAddress ? decodedMessageJson.depositAddress : 0
    }
    return foundBlockObject;
}

function saveToFile(newOffset) {
    return new Promise((resolve, reject) => {
        if (newOffset <= OFFSET) {
            resolve(false)
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
            resolve(true)
        })
    })
}

consumer.on("partition.eof", async (eofEvent) => {
    console.log('Reached end of topic(s)' + JSON.stringify(eofEvent));
    await saveToFile(eofEvent.offset);
});

consumer.on("event.error", (error) => {
    console.log("event.error " + JSON.stringify(error));
});

consumer.on("disconnected", (error) => {
    console.log("disconnected");
});

function exitHandler(options, exitedBy) {
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

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind('uncaughtException', {exit: true, event: 'uncaughtException'}));
