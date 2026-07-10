const fs=require("fs")
const path=require("path")
const mongoose=require("mongoose")

require("dotenv").config({
    path:"./src/.env"
})

const Movie=require("../src/models/Movie")

async function seedDatabase(){

    console.log("Seeding initiated");

    try{

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("Connected to MongoDB")

        const jsonPath=path.join(__dirname,"../data/Movie.json")

        const movies=JSON.parse(fs.readFileSync(jsonPath));

        await Movie.deleteMany({})

        console.log("Old theaters deleted")

        await Movie.insertMany(movies)

        console.log("Movies insert successfully")

        mongoose.connection.close();
    }

    catch(err){

        console.error(err);
    }

    seedDatabase();

}