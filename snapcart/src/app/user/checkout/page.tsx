"use client";
import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {ArrowLeft,Building2,CreditCard,CreditCardIcon,Home,Loader2,MapPin,Navigation2,Phone,Search,Truck,User,} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import axios from "axios";
import dynamic from "next/dynamic";

const CheckoutMap = dynamic(() => import("@/components/CheckoutMap"), {
  ssr: false,
});

function Checkout() {
  const router = useRouter();
  const { userData } = useSelector((state: RootState) => state.user);
  const { subTotal,deliveryFee,finalTotal, cartData } = useSelector((state: RootState) => state.cart);
  const [address, setAddress] = useState({
    fullName: "",
    mobile: "",
    city: "",
    state: "",
    fullAddress: "",
    pinCode: "",
  });

  const[loading,setLoading] = useState(false)
  const[SearchQuery,setSearchQuery] = useState("");
  const [position, setPosition] = useState<[number, number] | null>(null);
  const[paymentMethod,setPaymentMethod] = useState<"cod" | "online">("cod")

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
      },(err)=>{console.log("Location Error",err)},{enableHighAccuracy:true,maximumAge:0,timeout:10000});
    }
  }, []);

  useEffect(() => {
    if (userData) {
      setAddress((prev) => ({ ...prev, fullName: userData?.name || "" }))
      setAddress((prev) => ({ ...prev, mobile: userData?.mobile || "" }))
    }
  }, [userData]);
  const handleSearchQuery = async () => {
    setLoading(true)
    const { OpenStreetMapProvider } = await import("leaflet-geosearch")
    const provider = new OpenStreetMapProvider()
    const results = await provider.search({ query: SearchQuery })
    if(results) {
        setLoading(false)
        setPosition([results[0].y,results[0].x])
    }
  }

  useEffect(()=>{
    const fetchAddress = async() => {
        if(!position) return
        try {
            const result =await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${position[0]}&lon=${position[1]}
                &format=json`)
                console.log(result.data)
                setAddress(prev=>({...prev,
                city:result.data.address.city,state:result.data.address.state,pinCode:result.data.address.postcode,
            fullAddress:result.data.display_name}))
        } catch (error) {
            console.log(error)
        }
    }
    fetchAddress();
  },[position])

  const handleCurrentLocation = () => {
     if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
      },(err)=>{console.log("Location Error",err)},{enableHighAccuracy:true,maximumAge:0,timeout:10000});
    }
  }

  const handleCod = async() => {
    if(!position){
      return null
    }
    try {
      const result = await axios.post("/api/user/order",{
        userId: userData?._id,
        items:cartData.map((item)=>(
          {
            grocery:item._id,
            name:item.name,
            price:item.price,
            unit:item.unit,
            quantity:item.quantity,
            image:item.image
          }
        )),
        totalAmount:finalTotal,
        address: {
          fullName:address.fullName,
          mobile:address.mobile,
          city:address.city,
          state:address.state,
          fullAddress:address.fullAddress,
          pinCode:address.pinCode,
          latitude:position[0],
          longitude:position[1]
        },
        paymentMethod
      })
      router.push("/user/order-success")
      console.log(result.data)
    } catch (error) {
      console.log(error)
    }
  }

  const handleOnlinePayment = async () => {
    if(!position){
      return null
    }
    try {
      const result = await axios.post("/api/user/payment",{
        userId: userData?._id,
        items:cartData.map((item)=>(
          {
            grocery:item._id,
            name:item.name,
            price:item.price,
            unit:item.unit,
            quantity:item.quantity,
            image:item.image
          }
        )),
        totalAmount:finalTotal,
        address: {
          fullName:address.fullName,
          mobile:address.mobile,
          city:address.city,
          state:address.state,
          fullAddress:address.fullAddress,
          pinCode:address.pinCode,
          latitude:position[0],
          longitude:position[1]
        },
        paymentMethod
      })
      window.location.href = result.data.url
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className="w-[92%] md:w-[80%] mx-auto py-10 relative">
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.97 }}
        className="absolute left-0 top-2 flex items-center gap-2 text-green-700 hover:text-green-800 font-semibold"
        onClick={() => router.push("/user/cart")}
      >
        <ArrowLeft size={16} />
        <span>Back to Cart</span>
      </motion.button>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-3xl md:text-4xl font-bold text-green-700 text-center mb-10"
      >
        Checkout
      </motion.h1>
      <div className="grid md:grid-cols-2 gap-8">
        <motion.div
          className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="text-green-700" /> Delivery Address
          </h2>

          <div className="space-y-4">
            <div className="relative">
              <User
                className="absolute left-3 top-3 text-green-600 "
                size={18}
              />
              <input
                type="text"
                value={address.fullName}
                className="pl-10 w-full border
                        rounded-lg p-3 text-sm bg-gray-50"
                onChange={(e) =>
                  setAddress((prev) => ({
                    ...prev,
                    fullName:e.target.value ,
                  }))
                }
              />
            </div>
            <div className="relative">
              <Phone
                className="absolute left-3 top-3 text-green-600 "
                size={18}
              />
              <input
                type="text"
                value={address.mobile}
                className="pl-10 w-full border
                        rounded-lg p-3 text-sm bg-gray-50"
                onChange={(e) =>
                  setAddress((prev) => ({ ...prev, mobile: e.target.value }))
                }
              />
            </div>
            <div className="relative">
              <Home
                className="absolute left-3 top-3 text-green-600 "
                size={18}
              />
              <input
                type="text"
                value={address.fullAddress}
                placeholder="Full Address"
                className="pl-10 w-full border
                        rounded-lg p-3 text-sm bg-gray-50"
                onChange={(e) =>
                    setAddress((prev) => ({
                      ...prev,
                      fullAddress:e.target.value ,
                    }))
                  }
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="relative">
                <Building2
                  className="absolute left-3 top-3 text-green-600 "
                  size={18}
                />
                <input
                  type="text"
                  value={address.city || ""}
                  placeholder="City"
                  className="pl-10 w-full border
                        rounded-lg p-3 text-sm bg-gray-50"
                  onChange={(e) =>
                    setAddress((prev) => ({
                      ...prev,
                      city:e.target.value,
                    }))
                  }
                />
              </div>
              <div className="relative">
                <Navigation2
                  className="absolute left-3 top-3 text-green-600 "
                  size={18}
                />
                <input
                  type="text"
                  value={address.state}
                  placeholder="State"
                  className="pl-10 w-full border
                        rounded-lg p-3 text-sm bg-gray-50"
                  onChange={(e) =>
                    setAddress((prev) => ({ ...prev, state: e.target.value }))
                  }
                />
              </div>
              <div className="relative">
                <Search
                  className="absolute left-3 top-3 text-green-600 "
                  size={18}
                />
                <input
                  type="text"
                  value={address.pinCode}
                  placeholder="PinCode"
                  className="pl-10 w-full border
                        rounded-lg p-3 text-sm bg-gray-50"
                  onChange={(e) =>
                    setAddress((prev) => ({
                      ...prev,
                      pinCode: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                placeholder="Search City or Area..."
                className="flex-1 border
                        rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                 value={SearchQuery} onChange={(e)=>setSearchQuery(e.target.value)}       
              />
              <button
                className="bg-green-600 text-white px-5 rounded-lg
                        hover:bg-green-700 transition-all font-medium"
                onClick={handleSearchQuery}        
              >
                {loading ? <Loader2 className="animate-spin" size={16}/> : "Search"}
              </button>
            </div>
            <CheckoutMap
              position={position}
              onPositionChange={setPosition}
              onUseCurrentLocation={handleCurrentLocation}
            />
          </div>
        </motion.div>
        <motion.div
         initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
         className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100
         h-fit"
        >
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard className="text-green-600"/> Payment Method</h2>
                <div className="space-y-4 mb-6">
                    <button className={`flex items-center gap-3 w-full border rounded-lg p-3 transition-all
                        ${paymentMethod === "online" ? "border-green-600 bg-green-50 shadow-sm"
                            : "hover:bg-gray-50"
                        }`} onClick={()=>setPaymentMethod("online")}>
                        <CreditCardIcon className="text-green-600"/><span className="font-medium
                        text-gray-700">Pay Online (stripe)</span>
                    </button>
                    <button className={`flex items-center gap-3 w-full border rounded-lg p-3 transition-all
                        ${paymentMethod === "cod" ? "border-green-600 bg-green-50 shadow-sm"
                            : "hover:bg-gray-50"
                        }`} onClick={()=>setPaymentMethod("cod")}>
                        <Truck className="text-green-600"/><span className="font-medium
                        text-gray-700">Cash On Delivery</span>
                    </button>
                </div>
                <div className="border-t pt-4 text-gray-700 space-y-2 text-sm sm:text-base">
                    <div className="flex justify-between">
                        <span className="font-semibold">Subtotal</span>
                        <span className="font-semibold text-green-600">₹{subTotal}</span>
                    </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Delivery Fee</span>
                        <span className="font-semibold text-green-600">₹{deliveryFee}</span>
                    </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span className="font-semibold">Final Total</span>
                        <span className="font-semibold text-green-600">₹{finalTotal}</span>
                    </div>
                </div>
                <motion.button
                whileTap={{scale:0.93}}
                className="w-full mt-6 bg-green-600 text-white py-3 rounded-full hover:bg-green-700 transition-all
                font-semibold"
                onClick={()=>{
                  if(paymentMethod == "cod"){
                    handleCod()
                  }else{
                    handleOnlinePayment()
                  }
                }}
                >
                  {paymentMethod == "cod" ? "Place Order" : "Pay & Place Order"}
                </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

export default Checkout;
