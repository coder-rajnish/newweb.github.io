const mongoose=require('mongoose')

const Model=mongoose.Schema({
    role:{
        type:String,
        default:'user'
    },
    name:{
         type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:
    {
        type:String,
        required:true
    }
})

const modelSchema=mongoose.model('model',Model)

module.exports=modelSchema