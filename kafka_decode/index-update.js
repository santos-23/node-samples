const {FirehoseClient, PutRecordCommand} = require("@aws-sdk/client-firehose");
require('dotenv').config();
const Kafka = require('node-rdkafka');
const protobuf = require("protobufjs");

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

const fs = require('fs');
const parentDirectory = __dirname;
console.log(parentDirectory)
// process.stdin.resume();

// Retrieve all kafka message
const AWS_REGION = process.env.AWS_REGION;
const STREAM_NAME = process.env.STREAM_NAME;
const TOPIC = process.env.TOPIC_NAME;
const BROKERS = process.env.BROKERS;
const GROUP_ID = process.env.GROUP_ID;

const consumer = new Kafka.KafkaConsumer(
    {
        'group.id': GROUP_ID,
        'metadata.broker.list': BROKERS,
        "bootstrap.servers": BROKERS,
        "enable.auto.commit": false,
        "statistics.interval.ms": 100,
        'enable.partition.eof': true,
    }, {
        "auto.offset.reset": 'earliest',
    });


consumer.connect({topic: TOPIC, timeout: 1000}, (errConnect, data) => {
    if (errConnect) {
        console.log({message: 'kafka not connected', error: errConnect});
        return;
    }
    console.log('consumer.connect done ');
});

let PARTITION = 0;
let OFFSET = 0;
let startOffset, endOffset;
let offsetArray = []

consumer.on("ready", async (info, metadata) => {
    console.log("ready info " + JSON.stringify(info));

    consumer.subscribe([TOPIC]);
    if (await fs.promises.stat(parentDirectory + `/offset-${TOPIC}.txt`).then((d) => true).catch((e) => false)) {
        start_consume();
    } else {
        write_file(OFFSET);
        start_consume();
    }

    function start_consume() {
        fs.readFile(parentDirectory + `/offset-${TOPIC}.txt`, 'utf-8', (error, data1) => {
            if (error) {
                console.log(error)
            }
            data1 = JSON.parse(data1);
            OFFSET = data1.offset;
            consumer.queryWatermarkOffsets(TOPIC, PARTITION, 1000, async (err, offsets) => {
                if (err) {
                    console.error('Error seeking to end:', err);
                    process.exit(0);
                }
                endOffset = offsets.highOffset - 1;
                startOffset = offsets.lowOffset;
                OFFSET = (OFFSET === 0 || OFFSET <= startOffset) ? startOffset : OFFSET;
                consumer.assign([{topic: TOPIC, partition: PARTITION, offset: OFFSET}]);
                if (OFFSET > endOffset) {
                    console.log("Offset reached the end of specified topic")
                } else {
                    try {
                        // consumer.on("data", async (data) => {
                        consumer.consume(1)
                        consumer.on("data", async (data) => {
                        // consumer.consume(1, async (err, messages) => {
                            // let data = messages[0]
                            if(offsetArray.includes(data.offset)){
                                return
                            }
                            offsetArray.push(data.offset)
                            let logMsg = [];
                            logMsg.push('#' + data.offset);
                            logMsg.push(' encodedSize ' + (data.size / 1024) + ' KB ');
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
                                    console.log('error message while verify data : ', isErr, ' OFFSET : ', data.offset)
                                    return;
                                }
                                let decodedMessage = messageType.decode(data.value);
                                const decodeDuration = Date.now() - decodeStart;
                                if (isStratumJob) {
                                    decodedMessage = decodedMessage.sha256CoinJob
                                }
                                const decodedMessageJson = decodedMessage.toJSON();
                                decodedMessageJson['offset'] = data.offset;
                                decodedMessageJson['topic'] = data.topic;
                                const decodedSize = decodedMessageJson.toString().length * 2;
                                logMsg.push('decodedSize ' + (decodedSize / 1024) + ' KB ');
                                logMsg.push('decodeDuration ' + decodeDuration + 'ms ');
                                const inputData = JSON.stringify(decodedMessageJson);
                                const uncompressedSize = inputData.length * 2;
                                logMsg.push('UnCompressedSize: ' + (uncompressedSize / 1024) + ' KB ');
                                const compressStart = Date.now();
                                const compressedData = await compress(inputData);
                                const compressDuration = Date.now() - compressStart;
                                logMsg.push('compDuration ' + compressDuration + 'ms ');
                                const compressedSize = Buffer.byteLength(compressedData.toString('base64'));
                                logMsg.push('CompressedSize ' + (compressedSize / 1024) + ' KB ');
                                console.log(logMsg.join(''));
                                // const firehoseClient = new FirehoseClient({
                                //     region: AWS_REGION,
                                //     credentials: {
                                //         accessKeyId: 'AKIAYDF6RJS3DC7OOKMZ',
                                //         secretAccessKey: '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'
                                //     }
                                // });
                                // const firehoseInput = {
                                //     DeliveryStreamName: STREAM_NAME,
                                //     Record: {
                                //         // Data: new TextEncoder().encode(JSON.stringify(decodedMessageJson) + '\n')
                                //         Data: new TextEncoder().encode(compressedData.toString('base64') + '\n')
                                //     },
                                // };
                                // const firehoseCommand = new PutRecordCommand(firehoseInput);
                                // const response = await firehoseClient.send(firehoseCommand);
                                // console.log('firehoseResponse: ', response);
                                write_file(data.offset + 1);
                                start_consume();
                            } catch (error) {
                                console.log('Error message:', error);
                                // process.exit(0);
                            }
                        });
                    } catch (error) {
                        console.error("Error consuming message:", error);
                        process.exit(0);
                    }
                }
            });
        });
    }

    function write_file(param_OFFSET) {
        fs.writeFile(parentDirectory + `/offset-${TOPIC}.txt`, JSON.stringify({offset: param_OFFSET}), "utf-8", (error) => {
            if (error) {
                console.log('An error has occurred ', error);
                return;
            }
        })
    }

    consumer.on("partition.eof", (eofEvent) => {
        console.log('Reached end of topic(s)' + JSON.stringify(eofEvent));
    });

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
        fs.writeFileSync(parentDirectory + `/offset-${TOPIC}.txt`, JSON.stringify(data, null, 2));
        if (options.exit) {
            consumer.disconnect();
            process.kill(process.pid)
            process.exit(0)
        }
    } catch (err) {
        console.error('Error writing data:', err);
    }
}

//do something when app is closing
process.on('exit', exitHandler.bind('exit', {exit: true}));

process.on('disconnect', exitHandler.bind('disconnect', {exit: true}));

process.on('beforeExit', exitHandler.bind('beforeExit', {exit: true}));

//catches ctrl+c event [interrupts]
process.on('SIGINT', exitHandler.bind('SIGINT', {exit: true}));

//catches ctrl+z event [terminates]
process.on('SIGTSTP', exitHandler.bind('SIGTSTP', {exit: true}));

//catches ctrl+\ event [core dump]
process.on('SIGQUIT', exitHandler.bind('SIGQUIT', {exit: true}));

//catches kill [pid]
process.on('SIGTERM', exitHandler.bind('SIGTERM', {exit: true}));

//catches kill -9 [pid]
// process.on('SIGKILL', exitHandler.bind('SIGKILL', {exit:true}) )

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind('uncaughtException', {exit: true}));