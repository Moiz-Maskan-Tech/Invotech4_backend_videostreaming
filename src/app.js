import express from 'express'
import cors from 'cors';
import cookieParser from 'cookie-parser';
const app = express();

app.use(cors({
    origin : process.env.ORIGIN,
    credentials : true
}))

app.use(express.json({limit : "20kb"}))
app.use(express.urlencoded({extended : true , limit : "20kb"}))
app.use(express.static('public'))
app.use(cookieParser())

import userRouter from "./routes/user.routes.js";

// localhost:9090/api/v1/users/register   // we will be calling our api
app.use("/api/v1/users",userRouter)


export { app }

// res.send( 'moiz' )  -> insta