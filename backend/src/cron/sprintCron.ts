import cron from "node-cron";
import { prisma } from "../index";
import { io } from "../index";

cron.schedule("0 8 * * *", async () => {
  try {
    const now = new Date();
    console.log("[CRON] Vérification des sprints à", now.toLocaleString());
    // from pending to started
    const pendingSprints = await prisma.sprint.findMany({
      where: {
        status: 0,
        start_date: { lte: now },
      },
      include: { Sprint_developpers: true, project: true },
    });

    console.log(`[CRON] En attente → Démarrés : ${pendingSprints.length}`);

    for (const sprint of pendingSprints) {
      await prisma.sprint.update({
        where: { id: sprint.id },
        data: { status: 1 },
      });

      // notify sprint devs
      for (const dev of sprint.Sprint_developpers) {
        const message = `Le sprint "${sprint.sprint_name}" est maintenant ACTIF.`;
        const notification = await prisma.notification.create({
          data: {
            userId: dev.userId,
            type: "SPRINT_STARTED",
            entityId: sprint.id,
            message,
          },
        });
        io.to(dev.userId).emit("notification", notification);
      }

      // Notify project leader
      if (sprint.projectId) {
        const leader = await prisma.project_developpers.findFirst({
          where: { projectId: sprint.projectId, is_lead: true },
        });

        if (
          leader &&
          !sprint.Sprint_developpers.some((d) => d.userId === leader.userId)
        ) {
          const message = `Le sprint "${sprint.sprint_name}" de votre projet est maintenant ACTIF.`;
          const notification = await prisma.notification.create({
            data: {
              userId: leader.userId,
              type: "SPRINT_STARTED",
              entityId: sprint.id,
              message,
            },
          });
          io.to(leader.userId).emit("notification", notification);
        }
      }
    }

    //active to finished
    const activeSprints = await prisma.sprint.findMany({
      where: {
        status: 1,
        end_date: { lte: now },
      },
      include: { Sprint_developpers: true, project: true },
    });

    console.log(`[CRON] Actifs → Terminés : ${activeSprints.length}`);

    for (const sprint of activeSprints) {
      let messageForDev: string;
      let messageForLeader: string;

      if (sprint.status === 2) {
        await prisma.sprint.update({
          where: { id: sprint.id },
          data: { status: 3 },
        });
        messageForDev = `Le sprint "${sprint.sprint_name}" est TERMINÉ et a été COMPLÉTÉ avec succès ✅.`;
        messageForLeader = `Le sprint "${sprint.sprint_name}" est TERMINÉ et a été COMPLÉTÉ avec succès.`;
      } else {
        await prisma.sprint.update({
          where: { id: sprint.id },
          data: { status: 3 },
        });
        messageForDev = `Le sprint "${sprint.sprint_name}" est TERMINÉ mais n’a PAS été COMPLÉTÉ ❗.`;
        messageForLeader = `Le sprint "${sprint.sprint_name}" est TERMINÉ mais n’a PAS été COMPLÉTÉ.`;
      }

      // notify sprint devs
      for (const dev of sprint.Sprint_developpers) {
        const notification = await prisma.notification.create({
          data: {
            userId: dev.userId,
            type: "SPRINT_FINISHED",
            entityId: sprint.id,
            message: messageForDev,
          },
        });
        io.to(dev.userId).emit("notification", notification);
      }

      // notify project leader (skip if already in sprint devs)
      if (sprint.projectId) {
        const leader = await prisma.project_developpers.findFirst({
          where: { projectId: sprint.projectId, is_lead: true },
        });

        if (
          leader &&
          !sprint.Sprint_developpers.some((d) => d.userId === leader.userId)
        ) {
          const notification = await prisma.notification.create({
            data: {
              userId: leader.userId,
              type: "SPRINT_FINISHED",
              entityId: sprint.id,
              message: messageForLeader,
            },
          });
          io.to(leader.userId).emit("notification", notification);
        }
      }
    }
  } catch (err) {
    console.error("[CRON] Erreur lors de la vérification des sprints :", err);
  }
});


