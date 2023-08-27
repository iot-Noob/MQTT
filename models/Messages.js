const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessagesScheema = new Schema({
  PunbSubTopics: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PunbSubTopics',  
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', // Assuming you have a 'user' model
  },
  message: {
    type: String,
    required: true,
  },
  msgtype:{
    type: String,
    required: true,
  },
 
  createdDate: {
    type: Date,
    default: Date.now,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('msg', MessagesScheema);
