import { prisma } from "..";
import { Request, Response } from 'express';


export const createTypeNoeud = async (req: Request, res: Response) => {
  const { designation, description } = req.body;

  try {
    const typeNoeud = await prisma.type_noeud.create({
      data: {
        designation,
        description,
      },
    });
    res.status(201).json({success:true,message:"created successfully"});
  } catch (error) {
    res.status(500).json({ error });
  }
};


export const getAllTypeNoeuds = async (req: Request, res: Response) => {
  try {
    const typeNoeuds = await prisma.type_noeud.findMany();
    res.status(200).json(typeNoeuds);
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const updateTypeNoeud = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { designation, description } = req.body;

  try {
    const updatedTypeNoeud = await prisma.type_noeud.update({
      where: { id },
      data: {
        designation,
        description,
      },
    });

    res.status(201).json({success:true,message:"updated successfully"});
  } catch (error) {
    res.status(500).json({ error });
  }
};


export const deleteTypeNoeud = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.type_noeud.delete({
      where: { id },
    });

    res.status(200).json({success:true, message: 'Type_noeud deleted successfully' });
  } catch (error) {
    res.status(500).json({ error });
  }
};