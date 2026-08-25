import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/passwordHasher";
import readline from "readline/promises";
import { stdin, stdout } from "process";

const prisma = new PrismaClient();

async function prompt(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({
    input: stdin,
    output: stdout,
  });

  if (!hidden) {
    const answer = await rl.question(question);
    rl.close();
    return answer.trim();
  }

  return new Promise((resolve) => {
    let input = "";

    const onData = (char: Buffer) => {
      const c = char.toString();

      if (c === "\n" || c === "\r" || c === "\u0004") {
        stdin.setRawMode?.(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        stdout.write("\n");
        resolve(input);
      } else if (c === "\u0003") {
        process.exit(1);
      } else if (c === "\u007f") {
        input = input.slice(0, -1);
      } else {
        input += c;
      }
    };

    stdout.write(question);
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.on("data", onData);
  });
}

async function main() {
  console.log("=== Create Admin Account ===\n");

  const username = await prompt("Username: ");

  if (!username) {
    throw new Error("Username is required.");
  }

  const existing = await prisma.user.findUnique({
    where: { username },
  });

  if (existing) {
    const overwrite = await prompt(
      `A user "${username}" already exists (role: ${existing.role}). Reset their password and make them Admin? (y/N): `,
    );

    if (overwrite.toLowerCase() !== "y") {
      console.log("Aborted.");
      return;
    }
  }

  const password = await prompt("Password: ", true);

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { username },

    create: {
      username,
      password: hashedPassword,
      role: "ADMIN",
    },

    update: {
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log(`\n✓ Admin account ready: ${user.username} (${user.id})`);
}

main()
  .catch((e) => {
    console.error("\nError:", e.message ?? e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
