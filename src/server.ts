import express, {type Request, type Response, type NextFunction} from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {Pool} from 'pg';
import predictRoutes from './routes/predict.js'

//read the env file
dotenv.config();

//console everytime request recieved 
const myLogger = function (req: Request, res: Response, next:NextFunction) {
  console.log("Logged")
  next()
}


//create express app
const app = express();
const PORT = process.env.PORT || 3000

//cors
app.use(myLogger);
app.use(cors());
app.use(express.json());
app.use("/predict", predictRoutes);

//pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {rejectUnauthorized:false} //this should need to change publicly
});

//health check supabase api - get db time
app.get('/api/health', async (req: Request, res: Response) => {
    try {

        fetch(`${process.env.FASTAPI_URL}/health`).then((res)=> console.log("FastApi Booted"))
            .catch((err) => console.log("Error",err.message));

        const result =  await pool.query('SELECT NOW()')
        res.json({
            status: "success",
            message: "System is Online.",
            db_time: result.rows[0].now
        });
    } catch (error) {
        console.error("Database connection failed", error);
        res.status(500).json({error: 'Database offline'});
    }
});

app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`)
})