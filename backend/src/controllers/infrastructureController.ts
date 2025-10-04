import { Request, Response } from "express";
import { prisma } from "..";
import { userFromToken } from "../utils/token";

//create infra
export const createInfrastructure = async (req: Request, res: Response) => {
  const noeudId = req.params.id;
  const { network, port, in_out, protocol } = req.body;

  try {
    const infra = await prisma.infrastructure.create({
      data: {
        noeudId,
        network: String(network),
        port: Number(port),
        in_out: String(in_out),
        protocol: String(protocol),
      },
    });

    res.status(201).json({ success: true, data: infra });
  } catch (error: any) {
    console.error("Error creating infrastructure:", error);
    res.status(500).json({
      success: false,
      message: "Error creating infrastructure",
      error: error.message || error,
    });
  }
};

//update infrastructure
export const updateInfrastructure = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { network, port, in_out, protocol } = req.body;

  try {
    const infra = await prisma.infrastructure.update({
      where: { id },
      data: {
        ...(network && { network }),
        ...(port && { port }),
        ...(in_out && { in_out }),
        ...(protocol && { protocol }),
      },
    });

    res.status(200).json({ success: true, data: infra });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating infrastructure",
      error,
    });
  }
};

// Delete infrastructure by ID
export const deleteInfrastructure = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.infrastructure.delete({ where: { id } });
    res
      .status(200)
      .json({ success: true, message: "Infrastructure deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting infrastructure",
      error,
    });
  }
};

// get all infrastructures
export const getAllInfrastructures = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user = userFromToken(req);

  if (!user) {
    res.status(403).json({ success: false, message: "Unauthorized" });
    return;
  }

  try {
    let infrastructures;

    if (user.is_admin) {
      infrastructures = await prisma.infrastructure.findMany({
        include: { noeud: { include: { project: true } } },
      });
    } else {
      const leaderProjects = await prisma.project_developpers.findMany({
        where: {
          userId: String(user.id),
          is_lead: true,
        },
        select: { projectId: true },
      });

      if (leaderProjects.length === 0) {
        res.status(200).json({ success: true, data: [] });
        return;
      }

      const projectIds = leaderProjects.map((p) => p.projectId);

      infrastructures = await prisma.infrastructure.findMany({
        where: {
          noeud: {
            projectId: { in: projectIds },
          },
        },
        include: {
          noeud: {
            include: { project: true },
          },
        },
      });
    }

    res.status(200).json({ success: true, data: infrastructures });
  } catch (error) {
    console.error("Erreur lors de la récupération des infrastructures:", error);
    res.status(500).json({
      success: false,
      message: "Échec lors de la récupération des infrastructures",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// get infrasructure by id
export const getInfrastructureById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const infra = await prisma.infrastructure.findUnique({
      where: { id },
    });

    if (!infra) {
      res
        .status(404)
        .json({ success: false, message: "Infrastructure not found" });
      return;
    }

    res.status(200).json({ success: true, data: infra });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching infrastructure",
      error,
    });
  }
};
