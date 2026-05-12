import {type Request, type Response, type NextFunction} from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import ws from 'ws';
//read the env file
dotenv.config();
//init 
const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
        auth: {
            persistSession: false 
        },
        global: {
            fetch: (...args: Parameters<typeof fetch>) => fetch(...args)
        },
        realtime: {
            transport: ws 
        }
    } as any
);

export interface AuthenticatedRequest extends Request{
    user?: any
}

//middleware func
export const authenticateUser = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const token = req.headers.authorization?.split(' ')[1];

    if(!token){
        return res.status(401).json({error: "No token provided"});
    }

    const{ data: {user}, error } = await supabase.auth.getUser(token);

    if(error || !user){
        return res.status(401).json({error: "Invalid or expired token" });
    }

    req.user = user;
    next();
};
   


