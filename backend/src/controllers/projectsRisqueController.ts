import { connect } from "http2";
import { prisma } from "..";
import { Request, Response } from "express";

// Get all project risques
export const getAllProjectsRisques = async (req: Request, res: Response) => {
  try {
    const risques = await prisma.projects_risques.findMany({
      include: {
        project: true,
        risque: true,
      },
    });
    res.status(200).json(risques);
  } catch (error) {
    res.status(500).json({ error });
  }
};

//  Get all risques of a specific project
export const getProjectRisques = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const risques = await prisma.projects_risques.findMany({
      where: { projectId: id },
      include: {
        project: true,
        risque: true,
      },
    });

    res.status(200).json(risques);
  } catch (error) {
    res.status(500).json({ error });
  }
};

// assign risks to prject
export const assignRisquesToProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { projectId, risqueIds } = req.body;

  if (!projectId || !Array.isArray(risqueIds)) {
    res.status(400).json({ message: "projectId and risqueIds[] are required" });
    return;
  }

  try {
    const newLinks = await prisma.projects_risques.createMany({
      data: risqueIds.map((risqueId: string) => ({
        projectId,
        risqueId,
      })),
    });

    res.status(201).json({
      success: true,
      message: "Risques assigned to project",
      data: newLinks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// delete risks of projects
export const deleteProjectRisques = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ success: false, message: "ids[] are required" });
    return;
  }

  try {
    const deleted = await prisma.projects_risques.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    res.status(200).json({
      success: true,
      message: "ProjectRisques deleted successfully",
      count: deleted.count,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error });
  }
};
