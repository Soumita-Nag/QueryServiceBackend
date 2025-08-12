const {default:mongoose}=require("mongoose");
const UserSchema=new mongoose.Schema({
    uname:String,
    email:String,
    password:String,
    seqQuestionNo:Number,
    seqAns:String,
    role: String,
})
module.exports=mongoose.model('users',UserSchema);