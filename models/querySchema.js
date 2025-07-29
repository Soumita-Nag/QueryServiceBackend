const {default:mongoose}=require("mongoose");
const querySchema=new mongoose.Schema({
    queryId: String,
    userId:String,
    category: String,
    queryTitle: String,
    query: String,
    date: String,
    time: String,
    status: String,
})
module.exports=mongoose.model('queries',querySchema);