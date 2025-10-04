import { prisma } from "..";
import { Request, Response } from "express";
import { userFromToken } from "../utils/token";
import { io } from "../index";

// create sprint a project
export const createSprint = async (
  req: Request,
  res: Response
): Promise<void> => {
  const projectId = req.params.id;
  const { sprint_name, start_date, end_date, developers } = req.body;

  if (!sprint_name || !start_date || !projectId) {
    res.status(400).json({
      error: "sprint_name, start_date, and projectId are required",
    });
    return;
  }

  if (!Array.isArray(developers) || developers.length === 0) {
    res.status(400).json({
      error: "developers must be a non-empty array",
    });
    return;
  }

  for (const dev of developers) {
    if (!dev.userId || typeof dev.is_lead !== "boolean") {
      res.status(400).json({
        error: "Each developer must have a userId and is_lead boolean",
      });
      return;
    }
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      res.status(404).json({
        error: `Project with id ${projectId} not found`,
      });
      return;
    }

    const now = new Date();
    const startDateObj = new Date(start_date);
    const endDateObj = end_date ? new Date(end_date) : null;

    if (endDateObj && endDateObj <= now) {
      res.status(400).json({
        error: "end_date must be greater than the current date",
      });
      return;
    }

    let status = 0;
    if (startDateObj <= now) {
      status = 1;
    }

    const sprint = await prisma.sprint.create({
      data: {
        sprint_name,
        start_date: startDateObj,
        end_date: endDateObj,
        status,
        project: {
          connect: { id: projectId },
        },
        Sprint_developpers: {
          create: developers.map(
            (developer: { userId: string; is_lead: boolean }) => ({
              user: { connect: { id: developer.userId } },
              is_lead: developer.is_lead,
            })
          ),
        },
      },
      include: { Sprint_developpers: true },
    });

    const statusText = status === 0 ? "PENDING" : "ACTIVE";

    for (const dev of sprint.Sprint_developpers) {
      const message = dev.is_lead
        ? `You have been assigned as the Sprint Leader for "${sprint.sprint_name}". The sprint is currently ${statusText}.`
        : `You have been added to the sprint "${sprint.sprint_name}". The sprint is currently ${statusText}.`;

      const notification = await prisma.notification.create({
        data: {
          userId: dev.userId,
          type: "SPRINT_ASSIGNED",
          entityId: sprint.id,
          message,
        },
      });

      io.to(dev.userId).emit("notification", notification);
    }

    res.status(201).json({
      success: true,
      message: "Sprint created successfully and notifications sent",
      sprint,
    });
  } catch (error) {
    console.error("Create Sprint error:", error);
    res.status(500).json({
      error: "Failed to create sprint",
      details: (error as Error).message,
    });
  }
};

