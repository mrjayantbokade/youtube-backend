import mongoose, { Schema, mongo } from "mongoose";


const subscriptionSchema = new Schema({

    // id: {
    //     typeof: Schema.Types.ObjectId,
    //     ref: "User"
        
    // },
    subscriber: {
        // typeof: Number,
        // required: true,
        // default: 0,
        //the subcribers count
        typeof: Schema.Types.ObjectId,
        ref: "User",

    }, 
    channel: {
        //the one who is getting subscribed
        typeof: Schema.Types.ObjectId,
        ref: "User",
    }


}, { timestamps: true })

export const Subscription  = mongoose.model("Subscription", subscriptionSchema)