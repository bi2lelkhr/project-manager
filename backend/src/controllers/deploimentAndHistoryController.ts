import { prisma } from "..";
import { Request, Response } from "express";
import { io } from "../index";
import { userFromToken } from "../utils/token";

export const createDeploiment = async (req: Request, res: Response) => {
  const { type, link, is_alive, projectId, repository } = req.body;
  console.log(req.body);

  try {
    const deploiment = await prisma.deploiment.create({
      data: {
        type,
        link,
        is_alive: is_alive.toString(),
        repository,
        project: {
          connect: { id: projectId }, 
        },
      },
    });
    res.status(201).json({ success: true, message: "created successfully" });
  } catch (error) {
    console.error("Error creating Deploiment:", error);
    res
      .status(500)
      .json({ error: "Failed to create Deploiment", details: error });
  }
};

export const getAllDeploiments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = userFromToken(req);
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    let deploiments;

    if (user.is_admin) {
      // if it is an admin get deployment of all the projects
      deploiments = await prisma.deploiment.findMany({
        include: { project: true },
      });
    } else {
      // check if the user is a project leader
      const leaderProjects = await prisma.project_developpers.findMany({
        where: { userId: String(user.id), is_lead: true },
        select: { projectId: true },
      });

      if (leaderProjects.length === 0) {
        res.status(403).json({
          message: "Forbidden: Only admin or project leaders allowed",
        });
        return;
      }

      // here im getting only the deployemnt og the project he is a leader in
      const projectIds = leaderProjects.map((p) => p.projectId);
      deploiments = await prisma.deploiment.findMany({
        where: { projectId: { in: projectIds } },
        include: { project: true },
      });
    }

    const deploimentsWithLastDep = await Promise.all(
      deploiments.map(async (e) => {
        const lastDep = await prisma.deploy_history.findFirst({
          where: { deploimentId: e.id },
          orderBy: { date_dep: "desc" },
        });
        return { ...e, last_dep: lastDep?.date_dep };
      })
    );

    res.status(200).json(deploimentsWithLastDep);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to fetch Deploiments", details: error });
  }
};

export const getDeploimentsHistory = async (_req: Request, res: Response) => {
  const { id } = _req.params;
  try {
    const deploiments = await prisma.deploy_history.findMany({
      where: {
        deploimentId: id,
      },
      
    });
    res.status(200).json(deploiments);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch Deploiments", details: error });
  }
};

export const updateDeploiment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type, link, is_alive, projectId, repository } = req.body;

  try {
    const updateData: any = {};
    if (type !== undefined) updateData.type = type;
    if (link !== undefined) updateData.link = link;
    if (is_alive !== undefined) updateData.is_alive = is_alive;
    if (projectId !== undefined) updateData.projectId = projectId;
    if (repository !== undefined) updateData.repository = repository;

    const deploiment = await prisma.deploiment.update({
      where: { id },
      data: updateData,
    });

    res
      .status(200)
      .json({ success: true, message: "Updated successfully", deploiment });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to update Deploiment", details: error });
  }
};

export const deleteDeploiment = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.deploiment.delete({
      where: { id },
    });

    res.status(201).json({ success: true, message: "deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete Deploiment", details: error });
  }
};

export const bulkInsertDeployHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const deploimentId = req.params.id;
  const deployHistories = req.body;

  if (!Array.isArray(deployHistories)) {
    res.status(400).json({
      error: "Invalid input. Expected an array of deploy histories.",
    });
    return;
  }

  try {
    const dataWithDeployment = deployHistories.map((history) => ({
      ...history,
      deploimentId,
    }));

    const result = await prisma.deploy_history.createMany({
      data: dataWithDeployment,
    });

    const deployment = await prisma.deploiment.findUnique({
      where: { id: deploimentId },
      include: {
        project: {
          include: {
            projectDevelopers: {
              where: { is_lead: true },
              include: { user: true },
            },
          },
        },
      },
    });

    if (deployment && deployment.project) {
      for (const history of deployHistories) {
        const statusMsg = history.is_success ? " succeeded" : " failed";

        const message = `Deployment "${deployment.type}" for project "${deployment.project.name}" by "${history.author}" (${history.commit}) ${statusMsg}.`;

        for (const leader of deployment.project.projectDevelopers) {
          const notification = await prisma.notification.create({
            data: {
              userId: leader.userId,
              type: "DEPLOYMENT",
              entityId: deployment.id,
              message,
            },
          });

          io.to(leader.userId).emit("notification", notification);
        }
      }
    }

    res.status(201).json({
      message: "Bulk insert successful and notifications sent",
      count: result.count,
    });
  } catch (error) {
    console.error("Error inserting deploy histories:", error);
    res.status(500).json({
      error: "Failed to insert deploy histories",
      details: error,
    });
  }
};

export const deleteDeployHistory = async (req: Request, res: Response) => {
  try {
    let ids: string[] = [];

    if (req.params.ids) {
      ids = req.params.ids.split(",");
    } else if (req.body.id) {
      ids = [req.body.id];
    } else if (Array.isArray(req.body.ids)) {
      ids = req.body.ids;
    } else {
      res.status(400).json({ message: "DeployHistory ID(s) are required" });
      return;
    }

    await prisma.deploy_history.deleteMany({
      where: { id: { in: ids } },
    });

    res.status(200).json({
      success: true,
      message: `Deleted DeployHistory: ${ids.join(", ")}`,
    });
  } catch (error) {
    console.error("Error deleting DeployHistory:", error);
    res.status(500).json({
      error: "Failed to delete DeployHistory",
      details: error,
    });
  }
};
