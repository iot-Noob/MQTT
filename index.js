const ConnectToMongo=require('./db');
const bodyParser=require('body-parser');
 
ConnectToMongo();
 
const express = require('express')
const app = express()
const port = 5000
app.use(express.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use('/api/auth',require('./routes/auth'))
app.use('/api/sms',require('./routes/sndsms'))

app.use('/',(req,res,next)=>{
    res.status(400).json({
        error:"Invalid Routte not found"
    })
    res.status(404).json({
        error:"Invalid no such Routte"
    })
    res.status(500).json({
        error:"Server error routes"
    })
})
 
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
