import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    await connectDB();

    const user = await User.findOne({ email: body.email.toLowerCase() });
    if (!user) {
      await logActivity({
        userName: body.email,
        module: "Auth",
        action: "Login",
        description: "Failed login — account not found",
        status: "Failed",
      });
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      await logActivity({
        userId: String(user._id),
        userName: user.name,
        module: "Auth",
        action: "Login",
        description: "Failed login — incorrect password",
        status: "Failed",
      });
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const token = await createSessionToken({
      id: String(user._id),
      name: user.name,
      email: user.email,
    });

    await logActivity({
      userId: String(user._id),
      userName: user.name,
      module: "Auth",
      action: "Login",
      description: "Logged in successfully",
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
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
