const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const listingSchema=new Schema({
    name:String,
    price:Number,
    description:String,
    image:String,
    size:String,
    era:String,
    notes:String

})

const Listing=mongoose.model('Listing', listingSchema)

module.exports=Listing