// get existing sprint
export const getAllSprints = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user = userFromToken(req);

  if (!user) {
    res.status(403).json({ success: false, message: "Unauthorized" });
    return;
  }

  try {
    let sprints;

    if (user.is_admin) {
      sprints = await prisma.sprint.findMany({
        include: {
          project: true,
          Sprint_developpers: {
            include: { user: true },
          },
        },
      });
    } else {
      sprints = await prisma.sprint.findMany({
        where: {
          Sprint_developpers: {
            some: { userId: String(user.id) },
          },
        },
        include: {
          project: true,
          Sprint_developpers: {
            include: { user: true },
          },
        },
      });
    }

    if (!sprints || sprints.length === 0) {
      res.status(404).json({
        success: false,
        message: user.is_admin
          ? "Aucun sprint trouvé dans le système"
          : "Aucun sprint trouvé pour cet utilisateur",
      });
      return;
    }

    const filteredSprints = sprints.filter((sprint) => {
      if (sprint.status === 0 || sprint.status === 1) {
        return true;
      }

      if (sprint.status === 2 || sprint.status === 3) {
        if (!sprint.end_date) {
          return true;
        }

        const endDate = new Date(sprint.end_date);
        const now = new Date();
        const timeDifference = now.getTime() - endDate.getTime();
        const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

        return daysDifference <= 365;
      }

      return true;
    });

    if (filteredSprints.length === 0) {
      res.status(404).json({
        success: false,
        message: user.is_admin
          ? "Aucun sprint récent trouvé dans le système"
          : "Aucun sprint récent trouvé pour cet utilisateur",
      });
      return;
    }

    res.status(200).json(filteredSprints);
  } catch (error) {
    console.error("Erreur lors de la récupération des sprints:", error);
    res.status(500).json({
      success: false,
      message: "Échec lors de la récupération des sprints",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// Update a Sprint
export const updateSprint = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { sprint_name, start_date, end_date, projectId, developers } = req.body;

  try {
    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: {
        Sprint_developpers: true,
        project: { include: { projectDevelopers: true } },
      },
    });

    if (!sprint) {
      res.status(404).json({ error: "Sprint not found" });
      return;
    }

    if (developers) {
      const leadCount = developers.filter(
        (dev: { userId: string; is_lead: boolean }) => dev.is_lead
      ).length;

      if (leadCount !== 1) {
        res.status(400).json({
          error: "A sprint must have exactly one sprint leader",
        });
        return;
      }
    } else {
      const leadCount = sprint.Sprint_developpers.filter(
        (dev) => dev.is_lead
      ).length;

      if (leadCount !== 1) {
        res.status(400).json({
          error:
            "Sprint must have exactly one leader before modification. Assign one leader first.",
        });
        return;
      }
    }

    const updateData: any = {};
    let isExtended = false;

    if (sprint_name !== undefined) updateData.sprint_name = sprint_name;

    let startDateObj = sprint.start_date;
    if (start_date) {
      startDateObj = new Date(start_date);
      updateData.start_date = startDateObj;
    }

    if (end_date) {
      const endDateObj = new Date(end_date);
      const now = new Date();

      if (endDateObj <= startDateObj) {
        res.status(400).json({ error: "end_date must be after start_date" });
        return;
      }

      if (endDateObj <= now) {
        res.status(400).json({ error: "end_date must be in the future" });
        return;
      }

      if (
        !sprint.end_date ||
        endDateObj.getTime() > sprint.end_date.getTime()
      ) {
        isExtended = true;
      }

      updateData.end_date = endDateObj;

      if (sprint.status === 3) {
        updateData.status = 1;
        updateData.finished_at = null;
      }
    }

    if (projectId) updateData.project = { connect: { id: projectId } };

    if (developers) {
      updateData.Sprint_developpers = {
        deleteMany: { sprintId: id },
        create: developers.map((dev: { userId: string; is_lead: boolean }) => ({
          user: { connect: { id: dev.userId } },
          is_lead: dev.is_lead,
        })),
      };
    }

    const updatedSprint = await prisma.sprint.update({
      where: { id },
      data: updateData,
      include: {
        Sprint_developpers: true,
        project: { include: { projectDevelopers: true } },
      },
    });

    if (developers) {
      const oldDevs = sprint.Sprint_developpers;
      const newDevs = updatedSprint.Sprint_developpers;

      const oldIds = oldDevs.map((d) => d.userId);
      const newIds = newDevs.map((d) => d.userId);

      const removed = oldDevs.filter((d) => !newIds.includes(d.userId));
      const added = newDevs.filter((d) => !oldIds.includes(d.userId));

      const oldLead = oldDevs.find((d) => d.is_lead);
      const newLead = newDevs.find((d) => d.is_lead);

      for (const dev of removed) {
        const notification = await prisma.notification.create({
          data: {
            userId: dev.userId,
            type: "SPRINT_REMOVED",
            entityId: updatedSprint.id,
            message: `You have been removed from the sprint "${updatedSprint.sprint_name}"`,
          },
        });
        io.to(dev.userId).emit("notification", notification);
      }

      for (const dev of added) {
        const message = dev.is_lead
          ? `You have been assigned as the Sprint Lead for "${updatedSprint.sprint_name}"`
          : `You have been added to the sprint "${updatedSprint.sprint_name}"`;

        const notification = await prisma.notification.create({
          data: {
            userId: dev.userId,
            type: "SPRINT_ASSIGNED",
            entityId: updatedSprint.id,
            message,
          },
        });
        io.to(dev.userId).emit("notification", notification);
      }

      if (oldLead?.userId !== newLead?.userId) {
        if (oldLead && newIds.includes(oldLead.userId)) {
          const notification = await prisma.notification.create({
            data: {
              userId: oldLead.userId,
              type: "SPRINT_ROLE_CHANGED",
              entityId: updatedSprint.id,
              message: `You are no longer the Sprint Lead for "${updatedSprint.sprint_name}"`,
            },
          });
          io.to(oldLead.userId).emit("notification", notification);
        }

        if (newLead) {
          const notification = await prisma.notification.create({
            data: {
              userId: newLead.userId,
              type: "SPRINT_ROLE_CHANGED",
              entityId: updatedSprint.id,
              message: `You have been assigned as the Sprint Lead for "${updatedSprint.sprint_name}"`,
            },
          });
          io.to(newLead.userId).emit("notification", notification);
        }
      }
    }

    if (isExtended) {
      const message = `The sprint "${
        updatedSprint.sprint_name
      }" has been extended. New end date: ${updatedSprint.end_date?.toLocaleString()}`;

      for (const dev of updatedSprint.Sprint_developpers) {
        const notification = await prisma.notification.create({
          data: {
            userId: dev.userId,
            type: "SPRINT_EXTENDED",
            entityId: updatedSprint.id,
            message,
          },
        });
        io.to(dev.userId).emit("notification", notification);
      }

      const projectLead = updatedSprint.project?.projectDevelopers.find(
        (p) => p.is_lead
      );
      if (projectLead) {
        const notification = await prisma.notification.create({
          data: {
            userId: projectLead.userId,
            type: "SPRINT_EXTENDED",
            entityId: updatedSprint.id,
            message,
          },
        });
        io.to(projectLead.userId).emit("notification", notification);
      }
    }

    res.status(200).json({
      success: true,
      message: "Sprint updated successfully",
      sprint: updatedSprint,
    });
    return;
  } catch (error) {
    console.error("Update Sprint error:", error);
    res.status(500).json({
      error: "Failed to update sprint",
      details: (error as Error).message,
    });
    return;
  }
};

