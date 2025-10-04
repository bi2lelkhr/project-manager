import { connect } from "http2";
import { prisma } from "..";
import { Request, Response } from "express";
import { userFromToken } from "../utils/token";
import { Prisma } from "@prisma/client";

type NoeudWithRelations = Prisma.NoeudGetPayload<{
  include: { project: true; dev_stack: true; type_noeud: true };
}>;

export const getAllNoeuds = async (req: Request, res: Response) => {
  const user = userFromToken(req);

  if (!user) {
    res.status(403).json({ success: false, message: "Unauthorized" });
    return;
  }

  try {
    let noeuds: NoeudWithRelations[] = [];

    if (user.is_admin) {
      noeuds = await prisma.noeud.findMany({
        include: {
          project: true,
          dev_stack: true,
          type_noeud: true,
        },
      });
    } else {
      // check if user is a project leader
      const leaderProjects = await prisma.project.findMany({
        where: {
          projectDevelopers: {
            some: {
              userId: String(user.id),
              is_lead: true,
            },
          },
        },
        select: { id: true },
      });

      if (leaderProjects.length > 0) {
        const projectIds = leaderProjects.map((p) => p.id);

        noeuds = await prisma.noeud.findMany({
          where: {
            projectId: { in: projectIds },
          },
          include: {
            project: true,
            dev_stack: true,
            type_noeud: true,
          },
        });
      }
    }

    if (noeuds.length === 0) {
      res.status(404).json({
        success: false,
        message: user.is_admin
          ? "Aucun noeud trouvé dans le système"
          : "Aucun noeud trouvé pour cet utilisateur",
      });
      return;
    }

    res.status(200).json(noeuds);
  } catch (error) {
    console.error("Erreur lors de la récupération des noeuds:", error);
    res.status(500).json({
      success: false,
      message: "Échec lors de la récupération des noeuds",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const updateNoeud = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    designation,
    description,
    repository_link,
    typeNoeudId,
    devStackId,
    projectId,
    network,
  } = req.body;

  try {
    const updatedNoeud = await prisma.noeud.update({
      where: { id },
      data: {
        designation,
        description,
        repository_link,
        typeNoeudId,
        devStackId,
        projectId,
        network,
      },
    });

    res.status(200).json({ success: true, message: "updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

export const deleteNoeud = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.noeud.delete({
      where: { id },
    });

    res.status(200).json({ message: "Noeud successfully deleted" });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

export const createNoeud = async (req: Request, res: Response) => {
  const {
    designation,
    description,
    repository_link,
    typeNoeudId,
    devStackId,
    projectId,
    network,
  } = req.body;

  try {
    const newNoeud = await prisma.noeud.create({
      data: {
        designation,
        description,
        network,
        repository_link,
        type_noeud: {
          connect: {
            id: typeNoeudId,
          },
        },
        dev_stack: {
          connect: {
            id: devStackId,
          },
        },
        project: {
          connect: {
            id: projectId,
          },
        },
      },
    });

    res.status(200).json({ success: true, message: "created successfully" });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

export const getNoeudsByProject = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const noeuds = await prisma.noeud.findMany({
      where: { projectId: id },
      include: {
        project: true,
        dev_stack: true,
        type_noeud: true,
        Infrastructure: true,
      },
    });

    res.status(200).json(noeuds);
  } catch (error) {
    res.status(500).json({ error });
  }
};

// get infrastructures of a specific noeud
export const getInfrastructuresByNoeud = async (
  req: Request,
  res: Response
) => {
  const noeudId = req.params.id;

  try {
    const infra = await prisma.infrastructure.findMany({
      where: { noeudId },
    });
    res.status(200).json({ success: true, data: infra });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching infrastructures by noeud",
      error,
    });
  }
};
