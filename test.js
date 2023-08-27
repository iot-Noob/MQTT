const mqtt = require('mqtt');

// MQTT broker connection options
const brokerOptions = {
    host: '192.168.18.187', // Remove the mqtt:// protocol
    port: 1883, // Default MQTT port
    clientId: 'mqtt-client', // Client ID to identify the connection
    username: 'iotnoob', // Replace with your MQTT broker username
    password: 'talha6295', // Replace with your MQTT broker password
};
let isConnected = false;


// Create a client instance
const client = mqtt.connect(brokerOptions);

// Called when the client connects
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


// Called when a message arrives
client.on('message', (topic, message) => {
    console.log(`Message received on topic ${topic}: ${message.toString()}`);
});

// Called when the client loses its connection
client.on('close', () => {
    console.log('Connection closed');
});

// Called when an error occurs
client.on('error', (error) => {
    console.error('Error:', error);
});
