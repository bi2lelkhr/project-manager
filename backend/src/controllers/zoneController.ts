import { prisma } from "..";
import { Request, Response } from 'express';

export const createZone = async (req: Request, res: Response) => {
    const { code_zone, nom, description } = req.body;
  
    try {
      const newZone = await prisma.zone.create({
        data: {
          code_zone,
          nom,
          description,
        },
      });
      res.status(200).json({success:true,message:"created successfully"});
    } catch (error) {
       res.status(500).json({ message: 'Error creating zone', error});
    }
  };
  export const getAllZones = async (req: Request, res: Response) => {
    try {
      const zones = await prisma.zone.findMany({
        include:{
          quartiers:true
        }
      });
       res.status(200).json(zones);
    } catch (error) {
       res.status(500).json({ message: 'Error fetching zones', error });
    }
  };
  export const updateZone = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { code_zone, nom, description } = req.body;
  
    try {
      const updatedZone = await prisma.zone.update({
        where: { id },
        data: { code_zone, nom, description },
      });
  
      res.status(200).json({success:true,message:"updated successfully"});
    } catch (error) {
       res.status(500).json({ message: 'Error updating zone', error });
    }
  };
  
  export const deleteZone = async (req: Request, res: Response) => {
    const { id } = req.params;
  
    try {
      const deletedZone = await prisma.zone.delete({
        where: { id },
      });
  
       res.status(200).json({success:true,message:"deleted successfully"});
    } catch (error) {
       res.status(500).json({ message: 'Error deleting zone', error });
    }
  };