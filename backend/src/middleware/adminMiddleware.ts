// import { userFromToken } from "../utils/token";
// import  { Request, Response } from 'express';
// import { NextFunction } from "express";


// export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
//     const user =  userFromToken(req);
//     if (user == null) {
//         res.status(403).json({
//             message: "UnAuthorized.",
//         });
//     }
//     else if(user.is_admin  ) {
        
//         next();
//     }else{
//         res.status(403).json({
//             message: "UnAuthorized.",
//         });
//     }

// };   



import { userFromToken } from "../utils/token";
import { Request, Response } from 'express';
import { NextFunction } from "express";

export const adminMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = userFromToken(req);
  if (user == null) {
    res.status(403).json({
      message: "no user",
    });
    return;
  }
  else if(user.is_admin) {
    next();
  } else {
    res.status(403).json({
      message: "UnAuthorized. user is not admin",
    });
  }
};