const express=require('express');
const mongoose=require('mongoose');
const cors=require("cors");
const dotenv=require('dotenv');
dotenv.config();
const port=process.env.PORT || 8000;

const db=require("./models/db")
const users=require("./models/userSchema");
const querySchema = require('./models/querySchema');
const queryAdminSchema = require('./models/queryAdminSchema');
const userSchema = require('./models/userSchema');
const app=express();

const bcrypt = require('bcrypt');
const req = require('express/lib/request');
const SALT_ROUNDS = 10;

app.use(cors({
    // origin: 'https://askhive.soumita.xyz'
    origin: 'http://localhost:5173'
}))
app.use(express.json());

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
    const {uname,email,password,seqQuestionNo,seqAns,role}=req.body;
    try{
      const result=await users.findOne({email});
      if(result){
        return res.status(400).json({msg:"User Already Exists"});
      }
      const hashPassword= await bcrypt.hash(password,SALT_ROUNDS);
      const normalizedSeqAns = seqAns.trim().toLowerCase();
      const hashSeqAns=await bcrypt.hash(normalizedSeqAns,SALT_ROUNDS);
      const user=new users({
        uname,
        email,
        password:hashPassword,
        seqQuestionNo,
        seqAns:hashSeqAns,
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
app.delete('/delQuery', async (req, res) => {
  try {
    const queryId=req.query.queryId;
    const result= await querySchema.deleteOne({queryId:queryId});
    const finalResult= await queryAdminSchema.deleteMany({queryId:queryId})
    if(result.deletedCount===0 || finalResult.deletedCount===0){
      return res.status(404).json({msg:"Query not found"})
    }
    res.status(200).json({ msg: "successfully deleted"});
  } catch (error) {
    console.error("Error deleting query:", error);
    res.status(500).json({ msg: "error", error: error.message });
  }
});
app.delete('/delAns', async (req, res) => {
  try {
    const ansId=req.query.ansId;
    const queryId=req.query.queryId;
    console.log(ansId+" "+queryId);
    const result= await queryAdminSchema.deleteOne({ansId:ansId});
    if(result.deletedCount===0){
      return res.status(404).json({msg:"Answer not found"})
    }
    const query = await querySchema.findOne({ queryId });
    const newAnsCount = query.ansCount - 1;
    await querySchema.updateOne(
      { queryId },
      {
        $set: { 
          ansCount: newAnsCount,
          status: newAnsCount > 0 ? "success" : "pending"
        }
      }
    );
    res.status(200).json({ msg: "successfully deleted"});
  } catch (error) {
    console.error("Error deleting answer:", error);
    res.status(500).json({ msg: "error", error: error.message });
  }
});
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
        const queries = await querySchema.find({ status: { $ne: 'blocked' } }).lean();    
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
            ansId:answer?.ansId,
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
        ansId:answer?.ansId,
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
    console.log(req.body);
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
    const unAnsweredQueries=await querySchema.find(
    {queryId:{$nin:answeredQueryIds},
     status: { $ne: 'blocked' } }
    )
    res.status(200).json(unAnsweredQueries);
  }
  catch(err){
    res.status(500).json({msg:"Error fetching unanswered queries"});
  }
})
app.get('/getAnsweredQueries', async (req, res) => {
  try {
    const answeredQueryIds = await queryAdminSchema.distinct('queryId');
    const queries = await querySchema.find({ queryId: { $in: answeredQueryIds },status: { $ne: 'blocked' } }).lean();
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
        ansId:answer?.ansId,
        adminId: answer?.adminId,
        answerDate: answer?.date,
        answerTime: answer?.time,
        answerRank: answer?.rank,
      };
    });
    combined.sort((a, b) => {
      const dateA = new Date(`${a.answerDate} ${a.answerTime}`);
      const dateB = new Date(`${b.answerDate} ${b.answerTime}`);
      return dateA - dateB; 
    });
    res.status(200).json(combined);
  } catch (err) {
    console.error('Error fetching answered queries:', err);
    res.status(500).json({ msg: 'Error fetching answered queries', error: err });
  }
});
app.get('/getAnswers',async(req,res)=>{
  const queryId=req.query.queryId;
  try{
    const result= await queryAdminSchema.find({queryId:queryId});
    if(result.length===0){
      res.status(404).json({msg:"Answers does not exists"});
    }
    else
    res.status(200).json(result);
  }
  catch(err){
    res.status(500).json({msg:"Error Fetching Answers"});
  }
})
app.get('/blockQuery',async(req,res)=>{
  try {
    const queryId=req.query.queryId;
    // console.log(queryId);
    await querySchema.updateOne(
      {queryId:queryId},
      {$set: {status:'blocked'}}
    );
    // console.log("success")
    res.status(200).json({ msg: "successfully blocked"});

  } catch (error) {
    console.error("Error blocking query:", error);
    res.status(500).json({ msg: "error", error: error.message });
  }
})
app.post('/forgetPassword',async(req,res)=>{
  const {email,seqQuestionNo,seqAns}=req.body;
  console.log(email+" "+seqQuestionNo+" "+seqAns);   
  try{
      const result=await users.findOne({email:email});
      if(!result){
        return res.status(202).json({msg:"User doesn't exist"});
      }
      console.log(result)
      const normalizedSeqAns=seqAns.trim().toLowerCase();
      const isMatch=await bcrypt.compare(normalizedSeqAns,result.seqAns);
      const isMatch2=seqQuestionNo==result.seqQuestionNo;
      if(!isMatch || !isMatch2){ 
        return res.status(201).json({msg:"Invalid Credential!"});
      }
      res.status(200).json(result);
  }catch(err){
    console.log(err);
      res.status(400).json(err);
  }
})
app.post('/resetPassword',async(req,res)=>{
  const {email,password}=req.body;
  try{
    const hashPassword= await bcrypt.hash(password,SALT_ROUNDS);
    await userSchema.updateOne(
      {email:email},
      {$set:{password:hashPassword}}
    );
    res.status(200).json({msg:"Password Reset Successfull"});
  }
  catch(err){
    console.log(err);
      res.status(400).json(err);
  }
})
app.listen(port,()=>{
    console.log(`Server is Running at port : ${port}`);
})