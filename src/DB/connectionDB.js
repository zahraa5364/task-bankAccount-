import mongoose from "mongoose"

const checkconnection = async () =>{
    await mongoose.connect("mongodb://127.0.0.1:27017/bankAccount",{serverSelectionTimeoutMS: 5000})
    .then(()=>{
        console.log("DB connected successfuly....")
    })
    .catch((error)=>{
        console.log("DB connection failed", error)
    })
}

export default checkconnection