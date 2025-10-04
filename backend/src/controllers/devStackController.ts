import { connect } from "http2";
import { prisma } from "..";
import { Request, Response } from "express";

export const createDevStack = async (req: Request, res: Response) => {
  const { framework, programming_language, version } = req.body;

  try {
    const newDevStack = await prisma.dev_stack.create({
      data: {
        framework,
        programming_language,
        version,
      },
    });
    res.status(201).json({ success: true, message: "created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error creating Dev_stack", error });
  }
};

export const getAllDevStacks = async (req: Request, res: Response) => {
  try {
    const devStacks = await prisma.dev_stack.findMany({
      include: { developpersStack: true, noeuds: true },
    });
    res.status(200).json(devStacks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching Dev_stacks", error });
  }
};

export const updateDevStack = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { framework, programming_language, version } = req.body;

  try {
    const updatedDevStack = await prisma.dev_stack.update({
      where: { id },
      data: {
        framework,
        programming_language,
        version,
      },
    });

    res.status(200).json({ success: true, message: "updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating Dev_stack", error });
  }
};

export const deleteDevStack = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const deletedDevStack = await prisma.dev_stack.delete({
      where: { id },
    });

    res.status(200).json({ success: true, message: "deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting Dev_stack", error });
  }
};

export const assginDevToStack = async (req: Request, res: Response) => {
  const { devStackId, userId } = req.body;
  try {
    await prisma.developpers_stack.create({
      data: {
        dev_stack: {
          connect: {
            id: devStackId,
          },
        },
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
    res.json({ success: true, message: "assgined successfully" });
  } catch (error) {
    res.json({ success: false, message: "unable to assign verify data sent" });
  }
};

export const getDevStack = async (req: Request, res: Response) => {
  const userId = req.params.id;
  console.log("userId from request:", userId);

  try {
    const stacks = await prisma.developpers_stack.findMany({
      where: {
        userId: userId,
      },
      include: {
        dev_stack: true,
        user: true,
      },
    });

    console.log(" Found stacks:", stacks);
    res.json(stacks);
  } catch (error) {
    console.error("Error in getDevStack:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const removeDevFromStack = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, devStackId } = req.body;

  try {
    
    const assignment = await prisma.developpers_stack.findUnique({
      where: {
        userId_devStackId: {  
          userId,
          devStackId,
        },
      },
    });

    if (!assignment) {
      res.status(404).json({
        success: false,
        message:
          "Assignment not found. Please provide a valid userId and devStackId.",
      });
      return;
    }

    
    await prisma.developpers_stack.delete({
      where: {
        userId_devStackId: {  
          userId,
          devStackId,
        },
      },
    });

    res.json({
      success: true,
      message: "Removed developer from stack successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Unable to remove assignment",
      error,
    });
  }
};

