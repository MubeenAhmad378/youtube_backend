import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";  // ✅ Use existing app

// Load environment variables
dotenv.config({
    path : './env'
});


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 ,()=>{
        console.log(`Server running at this port ${process.env.PORT}`);
        
    })
})
.catch((err)=>{
  console.log('Mongo DB connection failed error', err);
  
})












/* one method to conect db but we choice second approach .
const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`); // Added "/" between URI and DB name

    app.on("error", (error) => {
      console.error("App Error:", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`App listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Connection Error:", error);
    throw error; 
  }
})();
*/