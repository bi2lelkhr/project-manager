import { prisma } from "..";
import { Request, Response } from "express";
import { io } from "../index";
import { userFromToken } from "../utils/token";

interface DeveloperInput {
  userId: string;
  isLead: boolean;
}

interface ProjectRequestBody {
  name: string;
  description?: string;
  quartierId: string;
  developers: DeveloperInput[];
}
interface ProjectUpdateRequestBody extends ProjectRequestBody {
  id: string;
}

// create a project
export const createProject = async (
  req: Request<{}, {}, ProjectRequestBody>,
  res: Response
): Promise<void> => {
  const { name, description, quartierId, developers = [] } = req.body; //

  if (!name || !quartierId) {
    res.status(400).json({
      success: false,
      message: "Missing required fields: name and quartierId",
    });
    return;
  }

  if (!Array.isArray(developers)) {
    res.status(400).json({
      success: false,
      message: "Developers must be an array",
    });
    return;
  }

  for (const dev of developers) {
    if (!dev.userId || typeof dev.isLead !== "boolean") {
      res.status(400).json({
        success: false,
        message: "Each developer must have a userId and isLead boolean",
      });
      return;
    }
  }

  const leadCount = developers.filter((dev) => dev.isLead).length;
  if (developers.length > 0 && leadCount !== 1) {
    res.status(400).json({
      success: false,
      message: "If developers are provided, exactly one must be set as lead",
    });
    return;
  }

  try {
    const project = await prisma.project.create({
      data: {
        name,
        description,
        quartierId,
        projectDevelopers: {
          create: developers.map((developer) => ({
            userId: developer.userId,
            is_lead: developer.isLead,
          })),
        },
      },
      include: { projectDevelopers: true },
    });

    for (const dev of project.projectDevelopers) {
      const message = dev.is_lead
        ? `You have been added as the Project Manager for "${project.name}"`
        : `You have been added to the project "${project.name}"`;

      const notification = await prisma.notification.create({
        data: {
          userId: dev.userId,
          type: "PROJECT_ASSIGNED",
          entityId: project.id,
          message,
        },
      });

      io.to(dev.userId).emit("notification", notification);
    }

    res.status(201).json({
      success: true,
      message:
        "Project created successfully" +
        (developers.length > 0 ? " and notifications sent" : ""),
      project,
    });
  } catch (error) {
    console.error("Create Project error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create project",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const getAllProjects = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user = userFromToken(req);

  if (!user) {
    res.status(403).json({ success: false, message: "Unauthorized" });
    return;
  }

  try {
    let projects;

    if (user.is_admin) {
      projects = await prisma.project.findMany({
        include: {
          quartier: {
            include: { zone: true },
          },
          noeuds: true,
          projectDevelopers: {
            include: { user: true },
          },
        },
      });
    } else {
      projects = await prisma.project.findMany({
        where: {
          projectDevelopers: {
            some: { userId: String(user.id) },
          },
        },
        include: {
          quartier: {
            include: { zone: true },
          },
          noeuds: true,
          projectDevelopers: {
            include: { user: true },
          },
        },
      });
    }

    if (!projects || projects.length === 0) {
      res.status(404).json({
        success: false,
        message: user.is_admin
          ? "Aucun projet trouvé dans le système"
          : "Aucun projet trouvé pour cet utilisateur",
      });
      return;
    }

    res.status(200).json(projects);
  } catch (error) {
    console.error("Erreur lors de la récupération des projets:", error);
    res.status(500).json({
      success: false,
      message: "Échec lors de la récupération des projets",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// update a project
export const updateProject = async (
  req: Request<{}, {}, ProjectUpdateRequestBody>,
  res: Response
): Promise<void> => {
  const { id, name, description, quartierId, developers } = req.body;

  try {
    if (!id || !name || !quartierId || !Array.isArray(developers)) {
      res.status(400).json({
        success: false,
        message:
          "Missing required fields: id, name, quartierId, and developers array are required",
      });
      return;
    }

    if (developers.length > 0) {
      for (const dev of developers) {
        if (!dev.userId || typeof dev.isLead !== "boolean") {
          res.status(400).json({
            success: false,
            message: "Each developer must have a userId and isLead boolean",
          });
          return;
        }
      }

      const leadCount = developers.filter((dev) => dev.isLead).length;
      if (leadCount !== 1) {
        res.status(400).json({
          success: false,
          message: "Exactly one developer must be set as lead",
        });
        return;
      }
    }

    const oldProject = await prisma.project.findUnique({
      where: { id },
      include: { projectDevelopers: true },
    });

    if (!oldProject) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });
      return;
    }

    const oldDevelopers = oldProject.projectDevelopers;

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        quartierId,
        projectDevelopers: {
          deleteMany: {},
          create: developers.map((developer) => ({
            userId: developer.userId,
            is_lead: developer.isLead,
          })),
        },
      },
      include: {
        projectDevelopers: true,
      },
    });

    const newDevelopers = updatedProject.projectDevelopers;

    const oldIds = oldDevelopers.map((d) => d.userId);
    const newIds = newDevelopers.map((d) => d.userId);

    const removedDevs = oldDevelopers.filter((d) => !newIds.includes(d.userId));
    const addedDevs = newDevelopers.filter((d) => !oldIds.includes(d.userId));

    const oldLeader = oldDevelopers.find((d) => d.is_lead);
    const newLeader = newDevelopers.find((d) => d.is_lead);

    for (const dev of removedDevs) {
      const notification = await prisma.notification.create({
        data: {
          userId: dev.userId,
          type: "PROJECT_REMOVED",
          entityId: updatedProject.id,
          message: `You have been removed from the project "${updatedProject.name}"`,
        },
      });
      io.to(dev.userId).emit("notification", notification);
    }

    for (const dev of addedDevs) {
      const message = dev.is_lead
        ? `You have been assigned as the Project Manager for "${updatedProject.name}"`
        : `You have been added to the project "${updatedProject.name}"`;

      const notification = await prisma.notification.create({
        data: {
          userId: dev.userId,
          type: "PROJECT_ASSIGNED",
          entityId: updatedProject.id,
          message,
        },
      });
      io.to(dev.userId).emit("notification", notification);
    }

    if (oldLeader?.userId !== newLeader?.userId) {
      if (oldLeader && newIds.includes(oldLeader.userId)) {
        const notification = await prisma.notification.create({
          data: {
            userId: oldLeader.userId,
            type: "PROJECT_ROLE_CHANGED",
            entityId: updatedProject.id,
            message: `You are no longer the Project Manager for "${updatedProject.name}"`,
          },
        });
        io.to(oldLeader.userId).emit("notification", notification);
      }

      if (newLeader) {
        const notification = await prisma.notification.create({
          data: {
            userId: newLeader.userId,
            type: "PROJECT_ROLE_CHANGED",
            entityId: updatedProject.id,
            message: `You have been assigned as the Project Manager for "${updatedProject.name}"`,
          },
        });
        io.to(newLeader.userId).emit("notification", notification);
      }
    }

    res.status(200).json({
      success: true,
      message: "Updated successfully and notifications sent where applicable",
      data: updatedProject,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update project",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const deleteProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { projectDevelopers: true },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });
      return;
    }

    for (const dev of project.projectDevelopers) {
      const notification = await prisma.notification.create({
        data: {
          userId: dev.userId,
          type: "PROJECT_DELETED",
          entityId: project.id,
          message: `The project "${project.name}" has been deleted. You are no longer assigned to it.`,
        },
      });
      io.to(dev.userId).emit("notification", notification);
    }

    await prisma.project.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: "Project deleted successfully and developers notified",
    });
    return;
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete project",
      error: error instanceof Error ? error.message : error,
    });
    return;
  }
};

