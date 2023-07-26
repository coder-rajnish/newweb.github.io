const  mongoose=require('mongoose');


mongoose.connect('mongodb://localhost:27017/loginAndregistration',{
    useCreateIndex:true,
    useNewUrlParser:true,
    useFindAndModify:true,
    useUnifiedTopology:true
})

const connection=mongoose.connection;

connection.once('open',()=>{
    console.log("DataBase Connceted")

}).catch(()=>{
    console.log("DataBase not Connected");
})