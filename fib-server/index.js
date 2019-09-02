const keys = require("./keys");

//Express
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app  = express();
app.use(cors());
app.use(bodyParser.json());

//Postgres Client Setup

const { Pool } = require("pg");
console.log(keys.pgPort)
const pgClient = new Pool({
    host: keys.pgHost,
    port: keys.pgPort,
    user: keys.pgUsername,
    password: keys.pgPassword,
    database: keys.pgDatabase
});

pgClient.on("error", () => console.log("SOS:Lost Postgres Connection"));
pgClient
    .query("CREATE TABLE IF NOT EXISTS values (number INT)")
    .catch(err => console.log(err));

//Redis Client
const redis = require("redis");
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});

const redisPublisher = redisClient.duplicate();

//Route handlers
app.get("/", (req, res) => {
    res.send("hi");
});

app.get("/values/all", async (req, res) =>{
    console.log("POSTGRES: GET VALUES ALL REQUEST");
    const values = await pgClient.query("SELECT * from values");
    res.send(values.rows);
});

app.get("/values/current", async (req, res) =>{
    console.log("REDIS: GET VALUES ALL REQUEST");
    redisClient.hgetall("values", (err, values) =>{
        res.send(values);
    });
});

app.post("/values", async (req, res) =>{
    const index = req.body.index;

    if(parseInt(index) > 40){
        return res.status(422).send("Number to high");
    }

    redisClient.hset("values", index, "Nothing Yet!");
    pgClient.query("INSERT INTO values(number) VALUES($1)", [index]);

    res.send({working: true});
});

app.listen(5000, err =>{
    console.log("Listening on port 5000");
});