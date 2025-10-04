// import express from "express";
// import { Deploiment, PrismaClient } from "@prisma/client";
// import dotenv from 'dotenv';
// import cors from 'cors';
// import authRoutes from "./routes/authRoutes";
// import zoneRoutes from "./routes/zoneRoutes";
// import quertierRoutes from "./routes/quartierRoutes";
// import devStackRoutes from "./routes/devStackRoutes";
// import risqueRoutes from "./routes/risqueRoutes";
// import typeNoeudRoutes from "./routes/typeNoeudRoutes";
// import noeudRoutes from "./routes/noeudRoutes";
// import deploiementRoutes from "./routes/deploimentAndHistoryRoutes";
// import projectRoutes from "./routes/projectRoutes";
// import sprintRoutes from "./routes/sprintRoutes";
// import projectsRisqueRoutes from "./routes/projectsRisqueRoutes"
// import infrastructureRoutes from "./routes/infrastructureRoutes"
// import { Request, Response } from 'express';
// import session from "express-session";
// import { authenticator } from "otplib";
// import QRCode from 'qrcode';
// import { createClient } from "redis";

// const app = express();
// export const prisma = new PrismaClient();

// app.use(express.json());

// dotenv.config();

// app.use(express.urlencoded({ extended: true }));

// app.use(cors({
//   origin: ['http://localhost:5173', 'http://localhost:8080'], // Allow both origins
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//   credentials: true // Important for cookies/auth headers
// }));

// // Routes
// app.get("/", (req, res) => {
//   res.send("Welcome to Express.js with Prisma!");
// });
// app.post("/api/webhook", async (req: Request, res: Response) => {
//   const repositoryUrl = req.body.commits[0].url.toString().split("/-/")[0];

//   console.log("Webhook received: ", repositoryUrl , req.body);
//   try {

//     // Use raw query to cast input to TEXT
//     const deploy = await prisma.$queryRaw<Deploiment[]>`
//     SELECT id, type, link, repository, is_alive, projectId
//     FROM Deploiment
//     WHERE repository LIKE CAST(${repositoryUrl} AS TEXT)
//   `;

//     // Log the received webhook data
//     if(!deploy || deploy.length === 0){

//       console.log("Webhook received but deploiment not found:", req.body);
//       res.status(200).json({message:"deploiment not found"});

//     }else {

//       const deployHistory  = await prisma.deploy_history.create({
//         data:{

//           date_dep:new Date(),
//           commit:req.body.commits[0].message,
//           is_success:true,
//           author:req.body.user_name,
//           deploiment:{
//             connect:{
//               id:deploy[0].id
//             }

//           }
//         }
//       });
//       console.log("Webhook treated :", deployHistory);
//       res.status(200).send({message:"ok",deployHistory});
//     }

//   } catch (error) {
//     console.error("Error processing webhook:", error);
//     res.status(500).json({ error: 'Failed to process webhook', details: error });
//   }

// })

// app.use('/api/auth', authRoutes);
// app.use('/api/zones', zoneRoutes);
// app.use('/api/quartiers', quertierRoutes);
// app.use('/api/dev-stacks', devStackRoutes);
// app.use('/api/risques', risqueRoutes);
// app.use('/api/type-noeuds', typeNoeudRoutes);
// app.use('/api/noeuds', noeudRoutes);
// app.use('/api/deploiments', deploiementRoutes);
// app.use('/api/sprints', sprintRoutes);
// app.use('/api/projects', projectRoutes);
// app.use('/api/project-risques', projectsRisqueRoutes)
// app.use('/api/infrastructure' , infrastructureRoutes)

// // keep it commented till you're ready to use 2FA

// // app.use(
// //   session({
// //     secret: 'your-secret-key', // Replace with a secure key
// //     resave: false,
// //     saveUninitialized: false,
// //   })
// // );

// // // In-memory store for user secrets (replace with a database in production)
// // const userSecrets: { [email: string]: string } = {};

// // // Initialize Redis client
// // const redisClient = createClient({
// //   url: 'redis://localhost:6379', // Default Redis URL; adjust if using a remote instance
// // });

// // redisClient.on('error', (err) => console.error('Redis Client Error', err));

// // // Connect to Redis
// // (async () => {
// //   await redisClient.connect();
// //   console.log('Connected to Redis');
// // })();

// // app.get('/setup-2fa', async (req: Request, res: Response) => {
// //   const email = 'user@example.com'; // Replace with actual user email (e.g., from req.user)

// //   // Generate a secret
// //   const secret = authenticator.generateSecret();

// //   // Store the secret in Redis with the email as the key
// //   try {
// //     await redisClient.set(`2fa_secret:${email}`, secret); // Prefix key for clarity
// //     // Optional: Set an expiration time (e.g., 1 hour = 3600 seconds)
// //     await redisClient.expire(`2fa_secret:${email}`, 3600);
// //   } catch (err) {
// //     console.error('Redis SET error:', err);
// //      res.status(500).json({ error: 'Failed to store secret' });
// //   }

// //   // Generate otpauth URL for Google Authenticator
// //   const otpauthUrl = authenticator.keyuri(email, 'Project manager', secret);

// //   // Generate QR code
// //   QRCode.toDataURL(otpauthUrl, (err, qrCodeUrl) => {
// //     if (err) {
// //       return res.status(500).json({ error: 'Failed to generate QR code' });
// //     }

