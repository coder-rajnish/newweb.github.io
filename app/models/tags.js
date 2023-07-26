const mongoose=require('mongoose')

const Tag=mongoose.Schema({
  
  name:
  {
      type:String,
      required:true
  },
  created_by:{
    type:String,
    required:true
  },
  updated_by:{
    type:String,
    required:true
  },slug:{
    type:String,
    required:true
  }
},{
  timestamps:true
}
)

const tag=mongoose.model('tag',Tag)

module.exports=tag