import { Router, type IRouter } from "express";
import { db, waitlistEntries } from "@workspace/db";

const router: IRouter = Router();

function isValidEmail(email: unknown): email is string {
  return (
    typeof email === "string" &&
    email.length > 0 &&
    email.length <= 320 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

async function addToLoops(email: string): Promise<void> {
  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey) {
    console.warn("LOOPS_API_KEY not set — skipping Loops sync");
    return;
  }

  const res = await fetch("https://app.loops.so/api/v1/contacts/create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      source: "waitlist",
      subscribed: true,
      userGroup: "Waitlist",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Loops API error ${res.status}: ${body}`);
  }
}

router.post("/waitlist", async (req, res) => {
  const { email } = req.body ?? {};

  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }

  const normalised = email.toLowerCase().trim();

  try {
    await db.insert(waitlistEntries).values({ email: normalised });
  } catch (err: unknown) {
    const getPgCode = (e: unknown): string | null => {
      if (e === null || typeof e !== "object") return null;
      const obj = e as Record<string, unknown>;
      if (typeof obj.code === "string") return obj.code;
      if ("cause" in obj) return getPgCode(obj.cause);
      return null;
    };

    if (getPgCode(err) === "23505") {
      res.status(409).json({ error: "You're already on the list." });
      return;
    }
    throw err;
  }

  addToLoops(normalised).catch((err) =>
    console.error("Loops sync failed:", err)
  );

  res.status(200).json({ success: true });
});

export default router;