// //     res.send(`
// //       <h1>Scan this QR code with Google Authenticator</h1>
// //       <img src="${qrCodeUrl}" alt="QR Code" />
// //       <p>Or manually enter this secret: ${secret}</p>
// //       <form action="/verify-2fa" method="POST">
// //         <input type="text" name="token" placeholder="Enter 6-digit code" />
// //         <button type="submit">Verify</button>
// //       </form>
// //     `);
// //   });
// // });

// // app.post('/verify-2fa', async (req: Request, res: Response) => {
// //   const { token } = req.body;
// //   const email = 'user@example.com'; // Replace with actual user email

// //   // Retrieve the secret from Redis
// //   var secret: string | null ="";
// //   try {
// //     secret = await redisClient.get(`2fa_secret:${email}`);
// //   } catch (err) {
// //     console.error('Redis GET error:', err);
// //       res.status(500).json({ error: 'Failed to retrieve secret' });
// //   }

// //   if (!secret) {
// //       res.status(400).json({ error: '2FA not set up or secret expired' });
// //   }

// //   // Verify the token
// //   const isValid = authenticator.verify({ token, secret:secret ?? "" });

// //   if (isValid) {
// //     // Optionally delete the secret after successful verification
// //     await redisClient.del(`2fa_secret:${email}`);
// //     res.json({ message: '2FA verification successful!' });
// //   } else {
// //     res.status(401).json({ error: 'Invalid 2FA code' });
// //   }
// // });

// // Start server
// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });

import express from "express";
import { Deploiment, PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import zoneRoutes from "./routes/zoneRoutes";
import quertierRoutes from "./routes/quartierRoutes";
import devStackRoutes from "./routes/devStackRoutes";
import risqueRoutes from "./routes/risqueRoutes";
import typeNoeudRoutes from "./routes/typeNoeudRoutes";
import noeudRoutes from "./routes/noeudRoutes";
import deploiementRoutes from "./routes/deploimentAndHistoryRoutes";
import projectRoutes from "./routes/projectRoutes";
import sprintRoutes from "./routes/sprintRoutes";
import projectsRisqueRoutes from "./routes/projectsRisqueRoutes";
import infrastructureRoutes from "./routes/infrastructureRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import { Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import "./cron/sprintCron";
import "./cron/taskCron";

dotenv.config();

const app = express();
export const prisma = new PrismaClient();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:8080"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);



// create HTTP server and attach Express
const httpServer = createServer(app);

// im creating Socket.IO server
export const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:8080"],
    methods: ["GET", "POST" , "PUT", "DELETE"  ,"PATCH"],
  },
});


// Store active sockets for debugging (optional)
const activeUsers = new Map();

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // User joins their personal room
  socket.on("join", (userId) => {
    socket.join(userId);
    activeUsers.set(userId, socket.id);
    console.log(`User ${userId} joined room ${userId}`);
  });

  // User leaves / disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    // Remove from activeUsers
    for (let [userId, sId] of activeUsers.entries()) {
      if (sId === socket.id) activeUsers.delete(userId);
    }
  });
});





// Routes
app.get("/", (req, res) => {
  res.send("Welcome to Express.js with Prisma + Socket.IO!");
});

app.post("/api/webhook", async (req: Request, res: Response) => {
  const repositoryUrl = req.body.commits[0].url.toString().split("/-/")[0];

  console.log("Webhook received: ", repositoryUrl, req.body);

  try {
    const deploy = await prisma.$queryRaw<Deploiment[]>`
      SELECT id, type, link, repository, is_alive, projectId
      FROM Deploiment
      WHERE repository LIKE CAST(${repositoryUrl} AS TEXT)
    `;

    if (!deploy || deploy.length === 0) {
      console.log("Webhook received but deploiment not found:", req.body);
      res.status(200).json({ message: "deploiment not found" });
    } else {
      const deployHistory = await prisma.deploy_history.create({
        data: {
          date_dep: new Date(),
          commit: req.body.commits[0].message,
          is_success: true,
          author: req.body.user_name,
          deploiment: {
            connect: {
              id: deploy[0].id,
            },
          },
        },
      });

      console.log("Webhook treated:", deployHistory);

      io.emit("deployUpdate", {
        message: "New deploy executed 🚀",
        data: deployHistory,
      });

      res.status(200).send({ message: "ok", deployHistory });
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    res
      .status(500)
      .json({ error: "Failed to process webhook", details: error });
  }
});

app.options("*", cors()); 



app.use("/api/auth", authRoutes);
app.use("/api/zones", zoneRoutes);
app.use("/api/quartiers", quertierRoutes);
app.use("/api/dev-stacks", devStackRoutes);
app.use("/api/risques", risqueRoutes);
app.use("/api/type-noeuds", typeNoeudRoutes);
app.use("/api/noeuds", noeudRoutes);
app.use("/api/deploiments", deploiementRoutes);
app.use("/api/sprints", sprintRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/project-risques", projectsRisqueRoutes);
app.use("/api/infrastructure", infrastructureRoutes);
app.use("/api/notifications", notificationRoutes);

// Start server with httpServer (not app.listen)
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(` Server is running on http://localhost:${PORT}`);
});
