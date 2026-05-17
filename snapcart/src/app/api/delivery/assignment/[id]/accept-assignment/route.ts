import { auth } from "@/auth";
import connectDb from "@/lib/db";
import emitEventHandler from "@/lib/emitEventHandler";
import DeliveryAssignment from "@/models/deliveryAssigment.model";
import Order from "@/models/order.model";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();

    const { id } = await params;

    const session = await auth();
    const deliveryBoyId = session?.user?.id;

    if (!deliveryBoyId) {
      return NextResponse.json({ message: "unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ message: "invalid id" }, { status: 400 });
    }

    const alreadyAssigned = await DeliveryAssignment.findOne({
      assignedTo: deliveryBoyId,
      status: { $nin: ["broadcasted", "completed"] }
    });

    if (alreadyAssigned) {
      return NextResponse.json({ message: "already assigned to other order" }, { status: 400 });
    }

    // Use atomic operation to prevent race conditions
    const updatedAssignment = await DeliveryAssignment.findOneAndUpdate(
      {
        _id: id,
        status: "broadcasted"
      },
      {
        $set: {
          assignedTo: deliveryBoyId,
          status: "assigned",
          acceptedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updatedAssignment) {
      // Check why it failed
      const assignment = await DeliveryAssignment.findById(id);
      if (!assignment) {
        return NextResponse.json({ message: "assignment not found" }, { status: 404 });
      }
      return NextResponse.json({ 
        message: "assignment expired", 
        currentStatus: assignment.status,
        assignedTo: assignment.assignedTo
      }, { status: 400 });
    }

    const order = await Order.findByIdAndUpdate(
      updatedAssignment.order,
      { assignedDeliveryBoy: deliveryBoyId },
      { new: true }
    );

    if (!order) {
      return NextResponse.json({ message: "order not found" }, { status: 404 });
    }
    await order.populate("assignedDeliveryBoy")
    await emitEventHandler("order-assigned",{orderId:order._id, assignedDeliveryBoy:order.assignedDeliveryBoy})

    await DeliveryAssignment.updateMany(
      {
        _id: { $ne: updatedAssignment._id },
        broadcastedTo: deliveryBoyId,
        status: "broadcasted"
      },
      {
        $pull: { broadcastedTo: deliveryBoyId }
      }
    );

    return NextResponse.json(
      { message: "Order Accepted Successfully" },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("ACCEPT ERROR:", error); // 🔥 IMPORTANT
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}