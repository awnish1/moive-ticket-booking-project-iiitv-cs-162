const fs=require("fs")
const path=require("path")
const mongoose=require("mongoose")

require("dotenv").config({
  path: "./src/.env"
});

const Theater = require("../src/models/Theater");

async function seedDatabase(){

    console.log("seeding initiated")

    try{

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("Connected to MongoDB")

        console.log("Database:", mongoose.connection.name);

        const jsonPath=path.join(__dirname,"../data/theaters.json")

        const theaters=JSON.parse(fs.readFileSync(jsonPath,"utf8"))

        await Theater.deleteMany({})

        console.log("Old theaters deleted")

        await Theater.insertMany(theaters)

        console.log("Theaters insert successfully")

        mongoose.connection.close();
    }

    catch (err){

        console.error(err);}

}

seedDatabase();


