const mongoose=require("mongoose");
mongoose.connect(
    "mongodb://localhost:27017/QueryService"
).then(()=>{
    console.log("connected");
}).catch((err)=>{
    console.log(`Error Occured : ${err}`);
})