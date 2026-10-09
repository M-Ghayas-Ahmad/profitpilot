import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(6).max(72),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    await connectDB();

    const exists = await User.findOne({ email: body.email.toLowerCase() });
    if (exists) {
      await logActivity({
        userName: body.email,
        module: "Auth",
        action: "Register",
        description: "Failed to register — email already exists",
        status: "Failed",
      });
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await User.create({
      name: body.name,
      email: body.email.toLowerCase(),
      passwordHash,
    });

    const token = await createSessionToken({
      id: String(user._id),
      name: user.name,
      email: user.email,
    });

    await logActivity({
      userId: String(user._id),
      userName: user.name,
      module: "Auth",
      action: "Register",
      description: "Account created successfully",
      status: "Success",
    });

    const res = NextResponse.json({
      user: { id: String(user._id), name: user.name, email: user.email },
    });
    return setSessionCookie(res, token);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }
    console.error(err);
    const message =
      err instanceof Error &&
      /ENOTFOUND|ECONNREFUSED|MongoServerError|MongoNetworkError/i.test(
        err.message,
      )
        ? "Cannot reach MongoDB. Check MONGODB_URI / Atlas Network Access."
        : "Registration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
