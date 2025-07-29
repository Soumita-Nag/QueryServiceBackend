const {default:mongoose}=require("mongoose");
const queryAdminSchema=new mongoose.Schema({
    queryId: String,
    adminId:String,
    answer: String,
    date: String,
    time: String,
    status: String,
    rank: Number,
})
module.exports=mongoose.model('queries',querySchema);