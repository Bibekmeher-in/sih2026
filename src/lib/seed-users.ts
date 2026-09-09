import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { USER_STATUSES } from "@/types";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/config/demo-users";

export { DEMO_ACCOUNTS, DEMO_PASSWORD };

/**
 * Seeds or updates standard demo accounts into MongoDB.
 */
export async function seedDemoUsers() {
  await connectToDatabase();

  const results = [];

  for (const account of DEMO_ACCOUNTS) {
    const passwordHash = await bcrypt.hash(account.password, 12);

    const updatedUser = await User.findOneAndUpdate(
      { email: account.email.toLowerCase() },
      {
        name: account.name,
        email: account.email.toLowerCase(),
        passwordHash,
        role: account.role,
        phone: account.phone,
        status: USER_STATUSES.ACTIVE,
        location: account.location,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    results.push({
      email: updatedUser.email,
      role: updatedUser.role,
      name: updatedUser.name,
    });
  }

  return results;
}
