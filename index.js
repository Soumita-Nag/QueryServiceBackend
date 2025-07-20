const express=require('express');
const mongoose=require('mongoose');
const cors=require("cors");

const db=require("./models/db")
const users=require("./models/userSchema");
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
    user.save(user)
    // console.log(email+" "+uname+" "+password);
})
app.listen(port,()=>{
    console.log(`Server is Running at port : ${port}`);
})