export const getSprintById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: {
        project: true,
        tasks: {
          include: {
            developer: true,
          },
        },
      },
    });

    if (!sprint) {
      res.status(404).json({ error: "Sprint not found" });
    } else {
      res.status(200).json(sprint);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sprint", details: error });
  }
};

// Delete a Sprint
export const deleteSprint = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: { Sprint_developpers: true },
    });

    if (!sprint) {
      res.status(404).json({ error: "Sprint not found" });
      return;
    }

    const message = `The sprint "${sprint.sprint_name}" has been deleted.`;

    for (const dev of sprint.Sprint_developpers) {
      const notification = await prisma.notification.create({
        data: {
          userId: dev.userId,
          type: "SPRINT_DELETED",
          entityId: sprint.id,
          message,
        },
      });
      io.to(dev.userId).emit("notification", notification);
    }

    await prisma.sprint.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: "Sprint deleted successfully and developers notified",
    });
  } catch (error) {
    console.error("Delete Sprint error:", error);
    res.status(500).json({
      error: "Failed to delete sprint",
      details: error instanceof Error ? error.message : error,
    });
  }
};

// new update function to update the data partaily
export const updateTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { taskId } = req.params;
  const {
    designation,
    description,
    start_date,
    end_date,
    developerId,
    status,
  } = req.body;

  try {
    if (!taskId) {
      res.status(400).json({ error: "Invalid taskId" });
      return;
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        sprint: { include: { Sprint_developpers: true } },
        developer: true,
      },
    });

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const dataToUpdate: any = {};
    let isEndDateExtended = false;

    const oldDeveloperId = task.developerId;
    const oldStatus = task.status;

    if (designation !== undefined) dataToUpdate.designation = designation;
    if (description !== undefined) dataToUpdate.description = description;

    let startDateObj = task.start_date;
    if (start_date !== undefined) {
      startDateObj = new Date(start_date);

      if (task.sprint && startDateObj < task.sprint.start_date) {
        res.status(400).json({
          error: `Task start date must be on or after sprint start date (${
            task.sprint.start_date.toISOString().split("T")[0]
          })`,
        });
        return;
      }

      if (
        (task.end_date || end_date) &&
        new Date(end_date ?? task.end_date) < startDateObj
      ) {
        res.status(400).json({
          error: "Task start date must be before end date",
        });
        return;
      }

      dataToUpdate.start_date = startDateObj;
    }

    if (end_date !== undefined) {
      const newEnd = end_date ? new Date(end_date) : null;

      if (task.sprint?.end_date && newEnd && newEnd > task.sprint.end_date) {
        res.status(400).json({
          error: `Task end date must be on or before sprint end date (${
            task.sprint.end_date.toISOString().split("T")[0]
          })`,
        });
        return;
      }

      if (
        !task.end_date ||
        (newEnd && newEnd.getTime() > task.end_date.getTime())
      ) {
        isEndDateExtended = true;
      }

      if (newEnd && startDateObj && startDateObj > newEnd) {
        res.status(400).json({
          error: "Task end date must be after start date",
        });
        return;
      }

      dataToUpdate.end_date = newEnd;

      if (task.status === 3 && isEndDateExtended) {
        dataToUpdate.status = 1;
      }
    }

    if (developerId !== undefined) {
      dataToUpdate.developerId = developerId;
    }

    if (
      req.body.sprintId !== undefined &&
      req.body.sprintId !== task.sprintId
    ) {
      res.status(400).json({ error: "Changing sprint is not allowed" });
      return;
    }

    if (status !== undefined) {
      if (status === 2 && !(dataToUpdate.end_date ?? task.end_date)) {
        res
          .status(400)
          .json({ error: "Cannot mark task as COMPLETED without an end date" });
        return;
      }

      if (status === 1 && startDateObj > new Date()) {
        res
          .status(400)
          .json({ error: "Cannot activate a task before its start date" });
        return;
      }

      dataToUpdate.status = status;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: dataToUpdate,
      include: {
        developer: true,
        sprint: {
          include: { Sprint_developpers: { where: { is_lead: true } } },
        },
      },
    });

    const notifications: any[] = [];

    if (developerId !== undefined && developerId !== oldDeveloperId) {
      if (oldDeveloperId) {
        const msg = `You have been unassigned from the task "${task.designation}".`;
        notifications.push({ userId: oldDeveloperId, msg });
      }
      if (developerId) {
        const msg = `You have been assigned to the task "${updatedTask.designation}".`;
        notifications.push({ userId: developerId, msg });
      }
    }

    if (status !== undefined && status !== oldStatus) {
      const statusMsg =
        updatedTask.status === 0
          ? "PENDING"
          : updatedTask.status === 1
          ? "ACTIVE"
          : updatedTask.status === 2
          ? "COMPLETED"
          : "FINISHED";

      if (updatedTask.developerId) {
        notifications.push({
          userId: updatedTask.developerId,
          msg: `Your task "${updatedTask.designation}" is now ${statusMsg}.`,
        });
      }

      if (updatedTask.sprint?.Sprint_developpers?.length) {
        for (const sprintDev of updatedTask.sprint.Sprint_developpers) {
          notifications.push({
            userId: sprintDev.userId,
            msg: `Task "${updatedTask.designation}" in sprint "${updatedTask.sprint.sprint_name}" is now ${statusMsg}.`,
          });
        }
      }
    }

    for (const n of notifications) {
      const notification = await prisma.notification.create({
        data: {
          userId: n.userId,
          type: "TASK_UPDATED",
          entityId: updatedTask.id,
          message: n.msg,
        },
      });
      io.to(n.userId).emit("notification", notification);
    }

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update Task Error:", error);
    res.status(500).json({
      error: "Failed to update task",
      details: (error as Error).message,
    });
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { status } = req.body;

  try {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        finished_at: status === 3 ? new Date() : undefined,
      },
      include: {
        developer: true,
        sprint: {
          include: {
            project: {
              include: {
                projectDevelopers: {
                  include: { user: true },
                },
              },
            },
            Sprint_developpers: {
              include: { user: true },
            },
            tasks: true,
          },
        },
      },
    });

    let statusMessage = "";
    if (status === 0) statusMessage = "is now PENDING";
    else if (status === 1) statusMessage = "is now ACTIVE";
    else if (status === 2) statusMessage = "has been COMPLETED";
    else if (status === 3) {
      statusMessage =
        task.status === 2
          ? "has FINISHED and was COMPLETED"
          : "has FINISHED but was NOT COMPLETED ";
    }

    if (task.developerId) {
      const devMessage = `Your task "${task.designation}" ${statusMessage}.`;
      const notification = await prisma.notification.create({
        data: {
          userId: task.developerId,
          type: "TASK_STATUS_UPDATE",
          entityId: task.id,
          message: devMessage,
        },
      });
      io.to(task.developerId).emit("notification", notification);
    }

    if (task.sprint?.Sprint_developpers?.length) {
      for (const sprintDev of task.sprint.Sprint_developpers) {
        if (sprintDev.userId === task.developerId) continue;

        const projectName = task.sprint.project?.name || "Unknown Project";
        const leaderMessage = `Developer "${task.developer?.username}" ${statusMessage} on task "${task.designation}" in sprint "${task.sprint.sprint_name}" of project "${projectName}".`;

        const notification = await prisma.notification.create({
          data: {
            userId: sprintDev.userId,
            type: "TASK_STATUS_UPDATE",
            entityId: task.id,
            message: leaderMessage,
          },
        });
        io.to(sprintDev.userId).emit("notification", notification);
      }
    }

    if (status === 2 && task.sprint) {
      const allTasksCompleted = task.sprint.tasks.every((t) => t.status === 2);

      if (allTasksCompleted) {
        const updatedSprint = await prisma.sprint.update({
          where: { id: task.sprint.id },
          data: { status: 2, finished_at: new Date() },
          include: {
            Sprint_developpers: { include: { user: true } },
            project: {
              include: { projectDevelopers: { include: { user: true } } },
            },
          },
        });

        const projectName = updatedSprint.project?.name || "Unknown Project";
        const sprintMessage = `Sprint "${updatedSprint.sprint_name}" of project "${projectName}" has been COMPLETED ✅`;

        const notifiedUsers = new Set<string>();

        for (const sprintDev of updatedSprint.Sprint_developpers) {
          if (!notifiedUsers.has(sprintDev.userId)) {
            const notification = await prisma.notification.create({
              data: {
                userId: sprintDev.userId,
                type: "SPRINT_COMPLETED",
                entityId: updatedSprint.id,
                message: sprintMessage,
              },
            });
            io.to(sprintDev.userId).emit("notification", notification);
            notifiedUsers.add(sprintDev.userId);
          }
        }

        for (const projDev of updatedSprint.project?.projectDevelopers || []) {
          if (projDev.is_lead && !notifiedUsers.has(projDev.userId)) {
            const leaderNotif = await prisma.notification.create({
              data: {
                userId: projDev.userId,
                type: "SPRINT_COMPLETED",
                entityId: updatedSprint.id,
                message: `As Project Leader, note that ${sprintMessage}`,
              },
            });
            io.to(projDev.userId).emit("notification", leaderNotif);
            notifiedUsers.add(projDev.userId);
          }
        }
      }
    }

    res.status(200).json({ message: "Task updated successfully", task });
  } catch (error) {
    console.error("Update Task Status Error:", error);
    res.status(500).json({
      error: "Failed to update task",
      details: (error as Error).message,
    });
  }
};

