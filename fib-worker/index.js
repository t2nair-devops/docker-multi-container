const keys = require("./keys");
const redis = require("redis");
const redisParams = {
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
};

console.log("Redis Params:  " + redisParams);
const redisClient = redis.createClient(redisParams);

const sub = redisClient.duplicate();

function fib(index){
    if(index < 2) return 1;
    return fib(index - 1) + fib(index - 2);
}

sub.on("message", (channel, message) =>{
    console.log("Message Recieved By Worker: " + message)
    redisClient.hset("values", message, fib(parseInt(message)));
});
sub.subscribe('insert', (str) => console.log("Sub Status: "+ str));
