const mongoose=require('mongoose')
 const {Schema}=mongoose;
 
const UserScheema=Schema({
    name:{
        type:String,
        required:true
    },

   
    password:{
        type:String,
        required:true
    },
    
   date:{
        type:Date,
        default:Date.now
    }
      

})
const User=mongoose.model('user',UserScheema);
 
module.exports= User;