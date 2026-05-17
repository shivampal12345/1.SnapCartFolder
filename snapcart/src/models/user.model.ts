import mongoose from "mongoose";

 export interface IUser{
    _id?:mongoose.Types.ObjectId
    name:string
    email:string
    password?:string
    mobile?:string
    role:"user" | "deliveryBoy" | "admin",
    image:string
    location: {
    type: {
        type: StringConstructor;
        enum: string[];
        default: string;
    };
    coordinates: {
        type: NumberConstructor[];
        index: string;
        default: number[];
    };
},
socketId:string | null
isOnline:boolean
}

const userSchema = new mongoose.Schema<IUser>({
    name:{
        type:String
    },
    email:{
        type:String,
        unique:true
    },
    password:{
        type:String,
        required:false
    },
    mobile:{
        type:String,
        required:false
    },
    role:{
        type:String,
        enum:["user","deliverBoy","admin"],
        default:"user"
    },
    image:{
        type:String
    },
    location:{
        type:{
            type:String,
            enum:["Point"],
            default:"Point"
        },
        coordinates:{
            type:[Number],
            index:"2dsphere",
            default:[0,0]
        }
    },
    socketId:{
        type:String,
        default:null
    },
    isOnline:{
        type:Boolean,
        default:false
    }


},{timestamps:true})

userSchema.index({location:"2dsphere"})

const User = mongoose.models.User || mongoose.model("User",userSchema)

export default User;