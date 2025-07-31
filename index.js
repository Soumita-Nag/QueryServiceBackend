const express=require('express');
const mongoose=require('mongoose');
const cors=require("cors");

const db=require("./models/db")
const users=require("./models/userSchema");
const querySchema = require('./models/querySchema');
const queryAdminSchema = require('./models/queryAdminSchema');
const app=express();

app.use(cors({
    origin: 'http://localhost:5173'
}))
app.use(express.json());
const port=8000;

app.post('/login',async(req,res)=>{
    const email=req.body.email;
    const password=req.body.password;
    console.log(email+" "+password);    
    const query={
        email:email,
        password:password,
    }
    try{
        const result=await users.find(query);
        if(result.length!=0){
            res.status(200).json(result);
        }
        else{
            res.status(201).json({msg:"User doesn't exist"});
        }
    }catch(err){
        res.status(400).json({msg:err});
    }
})
app.post('/signup',(req,res)=>{
    // const uname=req.body.uname;
    // const email=req.body.email;
    // const password=req.body.password;
    const user=new users(req.body);
    // const query={
    //     email:req.body.email,
    //     password:req.body.password
    // }
    // try{
    //     const result=users.find(query);
    //     if(result.length==0){
    //         user.save(user)
    //     }
    // }
    user.save()
    // console.log(email+" "+uname+" "+password);
})
app.post('/addQuery', async (req, res) => {
  try {
    console.log(req.body);
    const query = new querySchema(req.body);
    const savedQuery = await query.save(); 
    res.status(200).json({ msg: "success", data: savedQuery });
  } catch (error) {
    console.error("Error saving query:", error);
    res.status(500).json({ msg: "error", error: error.message });
  }
});
app.get('/getAllQuery', async(req,res)=>{
    try {
        const queries = await querySchema.find();    
        res.status(200).json(queries);
    } catch (err) {
        res.status(500).json({ msg: "Failed to fetch queries", error: err });
    }
})
app.get('/getQuery', async(req,res)=>{
    const userId=req.query.userId;
    console.log("user: "+userId)    
    try {
        const queries = await querySchema.find({userId:userId}); 
        res.status(200).json(queries);
    } catch (err) {
        res.status(500).json({ msg: "Failed to fetch queries", error: err });
    }
})
app.post('/postAnswer',async(req,res)=>{
    // console.log(req.body);
    try {
        const answer = new queryAdminSchema(req.body);
        const savedAnswer = await answer.save(); 
        res.status(200).json({ msg: "success", data: savedAnswer });
    } catch (error) {
        console.error("Error saving Answer:", error);
        res.status(500).json({ msg: "error", error: error.message });
    }
})
app.get('/getUnAnsweredQueries',async(req,res)=>{
  try{
    const answeredQueryIds=await queryAdminSchema.distinct('queryId');
    const unAnsweredQueries=await querySchema.find({
      queryId:{$nin:answeredQueryIds}
    })
    res.status(200).json(unAnsweredQueries);
  }
  catch(err){
    res.status(500).json({msg:"Error fetching unanswered queries"});
  }
})
app.get('/getAnsweredQueries',async(req,res)=>{
  try{
    const answeredQueryIds=await queryAdminSchema.distinct('queryId');
    const unAnsweredQueries=await querySchema.find({
      queryId:{$in:answeredQueryIds}
    })
    res.status(200).json(unAnsweredQueries);
  }
  catch(err){
    res.status(500).json({msg:"Error fetching unanswered queries"});
  }
})
app.listen(port,()=>{
    console.log(`Server is Running at port : ${port}`);
})