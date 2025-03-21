const Kafka = require('node-rdkafka');
const protobuf = require("protobufjs");
const fs = require('fs');
const ROOT_DIR = __dirname;
console.log('root path ', ROOT_DIR);
require('dotenv').config();
const args = require('yargs').argv;

if(!args.kafka_topic){
    process.exit(0);
}

const KAFKA_TOPIC = args.kafka_topic ? args.kafka_topic : 'SHARE_LOG';
const isRawSha256CoinJob = KAFKA_TOPIC === 'RAW_SHA256_COIN_JOB_V1';
const isStratumJob = KAFKA_TOPIC === 'STRATUM_JOB_V1';
const isFoundBlock = KAFKA_TOPIC === 'FOUND_BLOCK_SHA256_COIN_V1';
const isShareLog = KAFKA_TOPIC === 'SHARE_LOG';
const KAFKA_BROKERS = process.env.KAFKA_BROKERS;
const KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID;
const KAFKA_PARTITION = Number(process.env.KAFKA_PARTITION);
const KAFKA_CONSUME_COUNT = Number(
    isShareLog && "KAFKA_SHARE_CONSUME_COUNT" in process.env ? process.env.KAFKA_SHARE_CONSUME_COUNT :
        "KAFKA_CONSUME_COUNT" in process.env ? process.env.KAFKA_CONSUME_COUNT : 1
);

const protoPath = (isRawSha256CoinJob || isStratumJob || isFoundBlock) ? './proto/pool_rpc.proto' : './proto/pool.proto';
const protoType = isRawSha256CoinJob ? 'pool.service.RawSha256CoinJob' :
    isStratumJob ? 'pool.service.StratumJob' :
        isFoundBlock ? 'pool.service.SubmitBlockSha256Coin' : 'pool.Share';

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
    let logMsg = [];
    logMsg.push('#' + data.offset + ' ');
    logMsg.push('| enc ' + (data.size / 1024) + 'kb ');
    try {
        const decodeStart = Date.now();
        // Load the protobuf definition
        const root = protobuf.loadSync(protoPath);
        const messageType = root.lookupType(protoType);
        let isErr = messageType.verify(data.value)
        if (isErr) {
            console.error(logMsg.join(''), ' message decode error: ', isErr)
            return false;
        }
        let decodedMessage = messageType.decode(data.value);
        const decodeDuration = Date.now() - decodeStart;
        if (isStratumJob) {
            decodedMessage = decodedMessage.sha256CoinJob
        }
        const decodedMessageJson = decodedMessage.toJSON();
        // decodedMessageJson['offset'] = data.offset;  //not needed. its for testing purpose
        // decodedMessageJson['topic'] = data.topic;  //not needed. its for testing purpose
        const inputData = JSON.stringify(decodedMessageJson);
        // logMsg.push('| response ' + JSON.stringify(response));
        console.log(logMsg.join(''));
        await saveToFile(data.offset);
        return true;
    } catch (error) {
        console.error(logMsg.join(''), ' messageError:', error);
        await saveToFile(data.offset);
        return false;
    }
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
            console.log('Offset saved ', newOffset);
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
