const {FirehoseClient, ListDeliveryStreamsCommand, PutRecordCommand} = require("@aws-sdk/client-firehose");
const Kafka = require('node-rdkafka');
const protobuf = require("protobufjs");
const fs = require('fs');
const ROOT_DIR = __dirname;
console.log('root path ', ROOT_DIR);
require('dotenv').config();
const createCompress = require('compress-brotli')
const {
    constants: {
        BROTLI_MODE_TEXT,
        BROTLI_PARAM_MODE,
        BROTLI_PARAM_QUALITY
    }
} = require('zlib')
// It exposes compress/decompress methods
const {compress, decompress} = createCompress({
    compressOptions: {
        chunkSize: 1024,
        parameters: {
            [BROTLI_PARAM_MODE]: BROTLI_MODE_TEXT
        }
    },
    decompressOptions: {
        chunkSize: 1024,
        parameters: {
            [BROTLI_PARAM_MODE]: BROTLI_MODE_TEXT
        }
    }
})

// Retrieve all kafka message
const AWS_REGION = process.env.AWS_REGION;
const FIREHOSE_ID = process.env.FIREHOSE_ID;
const FIREHOSE_SECRET = process.env.FIREHOSE_SECRET;
const FIREHOSE_STREAM_NAME = process.env.FIREHOSE_STREAM_NAME;

const KAFKA_TOPIC = process.env.KAFKA_TOPIC_NAME;
const KAFKA_BROKERS = process.env.KAFKA_BROKERS;
const KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID;
const KAFKA_PARTITION = Number(process.env.KAFKA_PARTITION);

const FILE_OFFSET = ROOT_DIR + `/${KAFKA_TOPIC}_offset.data`;
let OFFSET = 0;

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
        //"auto.offset.reset": 'earliest',
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
            consumer.assign([{topic: KAFKA_TOPIC, partition: KAFKA_PARTITION, offset: (json.offset + 1)}]);
            consumer.consume();
        });
    } else {
        consumer.queryWatermarkOffsets(KAFKA_TOPIC, KAFKA_PARTITION, 1000, async (err, offsets) => {
            if (err) {
                console.error('queryWatermarkOffsets failed. review kafka config; error :', err);
                return;
            }
            console.log(offsets)
            console.log("Consumer ready. From kafka data, moved to offset: " + offsets.lowOffset);
            consumer.assign([{topic: KAFKA_TOPIC, partition: KAFKA_PARTITION, offset: offsets.lowOffset}]);
            consumer.consume();
        });
    }
});


consumer.on("data", async (data) => {
    let logMsg = [];
    console.log("data",data)
    logMsg.push('#' + data.offset);
    logMsg.push(' encSize ' + (data.size / 1024) + ' KB ');
    const isRawSha256CoinJob = data.topic === 'RAW_SHA256_COIN_JOB_V1';
    const isStratumJob = data.topic === 'STRATUM_JOB_V1';
    const isFoundBlock = data.topic === 'FOUND_BLOCK_SHA256_COIN_V1';
    const protoPath = (isRawSha256CoinJob || isStratumJob || isFoundBlock) ? './proto/pool_rpc.proto' : './proto/pool.proto';
    const protoType = isRawSha256CoinJob ? 'pool.service.RawSha256CoinJob' :
        isStratumJob ? 'pool.service.StratumJob' :
            isFoundBlock ? 'pool.service.SubmitBlockSha256Coin' : 'pool.Share';

    try {
        const decodeStart = Date.now();
        // Load the protobuf definition
        const root = protobuf.loadSync(protoPath);
        const messageType = root.lookupType(protoType);
        let isErr = messageType.verify(data.value)
        if (isErr) {
            console.error(logMsg.join(''), ' message decode error: ', isErr)
            return;
        }
        let decodedMessage = messageType.decode(data.value);
        const decodeDuration = Date.now() - decodeStart;
        if (isStratumJob) {
            decodedMessage = decodedMessage.sha256CoinJob
        }
        const decodedMessageJson = decodedMessage.toJSON();
        if(decodedMessageJson.shareTime >= 1713790420 && decodedMessageJson.shareTime <= 1713790425){
            console.log("shareTime is : ", decodedMessageJson.shareTime)
        }
        decodedMessageJson['offset'] = data.offset;
        decodedMessageJson['topic'] = data.topic;
        const inputData = JSON.stringify(decodedMessageJson);
        const uncompressedSize = inputData.length * 2;
        logMsg.push('| decoded ' + (uncompressedSize / 1024) + 'KB ');
        logMsg.push('@ ' + decodeDuration + 'ms ');

        const compressStart = Date.now();
        const compressedData = await compress(inputData);
        const compressDuration = Date.now() - compressStart;
        const compressedSize = Buffer.byteLength(compressedData.toString('base64'));
        logMsg.push('| compressed ' + (compressedSize / 1024) + 'KB ');
        logMsg.push('@ ' + compressDuration + 'ms ');
        // const firehoseClient = new FirehoseClient({
        //     region: AWS_REGION,
        //     credentials: {
        //         accessKeyId: FIREHOSE_ID,
        //         secretAccessKey: FIREHOSE_SECRET
        //     }
        // });
        // const firehoseInput = {
        //     DeliveryStreamName: FIREHOSE_STREAM_NAME,
        //     Record: {
        //         Data: new TextEncoder().encode(compressedData.toString('base64') + '\n')
        //     },
        // };
        // const firehoseStart = Date.now();
        // const firehoseCommand = new PutRecordCommand(firehoseInput);
        // const response = await firehoseClient.send(firehoseCommand);
        // const firehoseDuration = Date.now() - firehoseStart;
        // const totalDuration = decodeDuration + compressDuration +  firehoseDuration;
        // logMsg.push('| firehose @ ' + firehoseDuration + 'ms ');
        // logMsg.push('| total @ ' + (totalDuration / 1000) + 's ');
        // logMsg.push('| response ' + JSON.stringify(response));
        // console.log(logMsg.join(''));   // uncomment
    } catch (error) {
        console.error(logMsg.join(''), ' messageError:', error);
    }
    // consumer.commit();
    write_file(data.offset);
});


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
        console.log('Offset saved ', newOffset);
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