// delete task
export const deleteTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { taskId } = req.params;

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        sprint: {
          include: {
            Sprint_developpers: {
              where: { is_lead: true },
              include: { user: true },
            },
          },
        },
      },
    });

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    if (task.developerId) {
      const message = task.sprint
        ? `Your task "${task.designation}" in sprint "${task.sprint.sprint_name}" has been deleted`
        : `Your task "${task.designation}" has been deleted`;

      const notification = await prisma.notification.create({
        data: {
          userId: task.developerId,
          type: "TASK_DELETED",
          entityId: task.id,
          message,
        },
      });

      io.to(task.developerId).emit("notification", notification);
    }

    if (task.sprint?.Sprint_developpers?.length) {
      for (const sprintDev of task.sprint.Sprint_developpers) {
        const leaderId = sprintDev.userId;

        const leaderMsg = `The task "${task.designation}" in sprint "${task.sprint.sprint_name}" has been deleted.`;

        const notification = await prisma.notification.create({
          data: {
            userId: leaderId,
            type: "TASK_DELETED",
            entityId: task.id,
            message: leaderMsg,
          },
        });

        io.to(leaderId).emit("notification", notification);
      }
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete Task Error:", error);
    res.status(500).json({ error: "Failed to delete task", details: error });
  }
};

