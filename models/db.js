const mongoose=require("mongoose");
const dotenv=require('dotenv');
dotenv.config();
const mongodbUrl=process.env.MONGODB_URL
mongoose.connect(
    mongodbUrl
).then(()=>{
    console.log("connected");
}).catch((err)=>{
    console.log(`Error Occured : ${err}`);
})