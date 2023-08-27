const express = require('express');
const router = express.Router();
const fetchuser = require('../middleware/fetchuser');
const PunbSubTopics = require('../models/PunbSubTopics');
const User=require('../models/User')
const Msgs = require('../models/Messages');
const { body, validationResult } = require('express-validator');
const mqtt = require('mqtt');
 

const brokerOptions = {
    host: '192.168.18.208', // Remove the mqtt:// protocol
    port: 1883, // Default MQTT port
    clientId: 'mqtt-client', // Client ID to identify the connection
    username: 'noob', // Replace with your MQTT broker username
    password: 'talha6295', // Replace with your MQTT broker password
};

let isConnected=false;

const client = mqtt.connect(brokerOptions);

client.on('connect', () => {
    isConnected=true;
    console.log('Connected to MQTT broker');

    // Subscribe to a topic
    client.subscribe('topic/test');

    // Publish a message to the topic
    client.publish('topic/test', 'Hello from MQTT client!');
});

client.on('close', () => {
    isConnected = false;
    console.log('Connection closed');
});

client.on('error', (error) => {
    console.error('Error:', error);
});

//subscribe to a brand new topic and store it in poubsub db
router.post("/subscribe-new", fetchuser, [
    body('topic', "Enter a valid topic")
], async (req, res) => {

    try {
        const { topic } = req.body;
        const errors = validationResult(req);

        // Fetch user's username
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(400).json({ error: "User not found." });
        }

        // Format the topic with the username
        const formattedTopic = `${user.name}/${topic}`;

        // Check if the user is already subscribed to the topic
        const existingSubscription = await PunbSubTopics.findOne({ topic: formattedTopic });

        if (existingSubscription) {
            client.subscribe(formattedTopic);
            return res.status(400).json({
                error: "User already subscribed to this topic"
                
            });
            
        }

        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        // Subscribe the user to the MQTT topic
        client.subscribe(formattedTopic);

        // Create a new subscription entry in the database
        const newSubscription = new PunbSubTopics({
            topic: formattedTopic,
            user: req.user.id
        });

        await newSubscription.save();

        return res.json(newSubscription);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Server error" });
    }

});

 

// Helper function to validate topic format
 

// Subscribe to all topics without overwriting existing entries
router.post('/subscribe-all', fetchuser, async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        // Find all topics in the database
        const allTopics = await PunbSubTopics.find().distinct('topic');

        // Subscribe to each topic
        allTopics.forEach(topic => {
            client.subscribe(topic);
        });

        return res.json({ message: 'Subscribed to all available topics.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
});


// Unsubscribe from topics
router.post('/unsub', fetchuser, async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        // Find the topic to unsubscribe from
        const { topic } = req.body;

        // Check if the user is subscribed to the topic
        const subscription = await PunbSubTopics.findOne({ user: req.user.id, topic });

        if (!subscription) {
            return res.status(400).json({ error: 'You are not subscribed to this topic.' });
        }

        // Unsubscribe from the topic
        client.unsubscribe(topic);

        // Remove the subscription entry from the database
        await PunbSubTopics.deleteOne({ _id: subscription._id }); // Assuming _id is the identifier

        return res.json({ message: 'Unsubscribed successfully.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
});

//Publish Message over MQTT and store it on Database.\



router.post('/publish', fetchuser, async (req, res) => {
    try {
        const { topic, message, msgtype } = req.body;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        // Find the PunbSubTopics document based on the provided topic
        const punbSubTopics = await PunbSubTopics.findOne({ topic });

        if (!punbSubTopics) {
            return res.status(400).json({ error: 'Topic not found.' });
        }

        if (!isConnected) {
            return res.status(500).json({
                errorMQTTserver: "Error Connection failed or timeout MQTT connect to server and try again"
            });
        }

        client.publish(topic, message);

        const msg = new Msgs({
            PunbSubTopics: punbSubTopics._id,
            message,
            msgtype,
            user: req.user.id
        });

        const spm = await msg.save();

        res.json({
            msg: spm
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
});

//recieve messages or fetch all mesages form database 
router.post('/receive', fetchuser, async (req, res) => {
    try {
        const { topic } = req.body;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }
        
        const punbSubTopics = await PunbSubTopics.findOne({ topic });

        if (!punbSubTopics) {
            return res.status(400).json({ error: 'Topic not found.' });
        } else {
            if (!isConnected) {
                return res.status(500).json({
                    errorMQTTserver: "Error Connection failed or timeout MQTT connect to server and try again"
                });
            } else {
                // Subscribe to the specific topic for receiving messages
                client.subscribe(topic);

                // Listen for messages on the specified topic
                client.on('message', async (receivedTopic, message) => {
                    if (receivedTopic === topic) {
                        console.log(`Message received on topic ${topic}: ${message.toString()}`);
                        const msgtype = "receiver";
                        const msg = new Msgs({
                            PunbSubTopics: punbSubTopics._id,
                            msgtype,
                            message: message.toString(),
                            user: req.user.id
                        });

                        const spm = await msg.save();
                        console.log("Message saved to the database:", spm);
                    }
                });

                // Respond with an acknowledgment
                res.status(200).json({
                    message: "Message reception initiated."
                });
            }
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Get all messages on a specific topic
router.post('/get-messages', fetchuser, async (req, res) => {
    try {
        const { topic } = req.body;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        // Find the PunbSubTopics document based on the provided topic
        const punbSubTopics = await PunbSubTopics.findOne({ topic });

        if (!punbSubTopics) {
            return res.status(400).json({ error: 'Topic not found.' });
        }

        // Fetch all messages for the given topic
        const messages = await Msgs.find({ PunbSubTopics: punbSubTopics._id });

        res.json({
            messages
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Search for messages based on topic or keyword// Search for messages based on topic or keyword
router.post('/search-messages', fetchuser, async (req, res) => {
    try {
        const { topic, keyword } = req.body;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        if (!topic && !keyword) {
            return res.status(400).json({ error: 'Please provide either a topic or a keyword.' });
        }

        let query = {}; // Initialize a query object

        // If topic is provided, search for the topic
        if (topic) {
            const punbSubTopics = await PunbSubTopics.findOne({ topic });
            if (!punbSubTopics) {
                return res.status(400).json({ error: 'Topic not found.' });
            }
            query.PunbSubTopics = punbSubTopics._id;
        }

        // If keyword is provided, search for the keyword within message content
        if (keyword) {
            query.message = { $regex: keyword, $options: 'i' };
        }

        // Fetch messages based on the constructed query
        const messages = await Msgs.find(query);

        if (messages.length === 0) {
            return res.json({ message: 'No matching messages found.' });
        }

        res.json({
            messages
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
});

 //get recomendation on most  common messages 
 


module.exports = router;
