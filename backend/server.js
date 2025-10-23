require('dotenv').config(); // Load .env variables
const mqtt = require('mqtt');
const express = require('express');
const mongoose = require('mongoose');
const moment = require('moment');
const nodemailer = require('nodemailer');
const cors = require('cors');

// ---------- Express Setup ----------
const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
}));
app.use(express.json());

// ---------- Environment Variables ----------
const MQTT_BROKER = process.env.MQTT_BROKER;
const MQTT_PORT = Number(process.env.MQTT_PORT);
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;
const TOPIC_SENSOR = process.env.TOPIC_SENSORS;
const TOPIC_AI = process.env.TOPIC_AI;

const MONGO_URI = process.env.MONGO_URI;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;

// ---------- MongoDB Connection ----------
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("[DB] MongoDB connected"))
    .catch(err => console.error("[DB] Connection error:", err));

// ---------- Email Setup ----------
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

const sendNotification = async (subject, text) => {
    try {
        await transporter.sendMail({
            from: EMAIL_USER,
            to: NOTIFY_EMAIL,
            subject,
            text
        });
        console.log("[EMAIL] Sent:", subject);
    } catch (err) {
        console.error("[EMAIL] Error:", err);
    }
};

// ---------- MongoDB Schemas ----------
const sensorSchema = new mongoose.Schema({
    motion: Number,
    temperature: Number,
    light: Number,
    fanState: Boolean,
    lightState: Boolean,
    timestamp: { type: Date, default: Date.now },
});

const aiSchema = new mongoose.Schema({
    occupancy: Boolean,
    humans_detected: Number,
    fan_opt: Boolean,
    light_opt: Boolean,
    timestamp: { type: Date, default: Date.now },
});

const Sensor = mongoose.model("Sensor", sensorSchema);
const AI = mongoose.model("AI", aiSchema);

// ---------- MQTT Setup (HiveMQ Cloud) ----------
const options = {
    host: MQTT_BROKER,
    port: MQTT_PORT,
    protocol: "mqtts",
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
    reconnectPeriod: 5000,
};

const client = mqtt.connect(options);

let latestSensorData = {};
let latestAIData = {};
let lastOccupancy = null;

client.on("connect", () => {
    console.log("[MQTT] Connected to HiveMQ Cloud");
    client.subscribe([TOPIC_SENSOR, TOPIC_AI], (err) => {
        if (err) console.error("[MQTT] Subscription error:", err);
        else console.log("[MQTT] Subscribed to:", TOPIC_SENSOR, "and", TOPIC_AI);
    });
});

client.on("error", (err) => {
    console.error("[MQTT] Connection error:", err.message);
});

client.on("message", async (topic, message) => {
    try {
        const data = JSON.parse(message.toString());
        const now = new Date();

        if (topic === TOPIC_SENSOR) {
            latestSensorData = data;
            await new Sensor({ ...data, timestamp: now }).save();
            await Sensor.deleteMany({ timestamp: { $lt: moment().subtract(7, 'days').toDate() } });

        } else if (topic === TOPIC_AI) {
            latestAIData = data;
            await new AI({ ...data, timestamp: now }).save();

            if (data.occupancy !== lastOccupancy) {
                lastOccupancy = data.occupancy;
                const subject = data.occupancy ? "Occupancy Detected" : "Room Empty";
                const text = data.occupancy ? "Someone entered the classroom, Please turn on the lights and fans." : "Classroom is now empty, Please turn off the lights and fans.";
                await sendNotification(subject, text);
            }

            await AI.deleteMany({ timestamp: { $lt: moment().subtract(7, 'days').toDate() } });
        }
    } catch (err) {
        console.error("[MQTT] Message error:", err);
    }
});

// ---------- API Endpoints ----------
app.get("/latest/sensors", (req, res) => res.json(latestSensorData || {}));
app.get("/latest/ai", (req, res) => res.json(latestAIData || {}));

app.get("/history/sensors", async (req, res) => {
    try {
        const data = await Sensor.find().sort({ timestamp: -1 }).limit(100);
        res.json(data.reverse());
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch sensor history" });
    }
});

app.get("/history/ai", async (req, res) => {
    try {
        const data = await AI.find().sort({ timestamp: -1 }).limit(100);
        res.json(data.reverse());
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch AI history" });
    }
});

// ---------- Start Server ----------
app.listen(port, () => console.log(`[SERVER] Running on port ${port}`));
