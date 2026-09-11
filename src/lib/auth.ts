import mongoose from "mongoose";
import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { loginSchema } from "@/schemas";
import { UserRole, UserStatus, USER_STATUSES } from "@/types";
import { DEMO_ACCOUNTS } from "@/config/demo-users";

const DEMO_FALLBACK_IDS: Record<string, string> = {
  FARMER: "6aa0423a0538678929da1f9a",
  FPO: "6aa0423b0538678929da1f9b",
  BULK_BUYER: "6aa0423b0538678929da1f9c",
  CONSUMER: "6aa0423b0538678929da1f9d",
  ADMIN: "6aa0423b0538678929da1f9e",
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      phone: string;
      status: UserStatus;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    phone: string;
    status: UserStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    phone: string;
    status: UserStatus;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          throw new Error("Invalid credentials format");
        }

        try {
          await connectToDatabase();

          let user = await User.findOne({
            email: parsed.data.email.toLowerCase(),
          });

          // If demo account not yet in DB, auto-seed it with valid credentials
          if (!user) {
            const demoAccount = DEMO_ACCOUNTS.find(
              (a) => a.email.toLowerCase() === parsed.data.email.toLowerCase()
            );
            if (demoAccount && parsed.data.password === demoAccount.password) {
              const passwordHash = await bcrypt.hash(demoAccount.password, 12);
              user = await User.create({
                name: demoAccount.name,
                email: demoAccount.email.toLowerCase(),
                passwordHash,
                role: demoAccount.role,
                phone: demoAccount.phone,
                status: USER_STATUSES.ACTIVE,
                location: demoAccount.location,
              });
            }
          }

          if (user) {
            if (user.status === "SUSPENDED" || user.status === "INACTIVE") {
              throw new Error("This account is currently suspended or inactive. Contact support.");
            }

            const isValid = await bcrypt.compare(
              parsed.data.password,
              user.passwordHash
            );

            if (!isValid) {
              throw new Error("Incorrect password. Please try again.");
            }

            return {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
              phone: user.phone,
              status: user.status,
              image: user.avatar || "",
            };
          }
        } catch (dbErr: unknown) {
          console.warn("DB authentication unavailable, falling back to demo credentials:", (dbErr as Error).message);
        }

        // Demo account fallback matching for offline / evaluation
        const demoAccount = DEMO_ACCOUNTS.find(
          (a) => a.email.toLowerCase() === parsed.data.email.toLowerCase()
        );
        if (demoAccount && parsed.data.password === demoAccount.password) {
          return {
            id: DEMO_FALLBACK_IDS[demoAccount.role] || "6aa0423a0538678929da1f9a",
            name: demoAccount.name,
            email: demoAccount.email,
            role: demoAccount.role,
            phone: demoAccount.phone,
            status: "ACTIVE" as UserStatus,
            image: "",
          };
        }

        throw new Error("Invalid credentials. For demo, use password Kisan@1234");
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
        token.status = user.status;
        token.email = user.email;
        token.name = user.name;
      }

      // Auto-heal fallback or invalid IDs to real MongoDB ObjectIds
      const isFallbackId =
        token.id && Object.values(DEMO_FALLBACK_IDS).includes(token.id as string);
      const isInvalidId =
        !token.id ||
        !mongoose.Types.ObjectId.isValid(token.id as string) ||
        (typeof token.id === "string" && token.id.startsWith("demo_user_"));

      if (isFallbackId || isInvalidId) {
        try {
          await connectToDatabase();
          const dbUser = await User.findOne({
            $or: [
              ...(token.email ? [{ email: (token.email as string).toLowerCase() }] : []),
              ...(token.role ? [{ role: token.role }] : []),
            ],
          });
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
            token.email = dbUser.email;
            token.name = dbUser.name;
          }
        } catch {
          // silently continue
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.phone = token.phone;
        session.user.status = token.status;
        if (token.email) session.user.email = token.email as string;
        if (token.name) session.user.name = token.name as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};

/**
 * Server-side helper to retrieve the authenticated user session.
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

/**
 * Server-side guard: Ensures the user is logged in.
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Please sign in to continue");
  }
  return user;
}

/**
 * Server-side guard: Ensures user possesses one of the authorized roles.
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      `Forbidden: Role '${user.role}' is not authorized. Required: ${allowedRoles.join(", ")}`
    );
  }
  return user;
}
