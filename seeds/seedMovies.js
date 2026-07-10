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

        const jsonPath=path.join(__dirname,"../data/movies.json")

        const movies=JSON.parse(fs.readFileSync(jsonPath,"utf-8"));

        await Movie.deleteMany({})

        console.log("Old Movies deleted")

        await Movie.insertMany(movies)

        console.log("Movies insert successfully")

        await mongoose.connection.close();
    }

    catch(err){

        console.error(err);
    }
}

seedDatabase();