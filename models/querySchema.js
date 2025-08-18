const {default:mongoose}=require("mongoose");
const querySchema=new mongoose.Schema({
    queryId: String,
    userId:String,
    category: Array,   
    // category: String,   
    queryTitle: String,
    query: String,
    like: Number,
    ansCount: Number,
    views: Number,
    date: String,
    time: String,
    status: String,
})
module.exports=mongoose.model('queries',querySchema);