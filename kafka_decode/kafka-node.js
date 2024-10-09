const Kafka = require('kafka-node');
const client = new Kafka.KafkaClient({
    kafkaHost: 'localhost:9092'
})
const Consumer = new Kafka.Consumer(
    client,
    [{topic: 'SHARE_LOG', partition: 0, offset: 32800 }],
    {
        groupId:'one',
        autoCommit: false,
        fromOffset:true
    }
)

Consumer.on('message',(message)=>{
    console.log("message is : ", message)
})

Consumer.on('error', function (err) {
    console.log(err)
})