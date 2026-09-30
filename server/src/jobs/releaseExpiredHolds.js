import { Booking } from "../models/Booking.js";
import { Container } from "../models/Container.js";

export async function releaseExpiredHolds(io) {
  const now = new Date();
  const expired = await Booking.find({ status: "HELD", holdExpiresAt: { $lt: now } });

  for (const booking of expired) {
    booking.status = "CANCELLED";
    await booking.save();
    await Container.findByIdAndUpdate(booking.containerId, {
      $inc: {
        "available.cbm": booking.cargo.cbm,
        "available.kg": booking.cargo.kg,
        "booked.cbm": -booking.cargo.cbm,
        "booked.kg": -booking.cargo.kg,
      },
    });
    io?.emit("space:updated", { containerId: booking.containerId });
  }

  if (expired.length) {
    console.log(`Released ${expired.length} expired booking holds`);
  }
}
