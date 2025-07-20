const express=require('express');
const mongoose=require('mongoose');
const cors=require("cors");

const user=require("./models/userSchema");
const app=express();

app.use(cors({
    origin: 'http://localhost:5173'
}))
app.use(express.json());
const port=8000;

app.post('/login',(req,res)=>{
    const email=req.body.email;
    const password=req.body.password;
    console.log(email+" "+password);    
})
app.post('/signup',(req,res)=>{
    const uname=req.body.uname;
    const email=req.body.email;
    const password=req.body.password;
    console.log(email+" "+uname+" "+password);
})
app.listen(port,()=>{
    console.log(`Server is Running at port : ${port}`);
})