// create task to a sprint
export const createAndAttachTaskToSprint = async (
  req: Request,
  res: Response
): Promise<void> => {
  const sprintId = req.params.id;
  const {
    designation,
    description,
    start_date,
    end_date,
    developerId,
    status,
  } = req.body;

  try {
    const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } });

    if (!sprint) {
      res.status(404).json({ error: "Sprint not found" });
      return;
    }

    if (sprint.status !== 0 && sprint.status !== 1) {
      res.status(400).json({
        error: "Sprint is finished. You cannot add new tasks.",
      });
      return;
    }

    const taskStart = new Date(start_date);
    const taskEnd = end_date ? new Date(end_date) : null;

    if (taskStart < sprint.start_date) {
      res.status(400).json({
        error: `Task start date must be after sprint start date (${
          sprint.start_date.toISOString().split("T")[0]
        })`,
      });
      return;
    }

    if (sprint.end_date && taskEnd && taskEnd > sprint.end_date) {
      res.status(400).json({
        error: `Task end date must be before sprint end date (${
          sprint.end_date.toISOString().split("T")[0]
        })`,
      });
      return;
    }

    const task = await prisma.task.create({
      data: {
        designation,
        description,
        start_date: taskStart,
        end_date: taskEnd,
        developerId,
        sprintId,
        status: status || 0,
      },
      include: {
        sprint: true,
      },
    });

    if (task.sprint) {
      const message = `You have been assigned a task "${task.designation}" in sprint "${task.sprint.sprint_name}"`;

      await prisma.notification.create({
        data: {
          userId: developerId,
          type: "TASK_ASSIGNED",
          entityId: task.id,
          message,
        },
      });

      io.to(developerId).emit("notification", { message, taskId: task.id });
    }

    res.status(201).json({
      message: "Task created and attached to sprint successfully",
      task,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to create and attach task to sprint",
      details: error,
    });
  }
};

