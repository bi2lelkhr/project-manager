import express from "express";
import { Request, Response } from "express";
import ActiveDirectory from "activedirectory2";
import { Adconfig } from "../utils/adConfig";
import { prisma } from "./../index";
import {
  generateRefreshToken,
  generateToken,
  userFromToken,
  UserPayload,
  verifyRefreshToken,
} from "../utils/token";
import config from "./../utils/token";
import bcrypt from "bcryptjs";
import { io } from "../index"; 

const ad = new ActiveDirectory(Adconfig);
interface UserAd {
  displayName: string;
  email: string;
}

// export const login = (req: Request, res: Response) => {
//     ad.authenticate(req.body.username,req.body.password,(err,authenticated)=>{
//         if(authenticated) {
//             ad.isUserMemberOf(req.body.username,"DCSI",async (err,isMember)=>{
//                 ad.findUser(req.body.username,async(err,result: UserAd | null | any)=> {

//                     let user = await prisma.user.findFirst({where:{email:req.body.username}});

//                     if(!user){
//                     user =      await prisma.user.create({
//                             data:{
//                                 email:req.body.username,
//                                 username: result.displayName  ,
//                                 job_title:"CADRE",
//                                 is_developper:isMember,

//                             }
//                         })

//                     }
//                     const token =  generateToken(user);
//                     const refreshToken =  generateRefreshToken(user);

//                     res.json({success:true,message:"Authenticated successfully",user,token,refreshToken})
//                 })

//             })

//         }else{
//             res.status(403).json({message:"Wrong credentials",err})

//         }
//     });
// }

// export const account = (req:Request,res:Response)=>{
//     const user = userFromToken(req);
//     if(user){

//         res.json({success:true,user})
//     }else{
//         res.json({success:false,user})

//     }

// }

// export const users = async (req:Request,res:Response) =>  {
//     const users  =  await prisma.user.findMany({
//         include:{
//             developpersStack:{
//                 include:{
//                     dev_stack:true
//                 }
//             },
//             projectDevelopers:{
//                 include:{
//                     project:true
//                 }
//             }
//         }
//     })
//     res.json(users)
// }

// export const refreshToken = async (req: Request, res: Response) => {
//     const { refreshToken } = req.body;

//     if (!refreshToken) {
//         res.status(403).json({ message: "refresh token is required" });
//     } else {

//         // Cast the decoded token to TokenPayload to ensure type safety
//         let decoded: UserPayload | null;
//         try {
//             decoded = verifyRefreshToken(refreshToken);
//             const user = await prisma.user.findFirst({where:{email:decoded?.email}});
//             if(user){

//                 const accessToken = generateToken(user);
//                 const refreshToken = generateRefreshToken(user);
//                 res.status(200).json({success:true,message:"Authenticated successfully",user, accessToken,refreshToken });
//             }else{
//                   res.status(403).json({ message: "invalid refresh token" });

//             }
//         } catch (error) {
//             res.status(403).json({ message: "invalid refresh token" });
//         }

//     }

//   };

// export const login = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { email, password } = req.body;

//     // im checking for the input
//     if (!email || !password) {
//       res.status(400).json({ message: "Email and password are required" });
//       return;
//     }

//     //find the user by email
//     const user = await prisma.user.findFirst({
//       where: { email }
//     });

//     if (!user) {
//       res.status(401).json({ message: "Invalid credentials" });
//       return;
//     }

//     // Check if user has a password
//     if (!user.password) {
//       res.status(401).json({
//         message: "Please reset your password to continue using the new authentication system"
//       });
//       return;
//     }

//     // Verify password
//     const isPasswordValid = await bcrypt.compare(password, user.password);

//     if (!isPasswordValid) {
//       res.status(401).json({ message: "Invalid credentials" });
//       return;
//     }

//     // Generate tokens
//     const token = generateToken(user);
//     const refreshToken = generateRefreshToken(user);

//     res.json({
//       success: true,
//       message: "Authenticated successfully",
//       user: {
//         id: user.id,
//         email: user.email,
//         username: user.username,
//         job_title: user.job_title,
//         is_developper: user.is_developper,
//         is_admin: user.is_admin
//       },
//       token,
//       refreshToken
//     });

//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// }

// export const register = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { email, password, username, job_title, is_developper = false } = req.body;

//     // Input validation
//     if (!email || !password || !username || !job_title) {
//       res.status(400).json({ message: "All fields are required" });
//       return;
//     }

//     // Check if user already exists
//     const existingUser = await prisma.user.findFirst({
//       where: { email }
//     });

//     if (existingUser) {
//       res.status(400).json({ message: "User already exists" });
//       return;
//     }

//     // Hash password
//     const saltRounds = 12;
//     const hashedPassword = await bcrypt.hash(password, saltRounds);

//     // Create user
//     const user = await prisma.user.create({
//       data: {
//         email,
//         username,
//         job_title,
//         is_developper,
//         password: hashedPassword
//       }
//     });

//     // Generate tokens
//     const token = generateToken(user);
//     const refreshToken = generateRefreshToken(user);

//     res.status(201).json({
//       success: true,
//       message: "User created successfully",
//       user: {
//         id: user.id,
//         email: user.email,
//         username: user.username,
//         job_title: user.job_title,
//         is_developper: user.is_developper,
//         is_admin: user.is_admin
//       },
//       token,
//       refreshToken
//     });

//   } catch (error) {
//     console.error('Registration error:', error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// }

export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = userFromToken(req);

    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!currentPassword || !newPassword) {
      res
        .status(400)
        .json({ message: "Current password and new password are required" });
      return;
    }

    const dbUser = await prisma.user.findFirst({
      where: { email: user.email },
    });

    if (!dbUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    
    if (dbUser.password) {
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        dbUser.password
      );
      if (!isCurrentPasswordValid) {
        res.status(401).json({ message: "Current password is incorrect" });
        return;
      }
    }

    // im hashign here the passowrd
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await prisma.user.update({
      where: { id: dbUser.id },
      data: { password: hashedNewPassword },
    });

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const account = (req: Request, res: Response): void => {
  const user = userFromToken(req);
  if (user) {
    res.json( user );
  } else {
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

export const users = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      include: {
        developpersStack: {
          include: {
            dev_stack: true,
          },
        },
        projectDevelopers: {
          include: {
            project: true,
          },
        },
      },
    });
    res.json(users);
  } catch (error) {
    console.error("Users error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ message: "Refresh token is required" });
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findFirst({
      where: { email: decoded?.email },
    });

    if (user) {
      const accessToken = generateToken(user);
      const newRefreshToken = generateRefreshToken(user);
      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        user,
        accessToken,
        refreshToken: newRefreshToken,
      });
    } else {
      res.status(403).json({ message: "Invalid refresh token" });
    }
  } catch (error) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email,
      password,
      username,
      job_title,
      is_developper = false,
    } = req.body;

    if (!email || !password || !username || !job_title) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const existingUser = await prisma.user.findFirst({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        job_title,
        is_developper,
        password: hashedPassword,
      },
    });

  
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type: "WELCOME",
        entityId: user.id,
        message: `Welcome ${user.username}, your account has been created!`,
      },
    });

    io.to(user.id).emit("notification", notification);

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        job_title: user.job_title,
        is_developper: user.is_developper,
        is_admin: user.is_admin,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    if (!user.password) {
      res.status(401).json({
        message:
          "Please reset your password to continue using the new authentication system",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // im fetching unread notifications
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id, isRead: false },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        job_title: user.job_title,
        is_developper: user.is_developper,
        is_admin: user.is_admin,
      },
      token,
      refreshToken,
      notifications,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
