import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest) {
    try {
        await connectDb();
        const {userId,socketId} = await req.json()
        await User.findByIdAndUpdate(userId,{socketId,isOnline:true},{new:true})
        if(!userId){
                return NextResponse.json({message:"User not found"},{status:400}) 
        }
        return NextResponse.json({success:true},{status:200})
    } catch (error) {
        return NextResponse.json({success:false},{status:500})
    }
} 