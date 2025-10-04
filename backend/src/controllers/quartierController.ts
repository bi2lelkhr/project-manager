import { prisma } from "..";
import { Request, Response } from "express";

export const createQuartier = async (req: Request, res: Response) => {
  const { code_quartier, nom, description, zoneId } = req.body;

  try {
    const newQuartier = await prisma.quartier.create({
      data: {
        code_quartier,
        nom,
        description,
        zone: { connect: { id: zoneId } },
      },
    });
    res.status(201).json({ success: true, message: "created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error creating quartier", error });
  }
};
export const getAllQuartiers = async (req: Request, res: Response) => {
  try {
    const quartiers = await prisma.quartier.findMany({
      include: {
        zone: true,
        _count: {
          select: {
            Project: true,
          },
        },
      },
    });
    res.status(200).json(quartiers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching quartiers", error });
  }
};

export const deleteQuartier = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const deletedQuartier = await prisma.quartier.delete({
      where: { id },
    });

    res.status(200).json({ success: true, message: "deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting quartier", error });
  }
};

export const updateQuartier = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { code_quartier, nom, description, zoneId } = req.body;

  try {
    const data: any = {};
    if (code_quartier !== undefined) data.code_quartier = code_quartier;
    if (nom !== undefined) data.nom = nom;
    if (description !== undefined) data.description = description;
    if (zoneId !== undefined) data.zone = { connect: { id: zoneId } };

    const updatedQuartier = await prisma.quartier.update({
      where: { id },
      data,
    });

    res.status(200).json({
      success: true,
      message: "Updated successfully",
      updatedQuartier,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating quartier", error });
  }
};
