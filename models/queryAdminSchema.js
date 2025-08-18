const {default:mongoose}=require("mongoose");   
const queryAdminSchema=new mongoose.Schema({
    queryId: String,
    ansId:String,
    adminId:String,
    answer: String,
    date: String,
    time: String,
    rank: Number,
    satisfactoryRate:{ type: mongoose.Schema.Types.Decimal128 },
    satisfactoryRateUpdated:Boolean,
})
module.exports=mongoose.model('answers',queryAdminSchema);