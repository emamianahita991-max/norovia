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

router.post("/waitlist", async (req, res) => {
  const { email } = req.body ?? {};

  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }

  try {
    await db.insert(waitlistEntries).values({ email: email.toLowerCase().trim() });
    res.status(200).json({ success: true });
  } catch (err: unknown) {
    const pgCode =
      err !== null &&
      typeof err === "object" &&
      "code" in err &&
      typeof (err as { code: unknown }).code === "string"
        ? (err as { code: string }).code
        : null;

    if (pgCode === "23505") {
      res.status(409).json({ error: "You're already on the list." });
      return;
    }
    throw err;
  }
});

export default router;
