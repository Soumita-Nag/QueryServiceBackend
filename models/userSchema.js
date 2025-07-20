const {default:mongoose}=require("mongoose");
const UserSchema=new mongoose.Schema({
    uname:String,
    email:String,
    password:String,
})