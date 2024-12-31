import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const subscription = mongoose.model("Subscription", subscriptionSchema);

// users -> a,b,c,d,e
// channels -> cac, hcc , fcc


//  channel -> cac
//  sub  -> a


//  channel -> cac
//  sub  -> b


//  channel -> cac
//  sub  -> c


//  channel -> hcc
//  sub  -> c

//  channel -> fcc
//  sub  -> b