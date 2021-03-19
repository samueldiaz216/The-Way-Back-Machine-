const express=require("express");
const cors=require("cors");
const mongoose=require("mongoose");
const router=express.Router();
let Listing=require('./models/listing.model');
const {v4: uuidv4} = require('uuid');

const stripe=require("stripe")
("sk_test_51ITv8TJjkYkHXubONBeayjgAciecDQfC1hCZCElLho13zDRodYwMuoUUyBD76ctXkSnsV2sLWJUJMhTZmqFPZyyw00y65xnDGO");

require('dotenv').config();

const app=express();
const port=process.env.PORT||5000;

app.use(cors());
app.use(express.json());

const uri=process.env.ATLAS_URI;
mongoose.connect(uri,{useNewUrlParser:true, useCreateIndex:true, useUnifiedTopology: true });

const connection=mongoose.connection;
connection.once('open',()=>{
    console.log("MongoDB database connection established");
})

app.listen(port, ()=>{
    console.log(`Server is running on ${port}`);
});



app.get('/', function (req, res) {
    Listing.find()
        .then(listings=> res.json(listings))
        .catch(err=> res.status(400).json('Error: '+err))
});

app.get('/:id', function (req, res) {
    Listing.findById(req.params.id)
        .then(listing=> res.json(listing))
        .catch(err=> res.status(400).json('Error: '+err))
});

app.post('/', function (req,res){
    console.log("post");
    const name=req.body.name;
    const price=Number(req.body.price);
    const description=req.body.description;
    const image=req.body.image;
    const size=req.body.size;
    const era=req.body.era;
    const notes=req.body.notes

    const newListing = new Listing({
        name,
        price,
        description,
        image,
        size,
        era,
        notes
    });

    newListing.save()
        .then(()=>res.json('Listing added'))
        .catch(err=>res.status(400).json('Error: '+ err));
});

app.post("/checkout",async (req, res)=>{
    console.log("Request:", req.body);

    let error;
    let status;
    try{
        const {basket,token}=req.body;

        const customer = await
        stripe.customers.create({//Creates customer
            email: token.email,
            source: token.id
        });

        const idempotencyKey=uuidv4();
        //Unique string to make sure customer isn't charged twice
        const charge = await stripe.charges.create(//Create a charge
            {
                amount:basket.price*100,//Converting dollars to cents
                currency: "usd",
                customer: customer.id,
                receipt_email: token.email,
                description:`Purchased the ${basket}`,
                shipping:{
                    name:token.card.name,
                    address:{
                        line1: token.card.address_line1,
                        line2:token.card.address_line2,
                        city: token.card.address_city,
                        country:token.card.address_country,
                        postal_code: token.card.address_zip
                    }
                }
            },
            {
                idempotencyKey
            }
        );
        console.log("Charge:",{charge});
        status="success";
    }catch(error){
        console.error("Error:", error);
        status="failure";
    }

    res.json({error, status})
})