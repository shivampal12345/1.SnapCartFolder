import mongoose from "mongoose";
import { IUser } from "./user.model";

type UserRef = mongoose.Types.ObjectId | IUser;

export interface IOrder {
    _id?:mongoose.Types.ObjectId
    user:UserRef
    items:[
        {
            grocery:mongoose.Types.ObjectId,
            name:string,
            price:string,
            unit:string,
            image:string,
            quantity:number
        }
    ],
    isPaid: boolean
    totalAmount:number
    paymentMethod: "cod" | "online"
    address:{
        fullName:string,
        mobile:string,
        city:string,
        state:string,
        pinCode:string,
        fullAddress:string,
        latitude:number,
        longitude:number
    }
    assignment?:mongoose.Types.ObjectId
    assignedDeliveryBoy?:UserRef
    status: "pending" | "out for delivery" | "delivered"
    createdAt?:Date,
    updatedAt?:Date,
    deliveryOtp: string | null,
    deliveryOtpVerification : boolean,
    deliveredAt : Date
}

const orderSchema = new mongoose.Schema<IOrder>({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "User",
        required:true
    },
    items:[
        {
            grocery:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Grocery",
                required:true
            },
            name:String,
            price:String,
            unit:String,
            image:String,
            quantity:Number
        }
    ],
    paymentMethod: {
        type:String,
        enum:["cod","online"],
        default: "cod"
    },
    isPaid : {
        type:Boolean,
        default:false
    },
    totalAmount:Number,
    address:{
         fullName:String,
        mobile:String,
        city:String,
        state:String,
        pinCode:String,
        fullAddress:String,
        latitude:Number,
        longitude:Number
    },
    assignment: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"DeliveryAssignment",
        default:null
    },
    assignedDeliveryBoy: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    status:{
        type:String,
        enum:["pending", "out for delivery", "delivered"],
        default: "pending"
    },
    deliveryOtp:{
        type:String,
        default:null
    },
    deliveryOtpVerification:{
        type:Boolean,
        default:false
    },
    deliveredAt:{
        type:Date
    }
},{timestamps:true})

const Order = mongoose.models.Order || mongoose.model("Order",orderSchema)
export default Order;
