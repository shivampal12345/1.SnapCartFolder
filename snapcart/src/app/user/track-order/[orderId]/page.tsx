'use client'
import LiveMap from '@/components/LiveMap';
import { getSocket } from '@/lib/socket';
import { IUser } from '@/models/user.model';
import { RootState } from '@/redux/store';
import axios from 'axios';
import { ArrowLeft, Loader, Send, Sparkle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux';
import {AnimatePresence, motion} from 'motion/react'
import { IMessage } from '@/models/message.model';

 interface IOrder {
    _id?:string
    user:IUser
    items:[
        {
            grocery:string,
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
    assignment?:string
    assignedDeliveryBoy?:IUser
    status: "pending" | "out for delivery" | "delivered"
    createdAt?:Date,
    updatedAt?:Date
}

interface ILocation {
    latitude:number,
    longitude:number
}

function TrackOrder({params}:{params:{orderId:string}}) {
  const {userData} = useSelector((state:RootState)=>state.user)
  const { orderId } = useParams<{ orderId: string }>()
  const [order,setOrder] = useState<IOrder>()
  const router = useRouter()
  const[newMessage,setNewMessage] = useState("")
  const[messages,setMessages] = useState<IMessage[]>()
  const chatBoxRef = useRef<HTMLDivElement>(null)
  const [suggestions,setSuggestions] = useState([])
      const[loading,setLoading] = useState(false)
  const [userLocation, setUserLocation] = useState<ILocation>(
         {
             latitude:0,
             longitude:0
         }
     )
     const [deliveryBoyLocation,setDeliveryBoyLocation] = useState<ILocation>(
         {
             latitude:0,
             longitude:0
         }
     )


  useEffect(()=>{
    const getOrder = async() => {
      if (!orderId) return
      try {
        const result = await axios.get(`/api/user/get-order/${orderId}`)
        setOrder(result.data)
        setUserLocation({
          latitude:result.data.address.latitude,
          longitude:result.data.address.longitude
        })
        setDeliveryBoyLocation({
          latitude:result.data.assignedDeliveryBoy.location.coordinates[1],
          longitude:result.data.assignedDeliveryBoy.location.coordinates[0]
        })
      } catch (error) {
        console.log(error)
      }
    }
    getOrder();
  },[orderId,userData?._id])

  useEffect(():any=>{
    const socket = getSocket()
    socket.on("update-deliveryBoy-location",({userId,location})=>{
      if(userId.toString() === order?.assignedDeliveryBoy?._id?.toString()){
          setDeliveryBoyLocation({
            latitude:location.coordinates[1],
            longitude:location.coordinates[0]
          })
      }
    })
    return ()=> socket.off("update-deliveryBoy-location")
  },[order])

    useEffect(()=>{
          const socket = getSocket()
          socket.emit("join-room",orderId)
          const handleMessage = (message: IMessage) => {
            if(message.roomId?.toString() === orderId){
              setMessages((prev)=>prev ? [...prev,message] : [message])
            }
          }

          socket.on("send-message",handleMessage)

          return () => {
            socket.off("send-message",handleMessage)
          }
      },[orderId])
  
      const sendMsg = () => {
          if(!newMessage.trim()) return
          const socket = getSocket()
          const message = {
              roomId:orderId,
              text:newMessage,
              senderId:userData?._id,
              time:new Date().toLocaleTimeString([],{
                  hour:"2-digit",
                  minute:"2-digit"
              })
          }
          socket.emit("send-message",message)
          setNewMessage("")
      } 
       useEffect(()=>{
               const getAllMessages = async() => {
                  if (!orderId) return
                   try {
                       const result =await axios.post("/api/chat/messages",{roomId:orderId})
                       // console.log(result.data)
                       setMessages(result.data)
                   } catch (error) {
                       console.log(error)
                   }
               }
               getAllMessages()
           },[orderId])

           useEffect(()=>{
                   chatBoxRef.current?.scrollTo({
                       top:chatBoxRef.current.scrollHeight,
                       behavior:'smooth'
                   })
               },[messages])

                const getSuggestions = async() => {
                       setLoading(true)
                       try {
                           const recentMessages = messages
                           ?.slice(-5)
                           .map((msg)=>msg.text)
                           .filter((text)=>text?.trim())
               
                           if(!recentMessages?.length) return
                           const result = await axios.post("/api/chat/ai-suggestions",{message:recentMessages,role:"user"})
                           if(Array.isArray(result.data?.suggestions) && result.data.suggestions.length > 0){
                               console.log("AI suggestions:", result.data.suggestions)
                               setSuggestions(result.data.suggestions)
                               setLoading(false)
                           }
               
                       } catch (error) {
                           console.log(error)
                           setSuggestions([])
                           setLoading(false)
                       }
                   }

  return (
    <div className='w-full min-h-screen bg-linear-to-b from-green-50 to-white'>
      <div className='max-w-2xl mx-auto pb-24'>
        <div className='sticky top-0 bg-white/80 backdrop-blur-xl p-4 border-b shadow gap-3 flex items-center z-999'>
          <button onClick={()=>router.back()}
          className='p-2 bg-green-100 rounded-full'><ArrowLeft className='text-green-700' size={20}/></button>
          <div>
            <h2 className=''>Track Order</h2>
            <p className='text-sm text-gray-600'>order#{order?._id?.toString().slice(-6)} 
              <span className='text-green-700 font-semibold'>{order?.status}</span></p>
          </div>
        </div>
        <div className='px-4 mt-6 space-y-4'>
            <div className='rounded-3xl overflow-hidden border shadow'>
                <LiveMap userLocation={userLocation} deliveryBoyLocation={deliveryBoyLocation}/>
            </div>

               <div className='bg-white rounded-3xl shadow-lg border p-4 h-[430px] flex flex-col'>
                 <div className='flex justify-between items-center mb-3'>
        <span className=' font-semibold text-gray-700 text-sm'>Quick Replies</span>
        <motion.button 
        whileTap={{scale: 0.9}}
        disabled={loading}
        className='px-3 py-1 text-xs flex items-center gap-1 bg-purple-100 
        text-purple-700 rounded-full shadow-sm border border-purple-200 cursor-pointer'
        onClick={getSuggestions}>
            <Sparkle size={14}/>{loading?<Loader className='w-5 h-5 animate-spin'/>:"AI Suggest"}</motion.button>
    </div>
    <div className='flex gap-2 flex-wrap mb-3'>
        {suggestions.map((s,index)=>(
            <motion.div
            key={index}
            whileTap={{scale: 0.92}}
            className='px-3 py-1 text-xs bg-green-50 border border-green-200 cursor-pointer text-green-700 rounded-full'
            onClick={()=>setNewMessage(s)}
            >
                {s}
            </motion.div>
        ))}
    </div>
        <div className='flex-1 overflow-y-auto p-2 space-y-3'ref={chatBoxRef}>
            <AnimatePresence>
                {messages?.map((msg,index)=>(
                    <motion.div
                    key={msg._id?.toString()}
                    initial={{opacity:0,y:15}}
                    animate={{opacity:1,y:0}}
                    exit={{opacity:0}}
                    transition={{duration:0.2}}
                    className={`flex ${msg.senderId.toString()==userData?._id?"justify-end":"justify-start"}`}
                    >
                        <div className={`px-4 py-2 max-w-[75%] rounded-2xl shadow
                            ${
                                msg.senderId.toString() == userData?._id
                                ?"bg-green-600 text-white rounded-br-none"
                                :"bg-gray-100 text-gray-800 rounded-bl-none"
                            }`}>
                            <p>{msg.text}</p>
                            <p className='text-[10px] opacity-70 mt-1 text-right'>{msg.time}</p>
                        </div>

                    </motion.div>
                ))}
            </AnimatePresence>

        </div>
        <div className='flex gap-2 mt-3 border-t pt-3'>
            <input type="text" placeholder='Type a Message...'className='flex-1 bg-gray-100 px-4 py-2 rounded-xl outline-none
            focus:ring-2 focus:ring-green-500'onChange={(e)=>setNewMessage(e.target.value)} value={newMessage}/>
            <button className='bg-green-600 hover:bg-green-700 p-3 rounded-xl
            text-white' onClick={sendMsg}><Send size={18}/></button>
        </div>
    </div>



        </div>
      </div>
    </div>
  )
}

export default TrackOrder;
