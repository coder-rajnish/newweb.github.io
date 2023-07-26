const mongoose=require('mongoose')

const Category=mongoose.Schema({
  
  name:
  {
      type:String,
      required:true
  }
}
)

const category=mongoose.model('category',Category)

module.exports=category