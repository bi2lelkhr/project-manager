import cron from "node-cron";
import { prisma } from "../index";
import { io } from "../index";

cron.schedule("0 8 * * *", async () => {
  try {
    const now = new Date();
    console.log("[CRON] Checking tasks at", now.toLocaleString());

    // from pending to active
    const pendingTasks = await prisma.task.findMany({
      where: {
        status: 0,
        start_date: { lte: now },
      },
      include: {
        sprint: {
          include: { Sprint_developpers: { where: { is_lead: true } } },
        },
        developer: true,
      },
    });

    console.log(`[CRON] Pending → Active tasks: ${pendingTasks.length}`);

    for (const task of pendingTasks) {
      await prisma.task.update({
        where: { id: task.id },
        data: { status: 1 },
      });

      // notify developer
      if (task.developerId) {
        const message = `Votre tâche "${task.designation}" est maintenant ACTIVE.`;
        const notification = await prisma.notification.create({
          data: {
            userId: task.developerId,
            type: "TASK_STARTED",
            entityId: task.id,
            message,
          },
        });
        io.to(task.developerId).emit("notification", notification);
      }

      // notify sprint leads (skip if same as developer)
      if (task.sprint?.Sprint_developpers?.length) {
        for (const sprintDev of task.sprint.Sprint_developpers) {
          if (sprintDev.userId === task.developerId) continue;

          const message = `La tâche "${task.designation}" dans le sprint "${task.sprint.sprint_name}" est maintenant ACTIVE.`;
          const notification = await prisma.notification.create({
            data: {
              userId: sprintDev.userId,
              type: "TASK_STARTED",
              entityId: task.id,
              message,
            },
          });
          io.to(sprintDev.userId).emit("notification", notification);
        }
      }
    }

    //active to completed
    const tasksToFinish = await prisma.task.findMany({
      where: {
        status: { in: [1, 2] },
        end_date: { lte: now },
        finished_at: null,
      },
      include: {
        sprint: {
          include: { Sprint_developpers: { where: { is_lead: true } } },
        },
        developer: true,
      },
    });

    console.log(
      `[CRON] Active/Completed → Finished tasks: ${tasksToFinish.length}`
    );

    for (const task of tasksToFinish) {
      const newStatus = task.status === 2 ? 2 : 3;

      await prisma.task.update({
        where: { id: task.id },
        data: { status: newStatus, finished_at: now },
      });

      // notify developer
      if (task.developerId) {
        const message =
          task.status === 2
            ? `Votre tâche "${task.designation}" est terminée et a été COMPLÉTÉE.`
            : `Votre tâche "${task.designation}" est terminée mais n'a PAS été COMPLÉTÉE.`;

        const notification = await prisma.notification.create({
          data: {
            userId: task.developerId,
            type: "TASK_ENDED",
            entityId: task.id,
            message,
          },
        });
        io.to(task.developerId).emit("notification", notification);
      }

      // notify sprint leads (skip if same as developer)
      if (task.sprint?.Sprint_developpers?.length) {
        for (const sprintDev of task.sprint.Sprint_developpers) {
          if (sprintDev.userId === task.developerId) continue;

          const message =
            task.status === 2
              ? `La tâche "${task.designation}" dans le sprint "${task.sprint.sprint_name}" est terminée et a été COMPLÉTÉE.`
              : `La tâche "${task.designation}" dans le sprint "${task.sprint.sprint_name}" est terminée mais n'a PAS été COMPLÉTÉE.`;

          const notification = await prisma.notification.create({
            data: {
              userId: sprintDev.userId,
              type: "TASK_ENDED",
              entityId: task.id,
              message,
            },
          });
          io.to(sprintDev.userId).emit("notification", notification);
        }
      }
    }
  } catch (err) {
    console.error("[CRON] Error checking tasks:", err);
  }
});
