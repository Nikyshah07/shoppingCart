import mongoose from "mongoose";

const userSchema=mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }
    ,
    token:{
        type:String,
        default:null
    },
    cart:{
        type:Array,
        default:[]
    },
    wishlist:{
        type:Array,
        default:[]
    }
})
const User=mongoose.model('user',userSchema);
export default User