import { PrismaClient } from "@prisma/client";
import { runSeed } from "./seedData";

const prisma = new PrismaClient();

runSeed(prisma)
  .then(() => console.log("Seed complete. Demo login: demo@lifeos.app / demo1234"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