// get all tasks of user
export const getUserTasks = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user = userFromToken(req);
  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    let tasks: any[] = [];

    // Admin
    if (user.is_admin) {
      tasks = await prisma.task.findMany({
        include: { sprint: true, developer: true },
      });
    } else {
      const taskIds = new Set<string>();
      const userId = String(user.id);

      const userPersonalTasks = await prisma.task.findMany({
        where: { developerId: userId },
        include: { sprint: true, developer: true },
      });

      for (const task of userPersonalTasks) {
        tasks.push(task);
        taskIds.add(task.id);
      }

      const projectLeaderProjects = await prisma.project_developpers.findMany({
        where: { userId: userId, is_lead: true },
        select: { projectId: true },
      });

      if (projectLeaderProjects.length > 0) {
        const projectIds = projectLeaderProjects.map((p) => p.projectId);
        const projectTasks = await prisma.task.findMany({
          where: {
            sprint: { projectId: { in: projectIds } },

            developerId: { not: userId },
          },
          include: { sprint: true, developer: true },
        });

        for (const task of projectTasks) {
          if (!taskIds.has(task.id)) {
            tasks.push(task);
            taskIds.add(task.id);
          }
        }
      }

      const sprintLeaderSprints = await prisma.sprint_developpers.findMany({
        where: { userId: userId, is_lead: true },
        select: { sprintId: true },
      });

      if (sprintLeaderSprints.length > 0) {
        const sprintIds = sprintLeaderSprints.map((s) => s.sprintId);

        const sprintDevelopers = await prisma.sprint_developpers.findMany({
          where: {
            sprintId: { in: sprintIds },
            is_lead: false,
            userId: { not: userId },
          },
          select: { userId: true },
        });

        const sprintDeveloperIds = sprintDevelopers.map((dev) => dev.userId);

        if (sprintDeveloperIds.length > 0) {
          const sprintTasks = await prisma.task.findMany({
            where: {
              sprintId: { in: sprintIds },
              developerId: { in: sprintDeveloperIds },
            },
            include: { sprint: true, developer: true },
          });

          for (const task of sprintTasks) {
            if (!taskIds.has(task.id)) {
              tasks.push(task);
              taskIds.add(task.id);
            }
          }
        }
      }
    }

    const filteredTasks = tasks.filter((task) => {
      if (task.status === 0 || task.status === 1) {
        return true;
      }

      if (task.status === 2 || task.status === 3) {
        if (!task.end_date) {
          return true;
        }

        const endDate = new Date(task.end_date);
        const now = new Date();
        const timeDifference = now.getTime() - endDate.getTime();
        const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

        return daysDifference <= 30;
      }

      return true;
    });

    res.json(filteredTasks);
  } catch (error) {
    console.error("getUserTasks error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// add developer to sprint
export const addDeveloperToSprint = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, is_lead } = req.body;

  if (!userId || typeof is_lead !== "boolean") {
    res.status(400).json({ error: "userId and is_lead are required" });
    return;
  }

  try {
    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: { Sprint_developpers: true },
    });

    if (!sprint) {
      res.status(404).json({ error: "Sprint not found" });
      return;
    }

    if (is_lead) {
      const existingLeader = sprint.Sprint_developpers.find(
        (dev) => dev.is_lead
      );
      if (existingLeader) {
        res.status(400).json({
          error:
            "This sprint already has a leader. Only one leader is allowed.",
        });
        return;
      }
    }

    const sprintDev = await prisma.sprint_developpers.create({
      data: {
        sprintId: id,
        userId,
        is_lead,
      },
    });

    const message = is_lead
      ? `You have been added as Sprint Leader in "${sprint.sprint_name}"`
      : `You have been added to the sprint "${sprint.sprint_name}"`;

    const notification = await prisma.notification.create({
      data: {
        userId,
        type: "SPRINT_DEVELOPER_ADDED",
        entityId: sprint.id,
        message,
      },
    });

    io.to(userId).emit("notification", notification);

    res.status(201).json({
      success: true,
      message: "Developer added to sprint successfully",
      sprintDev,
    });
  } catch (error) {
    console.error("Add Developer error:", error);
    res.status(500).json({ error: "Failed to add developer", details: error });
  }
};

