import mongoose, {Schema}  from "mongoose";


const tweetSchema = new Schema(
    {
        content:{
            type: String,
            required: true,
        },
        owner:{
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        comment:{
            type: Schema.Types.ObjectId,
            ref:"Comment",
        },
        tweet:{
            type: Schema.Types.ObjectId,
            ref:"Tweet",
        }
    },
    {
        timestamps: true
    }
)


export const Tweet = mongoose.model("Tweet", tweetSchema)