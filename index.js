const express=require('express');
const mongoose=require('mongoose');
const cors=require("cors");

const db=require("./models/db")
const users=require("./models/userSchema");
const querySchema = require('./models/querySchema');
const queryAdminSchema = require('./models/queryAdminSchema');
const userSchema = require('./models/userSchema');
const app=express();

const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

app.use(cors({
    origin: 'http://localhost:5173'
}))
app.use(express.json());
const port=8000;

app.post('/login',async(req,res)=>{
    const email=req.body.email;
    const password=req.body.password;
    console.log(email+" "+password);   
    try{
        const result=await users.findOne({email:email});
        if(!result){
           return res.status(201).json({msg:"User doesn't exist"});
          }
          const isMatch=await bcrypt.compare(password,result.password);
        if(!isMatch){ 
            return res.status(201).json({msg:"Wrong Password"});
        }
        res.status(200).json(result);
    }catch(err){
      console.log(err);
        res.status(400).json(err);
    }
})
app.post('/signup',async(req,res)=>{
    const {uname,email,password,role}=req.body;
    try{
      const result=await users.findOne({email});
      if(result){
        return res.status(400).json({msg:"User Already Exists"});
      }
      const hashPassword= await bcrypt.hash(password,SALT_ROUNDS);
      const user=new users({
        uname,
        email,
        password:hashPassword,
        role
      });
      await user.save();
      res.status(200).json({msg:"User added successfully"});
    }
    catch(err){
      console.error("Signup error:", err);
      res.status(500).json({ msg: "Server error during signup", error: err.message });
    }
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
        const queries = await querySchema.find().lean();    
        const answes=await queryAdminSchema.find().lean();
        const answerMap={};
        for(const ans of answes){
          answerMap[ans.queryId]=ans;
        }
        const combined=queries.map(query=>{
          const answer=answerMap[query.queryId];
          return {
            ...query,
            answer: answer?.answer,
            adminId: answer?.adminId,
            answerDate: answer?.date,
            answerTime: answer?.time,
            answerRank: answer?.rank,
          };
        });
        res.status(200).json(combined);
    } catch (err) {
        res.status(500).json({ msg: "Failed to fetch queries", error: err });
    }
})
app.get('/getQuery', async (req, res) => {
  const userId = req.query.userId;
  // console.log("user: " + userId);

  try {
    const queries = await querySchema.find({ userId: userId });
    const queryIds = queries.map(q => q.queryId);
    const answers = await queryAdminSchema.find({ queryId: { $in: queryIds } });
    const answerMap = {};
    for (const ans of answers) {
      answerMap[ans.queryId] = ans;
    }
    const combined = queries.map(query => {
      const answer = answerMap[query.queryId];
      return {
        ...query._doc,  
        answer: answer?.answer,
        adminId: answer?.adminId,
        answerDate: answer?.date,
        answerTime: answer?.time,
        answerRank: answer?.rank,
      };
    });

    res.status(200).json(combined);
  } catch (err) {
    console.error("Error fetching user's queries:", err);
    res.status(500).json({ msg: "Failed to fetch queries", error: err });
  }
});

app.post('/postAnswer',async(req,res)=>{
    // console.log(req.body);
    try {
        const answer = new queryAdminSchema(req.body);
        const savedAnswer = await answer.save(); 
        await querySchema.updateOne(
          {queryId:req.body.queryId},
          {
            $inc: {ansCount:1},
            $set: {status:'success'}
          }
        );
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
app.get('/getAnsweredQueries', async (req, res) => {
  try {
    const answeredQueryIds = await queryAdminSchema.distinct('queryId');
    const queries = await querySchema.find({ queryId: { $in: answeredQueryIds } }).lean();
    const answers = await queryAdminSchema.find({ queryId: { $in: answeredQueryIds } }).lean();
    const answerMap = {};
    for (const ans of answers) {
      answerMap[ans.queryId] = ans;
    }
    const combined = queries.map(query => {
      const answer = answerMap[query.queryId];
      return {
        ...query,
        answer: answer?.answer,
        adminId: answer?.adminId,
        answerDate: answer?.date,
        answerTime: answer?.time,
        answerRank: answer?.rank,
      };
    });

    res.status(200).json(combined);
  } catch (err) {
    console.error('Error fetching answered queries:', err);
    res.status(500).json({ msg: 'Error fetching answered queries', error: err });
  }
});

app.listen(port,()=>{
    console.log(`Server is Running at port : ${port}`);
})