export const removeDeveloperFromSprint = async (
  req: Request,
  res: Response
) => {
  const { id, userId } = req.params;

  try {
    const sprint = await prisma.sprint.findUnique({ where: { id } });
    if (!sprint) {
      res.status(404).json({ error: "Sprint not found" });
      return;
    }

    const removedDev = await prisma.sprint_developpers.deleteMany({
      where: {
        sprintId: id,
        userId,
      },
    });

    if (removedDev.count === 0) {
      res.status(404).json({ error: "Developer not found in sprint" });
      return;
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type: "SPRINT_DEVELOPER_REMOVED",
        entityId: sprint.id,
        message: `You have been removed from the sprint "${sprint.sprint_name}"`,
      },
    });

    io.to(userId).emit("notification", notification);

    res.status(200).json({
      success: true,
      message: "Developer removed from sprint successfully",
    });
  } catch (error) {
    console.error("Remove Developer error:", error);
    res
      .status(500)
      .json({ error: "Failed to remove developer", details: error });
  }
};

export const updateSprintStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  if (typeof status !== "number" || ![0, 1, 2, 3].includes(status)) {
    res.status(400).json({
      error: "Invalid status value. Must be 0, 1, 2, or 3.",
    });
    return;
  }

  try {
    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: {
        Sprint_developpers: { include: { user: true } },
        project: {
          include: {
            projectDevelopers: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!sprint) {
      res.status(404).json({ error: "Sprint not found" });
      return;
    }

    const updatedSprint = await prisma.sprint.update({
      where: { id },
      data: { status },
      include: {
        Sprint_developpers: { include: { user: true } },
        project: {
          include: {
            projectDevelopers: {
              include: { user: true },
            },
          },
        },
      },
    });

    const statusText = (() => {
      switch (status) {
        case 0:
          return "PENDING";
        case 1:
          return "STARTED";
        case 2:
          return "COMPLETED";
        case 3:
          return "FINISHED";
        default:
          return "";
      }
    })();

    const baseMessage = `The status of sprint "${updatedSprint.sprint_name}" has been changed to ${statusText}.`;

    const notifications: {
      userId: string;
      message: string;
      type: string;
      entityId: string;
    }[] = [];

    const notifiedUsers = new Set<string>();

    for (const dev of updatedSprint.Sprint_developpers) {
      if (!notifiedUsers.has(dev.userId)) {
        const devMessage = dev.is_lead
          ? `You are the Sprint Leader. ${baseMessage}`
          : `You are part of the sprint. ${baseMessage}`;

        notifications.push({
          userId: dev.userId,
          type: "SPRINT_STATUS_UPDATE",
          entityId: updatedSprint.id,
          message: devMessage,
        });

        notifiedUsers.add(dev.userId);
      }
    }

    for (const projDev of updatedSprint.project?.projectDevelopers || []) {
      if (projDev.is_lead && !notifiedUsers.has(projDev.userId)) {
        notifications.push({
          userId: projDev.userId,
          type: "SPRINT_STATUS_UPDATE",
          entityId: updatedSprint.id,
          message: `You are the Project Leader. ${baseMessage}`,
        });
        notifiedUsers.add(projDev.userId);
      }
    }

    const created = await prisma.$transaction(
      notifications.map((n) =>
        prisma.notification.create({
          data: n,
        })
      )
    );

    for (const n of created) {
      io.to(n.userId).emit("notification", n);
    }

    res.status(200).json({
      success: true,
      message: "Sprint status updated successfully, notifications sent",
      sprint: updatedSprint,
    });
  } catch (error) {
    console.error("Update Sprint Status error:", error);
    res.status(500).json({
      error: "Failed to update sprint status",
      details: (error as Error).message,
    });
  }
};

export const getSprintTasks = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            developer: {
              select: {
                id: true,
                username: true,
                email: true,
                job_title: true,
              },
            },
          },
          orderBy: {
            start_date: "asc",
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!sprint) {
      res.status(404).json({ error: "Sprint not found" });
      return;
    }

    res.status(200).json({
      success: true,
      sprint: {
        id: sprint.id,
        sprint_name: sprint.sprint_name,
        status: sprint.status,
        project: sprint.project,
      },
      tasks: sprint.tasks,
    });
  } catch (error) {
    console.error("Get Sprint Tasks error:", error);
    res.status(500).json({
      error: "Failed to fetch sprint tasks",
      details: (error as Error).message,
    });
  }
};
