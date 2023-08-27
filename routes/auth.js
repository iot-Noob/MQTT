const express = require('express');
const User = require('../models/User') //import user database i create
const { body, validationResult } = require('express-validator');
const router = express.Router();
const bcrypt = require('bcryptjs'); //import bcrpt
const jwt = require('jsonwebtoken');
const JWT_SEC ="Talha@Khalid584970"

const fetchuser=require('../middleware/fetchuser');
router.post('/createuser', [
 
    body('name', 'enter a valid name'),
 
    body('password')
 
], async (req, res) => {
    //if there are errors , returnt that reuest and errros
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }
    //Check wether the  user with same email exists

    try {
        let users = await User.findOne({ name: req.body.name });

        if (users) {
            return res.status(400).json({ error: "Sorry user already exists" })
        }
        //create salt for password
        const salt = await bcrypt.genSalt(10);
        //convert code to hash with salt

        secpass = await bcrypt.hash(req.body.password, salt);
          
        let user = await User.create({
            name: req.body.name,
            password: secpass
           
            })
        //fetch id of user and asign token
        const data = {
            user: {
                id: user.id
            }
        }
        //Send JSON token signed by id to user
        const jwtdata = jwt.sign(data, JWT_SEC, { expiresIn: '7h' });
        res.json({ "login token": jwtdata });
    } catch (error) {
        res.json({ error })
        console.error('Error in login:', error);
        res.status(400).json({ error: "Some error occurred" });
    }



});

//Authenticate a user Login

router.post('/Login', [
    body('name', 'Enter a valid name'),
    body('password', 'ener a valid pasword canot be blanlk').exists(),
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }
    const email = req.body.email;
    const password = req.body.password;
    try {
        let user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ error: "Please try to login with correct cradentials" });
        }
        
        //compare password;
        const passofComp = await bcrypt.compare(password, user.password);
        if (!passofComp) {
            return res.status(400).json({ error: "Please try to login with correct cradentials" });
        }

        const data = {
            user: {
                id: user.id
            }
        }
        const jwtdatakey = jwt.sign(data, JWT_SEC,{expiresIn:"7h"});
        res.json(jwtdatakey);
    } catch (error) {
        res.json({ error })
        res.status(500).send("some error occured");
    }

});

//Route 3 Get login user Details POST api/auth/getuser No login required
router.post('/getuser', fetchuser,  async (req, res) => {

    try {
      userId = req.user.id;
      const user = await User.findById(userId).select("-password");
      res.send(user)
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  })

 

module.exports = router; 