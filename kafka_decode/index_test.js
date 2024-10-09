const Kafka = require('node-rdkafka');
const protobuf = require("protobufjs");
const { FirehoseClient, ListDeliveryStreamsCommand, PutRecordCommand } = require("@aws-sdk/client-firehose");

require('dotenv').config({path: 'stage.env'})
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


const TOPIC_RAW_SHA_256_COIN_JOB = 'RAW_SHA256_COIN_JOB_V1';
const TOPIC_SHA_256_COIN_JOB = 'STRATUM_JOB_V1';
const TOPIC_FOUND_BLOCK = 'FOUND_BLOCK_SHA256_COIN_V1';
const TOPIC_SHARES = 'SHARE_LOG';

const STREAM_RAW_SHA_256_COIN_JOB = 'mara-pool-devdev-firehose-stream-raw-sha256-coin-job';
const STREAM_SHA_256_COIN_JOB = 'mara-pool-devdev-firehose-data-stratum-job';
const STREAM_FOUND_BLOCK = 'mara-pool-devdev-firehose-stream-found-block';
const STREAM_SHARES = 'mara-pool-devdev-firehose-stream-shares';


const TOPIC = 'RAW_SHA256_COIN_JOB_V1';
const BROKERS = 'localhost:9092';
const GROUP_ID = '1';
const PROTO_FILE_PATH = './proto/pool_rpc.proto';
const consumer = new Kafka.KafkaConsumer(
    {
        'group.id': GROUP_ID,
        'metadata.broker.list': BROKERS,
        "bootstrap.servers": BROKERS,
        "enable.auto.commit": false,
        "statistics.interval.ms": 100,

    }, {
        "auto.offset.reset": 'earliest',

    }
);


consumer.on("ready", (info, metadata) => {
    console.log("ready info " + JSON.stringify(info));

    consumer.subscribe([TOPIC]);
    consumer.consume();
});

consumer.on("data", async (data) => {
    console.log(data.offset)
    // let logMsg = [];
    // logMsg.push('#' + data.offset);
    // const isRawSha256CoinJob = data.topic === TOPIC_RAW_SHA_256_COIN_JOB;
    // const isStratumJob = data.topic === TOPIC_SHA_256_COIN_JOB;
    // const isFoundBlock = data.topic === TOPIC_FOUND_BLOCK;

    // const protoPath =
    //     (isRawSha256CoinJob ||
    //         isStratumJob ||
    //         isFoundBlock) ? './proto/pool_rpc.proto' : './proto/pool.proto';

    // const protoType = isRawSha256CoinJob ? 'pool.service.RawSha256CoinJob' :
    //     isStratumJob ? 'pool.service.StratumJob' :
    //         isFoundBlock ? 'pool.service.SubmitBlockSh256Coin' : 'pool.Share';

    // const firehoseStreamName = isRawSha256CoinJob ? STREAM_RAW_SHA_256_COIN_JOB :
    //     isStratumJob ? STREAM_SHA_256_COIN_JOB :
    //         isFoundBlock ? STREAM_FOUND_BLOCK : STREAM_SHARES;

    // try {
    //     const decodeStart = Date.now();
    //     // Load the protobuf definition
    //     const root = await protobuf.load(PROTO_FILE_PATH);
    //     const messageType = root.lookupType(protoType);
    //     const decodedMessage = messageType.decode(data.value);
    //     const decodeDuration = Date.now() - decodeStart;
    //     const decodedMessageJson = decodedMessage.toJSON();
    //     const outputJson = decodedMessageJson.sha256_coin_job ? decodedMessageJson.sha256_coin_job : decodedMessageJson;

    //     const decodedSize = outputJson.toString().length * 2;
    //     logMsg.push('decodedSize ' + (decodedSize / 1024) + ' KB ');
    //     logMsg.push('decodeDuration ' + decodeDuration + 'ms ');
    //     const inputData = JSON.stringify(outputJson);
    //     const uncompressedSize = inputData.length * 2;
    //     logMsg.push('UnCompressedSize: ' + (uncompressedSize / 1024) + ' KB ');
    //     const compressStart = Date.now();
    //     const compressedData = await compress(inputData);
    //     const compressDuration = Date.now() - compressStart;
    //     logMsg.push('compDuration ' + compressDuration + 'ms ');
    //     const compressedSize = Buffer.byteLength(compressedData.toString('base64'));
    //     logMsg.push('CompressedSize ' + (compressedSize / 1024) + ' KB ');


        // const firehoseClient = new FirehoseClient({
        //     region: 'us-east-1',
        //     credentials: {
        //         accessKeyId: 'AKIAYDF6RJS3DC7OOKMZ',
        //         secretAccessKey: '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'
        //     }
        // });
        // const firehoseInput = {
        //     DeliveryStreamName: firehoseStreamName,
        //     Record: {
        //         // Data: new TextEncoder().encode(JSON.stringify(decodedMessageJson) + '\n')
        //         Data: new TextEncoder().encode(compressedData.toString('base64') + '\n')
        //     },
        // };
        // const firehoseCommand = new PutRecordCommand(firehoseInput);
        // const firehoseStart = Date.now();
        // const response = await firehoseClient.send(firehoseCommand);
        // const firehoseDuration = Date.now() - firehoseStart;
        // logMsg.push('firehoseDuration ' + firehoseDuration + 'ms ');
        // logMsg.push('response ' + JSON.stringify(response) );

    //     console.log(logMsg.join(''));
    // } catch (error) {
    //     console.error('Error decoding message:', error);
    // }
});

consumer.on("partition.eof", (eofEvent) => {
    console.log('Reached end of topic(s)' + JSON.stringify(eofEvent));
});

consumer.on("event.error", (error) => {
    console.log("event.error " + JSON.stringify(error));
});

consumer.on("disconnected", (error) => {
    console.log("disconnected");
});
// consumer.on("event.stats", (eventData) => {
//     console.log("event.stats  "+eventData.data.message);
// });


consumer.connect({topic: TOPIC, timeout: 1000}, (errConnect, data) => {
    if (errConnect) {
        console.error("kafka not connected");
        return;
    }
    console.log('consumer.connect done ');
});


process.on('SIGINT', () => {
    if (consumer.isConnected())
        consumer.disconnect();
    process.exit(0);
});
