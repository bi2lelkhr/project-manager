import { prisma } from "..";
import { Request, Response } from 'express';


export const createRisque = async (req: Request, res: Response) => {
  const { name, description, severity } = req.body;

  try {
    const risque = await prisma.risque.create({
      data: {
        name,
        description,
        severity: severity || 1,
      },
    });
    res.status(201).json({success:true,message:"created successfully"});
  } catch (error) {
    res.status(500).json({ error:error });
  }
};

export const getAllRisques = async (req: Request, res: Response) => {
  try {
    const risques = await prisma.risque.findMany();
    res.status(200).json(risques);
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const updateRisque = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, severity } = req.body;

  try {
    const updatedRisque = await prisma.risque.update({
      where: { id },
      data: {
        name,
        description,
        severity,
      },
    });

    res.status(200).json({success:true,message:"updated successfully"});
  } catch (error) {
    res.status(500).json({ error  });
  }
};
export const deleteRisque = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.risque.delete({
      where: { id },
    });

    res.status(200).json({success:true, message: 'Risque deleted successfully' });
  } catch (error) {
    res.status(500).json({ error });
  }
};