// this the new updateprojectdevelopers
export const addProjectDevelopers = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id: projectId } = req.params;
  const { developers } = req.body;

  if (!projectId) {
    res
      .status(400)
      .json({ success: false, message: "Missing projectId in URL params" });
    return;
  }
  if (!developers || !Array.isArray(developers)) {
    res
      .status(400)
      .json({ success: false, message: "Invalid developers array" });
    return;
  }

  
  for (const dev of developers) {
    if (!dev.userId || typeof dev.is_lead !== "boolean") {
      res.status(400).json({
        success: false,
        message: "Each developer must have a userId and is_lead boolean",
      });
      return;
    }
  }

  try {
  
    const existingDevelopers = await prisma.project_developpers.findMany({
      where: { projectId },
    });
    const existingUserIds = existingDevelopers.map((dev) => dev.userId);

    
    const alreadyHasLead = existingDevelopers.some((dev) => dev.is_lead);

    
    const newLeads = developers.filter((dev) => dev.is_lead);

    if (alreadyHasLead && newLeads.length > 0) {
      res.status(400).json({
        success: false,
        message:
          "This project already has a Project Manager. Only one lead is allowed.",
      });
      return;
    }

    
    if (newLeads.length > 1) {
      res.status(400).json({
        success: false,
        message: "You can only assign one Project Manager at a time.",
      });
      return;
    }

  
    const newDevelopers = developers.filter(
      (dev) => !existingUserIds.includes(dev.userId)
    );

    if (newDevelopers.length === 0) {
      res.status(200).json({
        success: true,
        message: "No new developers to add",
      });
      return;
    }

  
    const createdDevelopers = await prisma.project_developpers.createMany({
      data: newDevelopers.map((dev) => ({
        projectId,
        userId: dev.userId,
        is_lead: dev.is_lead,
      })),
    });

    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });

    if (project) {
      for (const dev of newDevelopers) {
        const message = dev.is_lead
          ? `You are now the Project Manager for "${project.name}"`
          : `You have been added to the project "${project.name}"`;

        const notification = await prisma.notification.create({
          data: {
            userId: dev.userId,
            type: "PROJECT_ADDED",
            entityId: projectId,
            message,
          },
        });

        io.to(dev.userId).emit("notification", notification);
      }
    }

    res.status(201).json({
      success: true,
      message: "New developers added successfully and notifications sent",
      addedCount: createdDevelopers.count,
    });
  } catch (error) {
    console.error("Error adding project developers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add project developers",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// update project risks
export const updateProjectRisks = async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { risks } = req.body;

  if (!risks || !Array.isArray(risks)) {
    res.status(400).json({ error: "Invalid risks array" });
  } else {
    try {
      const existingRisks = await prisma.projects_risques.findMany({
        where: { projectId },
      });

      const risksToRemove = existingRisks.filter(
        (risk) => !risks.includes(risk.risqueId)
      );

      await prisma.projects_risques.deleteMany({
        where: {
          projectId,
          risqueId: { in: risksToRemove.map((risk) => risk.risqueId) },
        },
      });

      const upserts = risks.map((risqueId: string) =>
        prisma.projects_risques.upsert({
          where: {
            projectId_risqueId: {
              projectId,
              risqueId,
            },
          },
          update: {},
          create: {
            projectId,
            risqueId,
          },
        })
      );

      await Promise.all(upserts);

      res.status(200).json({ message: "Project risks updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error });
    }
  }
};

// get all sprints of a specific project
export const getProjectSprints = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id: projectId } = req.params;

  if (!projectId) {
    res.status(400).json({ error: "Missing projectId in URL params" });
    return;
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const sprints = await prisma.sprint.findMany({
      where: { projectId },
      include: {
        Sprint_developpers: { include: { user: true } },
        tasks: true,
      },
      orderBy: { start_date: "asc" },
    });

    res.status(200).json({ project: project.name, sprints });
  } catch (error) {
    console.error("Error fetching project sprints:", error);
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : error });
  }
};

// get infrastructures of a specific project
export const getInfrastructuresByProject = async (
  req: Request,
  res: Response
) => {
  const projectId = req.params.id;

  try {
    const infra = await prisma.infrastructure.findMany({
      where: {
        noeud: { projectId },
      },
      include: { noeud: true },
    });
    res.status(200).json({ success: true, data: infra });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching infrastructures by project",
      error,
    });
  }
};
