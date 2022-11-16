
const { MongoClient } = require("mongodb");
const url = "mongodb+srv://ujjwal1234:Ujjwal1234@cluster0.onwwaca.mongodb.net/?retryWrites=true&w=majority";
const clint = new MongoClient(url);

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());

const cors = require("cors");

app.use(express.json());
app.use(cors());

const port = 3000;
const server = app.listen(port, () => {
  console.log("listening on port %s.\n", server.address().port);
});

const jwt = require("jsonwebtoken");
const jwt_key = "emp1234";
const jwtExpiryTime = 300;

app.get("/getAllUser", async(req,res) => {
    let userName  = req.body.userName;
    let password = req.body.password;
    if(userName == "admin" && password == "admin"){
        try{
            let con = await clint.connect();    
            let result = await con.db('emp').collection('empData').find().toArray();
            return res.send(result);
        }catch(err){
            return res.send(err);
        }
    }
})

app.post("/register", async(req,res) => {
    let userName = req.body.userName;
    let password = req.body.password;
    let conformPassword = req.body.conformPassword;
    let empSal = req.body.empSal;
    let empDob = req.body.empDob;
    let empDept = req.body.empDept;

    if(!userName) return res.send("Enter userName");
    else if(!conformPassword) return res.send("Enter conformPassword...");
    else if(!password) return res.send("Enter Password...");
    else if(password !== conformPassword) return res.send("Password does not match");
    else{
        try{
            let con = await clint.connect(); 
            let result  = await con.db('emp').collection('empData').findOne({"userName":userName});
            if(result)  {
                return res.send("Use different user name to register...")
            }
            else{
                let result = await con.db('emp').collection('empData').insertOne({"userName": userName, "password": password, "empDept": empDept, "empSal": empSal, "empDob": empDob});
                console.log("result inside register...",result);
                res.send("User is registerd successfully");
            }
        }catch(err){
            res.send(err);
        }
    }
});

app.post("/login/:userName", async(req,res) => {
    let userName = req.params.userName;
    let password =  req.body.password;
    !userName ? res.send("Enter userName...") : password ? "" :  res.send("Enter Password...")
    try{
        let con = await clint.connect();    
        let result  = await con.db('emp').collection('empData').findOne({"userName":userName});
        if(!result) return res.send("Not a registered employee...");
        else if(result.password === password){
            const token = jwt.sign( { userName }, jwt_key, {
                algorithm: "HS256",
                expiresIn: jwtExpiryTime
            })
            res.send(token);
        }
        else return res.send("Password does not match...")
    }catch(err){
        res.send("Login failed...");
    }
});

app.put("/updateEmp/:userName", async(req,res) =>{
    const token = req.headers["authorization"];
    const userName = req.params.userName;
    console.log("token", token );
    console.log("UserName", userName);
    let empSal = req.body.empSal;
    let empDept = req.body.empDept;
    try{
        if(!token)
        {
            return res.send("Please login first...")
        }
        else
        {
            let varification = jwt.verify(token, jwt_key);
            let con = await clint.connect();
            if(userName == varification.userName){
                if(empDept && !empSal) {
                    con.db('emp').collection('empData').updateOne({"userName": userName}, {$set: {"empDept": empDept}});
                    return res.send("Employee dept is updated...");
                }
                else if(empSal && !empDept)
                {
                    con.db.empData.updateOne({"userName": userName}, {$set: {"empSal": empSal}});
                    return res.send("Employee dept is updated...");
                }
                else
                {
                    if(!empDept && !empSal) return res.send("Enter emp salry and emp department...");
                    con.db("emp").collection("empData").updateOne({"userName": userName}, {$set: {"empDept": empDept, "empSal": empSal}});
                    return res.send("Employee dept and salary is updated...");
                }
            }
            else{
                return res.send("Invalid userName...");
            }
        }
    }catch(err){
        console.log("error inside catch block", err)
        res.send(err);
    }
    
})

app.delete("/deleteEmp/:userName", async(req,res) =>{
    const token = req.headers["authorization"];
    let userName = req.params.userName;
    console.log(userName);
    try{
        if(!token){
            return res.send("Please login first...")
        }
        else{
            let varification = jwt.verify(token, jwt_key);
            if(userName == varification.userName){
                let con = await clint.connect();    
                let result = await con.db('emp').collection('empData').deleteOne({"userName": userName});
                if(result.deletedCount == 1)
                    return res.send("User is deleted successfully");
            }
            else{
                return res.send("user name is not correct...")
            }
        }
    }catch(err){
        res.send(err);
    }
})
