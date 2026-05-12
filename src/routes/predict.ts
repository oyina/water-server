import { Router, type Response } from "express";
import dotenv from 'dotenv';
import axios from 'axios';
import { createClient } from "@supabase/supabase-js";
import { authenticateUser, type AuthenticatedRequest } from "../middleware/auth.js";
import { type PredictionRequest } from '../types/predictions.js';
import ws from 'ws';
//read the env file
dotenv.config();
const router = Router();

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
        auth: { 
            persistSession: false 
        },
        global: { 
            fetch: fetch 
        },
        realtime: { 
            transport: ws 
        }
    } as any 
)

router.post('/', authenticateUser, async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    const { lake, inputs}: PredictionRequest = req.body;
    const userId = req.user.id;
    console.log(lake);

    try {
        const { data: cacheHit } = await supabase
            .from("user_queries")
            .select("prediction_result")
            .eq("user_id", userId)
            .eq("lake_name", lake)
            .eq("precip",inputs[0])
            .eq("evap",inputs[1])
            .eq("air_temp",inputs[2])
            .eq("land_precip",inputs[3])
            .eq("land_evap",inputs[4])
            .eq("land_air_temp",inputs[5])
            .single();
    
        //pull cache from supabase
        if(cacheHit){
            return res.json({result: cacheHit.prediction_result, source:'cache'});
        }
        
        //call fast
        const response = await axios.post(`${process.env.FASTAPI_URL}/predict/${lake}`,{
            precip: inputs[0],
            evap: inputs[1],
            airtemp: inputs[2],      
            land_precip: inputs[3],
            land_evap: inputs[4],
            land_airtemp: inputs[5]
        });

        const result = response.data.levels;

        //store
        const {error: insertError} = await supabase.from('user_queries').insert({
            user_id: userId,
            prediction_result: result,
            lake_name: lake,
            precip: inputs[0],
            evap: inputs[1],
            air_temp: inputs[2],
            land_precip: inputs[3],
            land_evap: inputs[4],
            land_air_temp: inputs[5],
        });

        if (insertError) {
            console.error("Supabase Save Error:", insertError);
        }

        res.json({result, source: "api"});
    } catch (error) {
        console.log(error);
        res.status(500).json({error: "Prediction failed"});
    }
});

export default router;