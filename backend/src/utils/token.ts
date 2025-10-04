import jwt, { JwtPayload } from 'jsonwebtoken';
import { PrismaClient, User } from "@prisma/client";
import  { Request, Response } from 'express';

const config =  {
    jwtSecret: "ba92aaf666a719325854331b4d2f2365740b90a134c733aabea76a8ddd20ed323f623fa05aa43f8e2d9696966e9c56b09d59ad95248dd6fa16a497169b57312c",
    jwtExpiresIn: "1d", // Access token expiry
    refreshTokenSecret: "KQ4F5kpRWXSApvDsHua1q8anCE5dy8LAqEE4a0uURkg=",
    refreshTokenExpiresIn: "14d", // Refresh token expiry
  };
const JWT_SECRET = process.env.JWT_SECRET || config.jwtSecret;
export  interface UserPayload extends JwtPayload {
    id: number;
    email: string;
    is_admin: boolean;
    is_developper: boolean;

  }

 
export const verifyToken = (token: string) => {
    try {
      return jwt.verify(token, JWT_SECRET) as UserPayload;
    } catch (error) {
      return null;
    }
};

export const verifyRefreshToken = (token: string) => {
    try {
      return jwt.verify(token, config.refreshTokenSecret) as UserPayload;
    } catch (error) {
      return null;
    }
};
  

export const generateToken = (user:User)=>{
    
  const token = jwt.sign(user, JWT_SECRET, {
    expiresIn: config.jwtExpiresIn,
  });

  return token;
}  
export const generateRefreshToken = (user:User)=>{
    
    const token = jwt.sign(user, config.refreshTokenSecret, {
      expiresIn: config.refreshTokenExpiresIn,
    });
  
    return token;
}  

export const userFromToken = (req:Request)  => {
    const authHeader = (req.headers as { authorization?: string }).authorization;
    if(!authHeader){
        return null
    }
    
    const user = verifyToken(authHeader.split(' ')[1]);

    if(user) {
        return user;
    }else{
        return null;
    }
}

export default config
