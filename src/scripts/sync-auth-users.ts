import { Client, Databases } from "appwrite";
import * as dotenv from "dotenv";

dotenv.config();

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const API_KEY = process.env.NEXT_PUBLIC_APPWRITE_API_KEY!;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;

// Initialize Appwrite client (no setKey in modern SDK)
const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(PROJECT_ID);

const databases = new Databases(client);

async function syncUsers() {
    try {
        console.log("🔄 Starting user sync...");

        // Fetch all DB users
        const dbUsers = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID);

        for (const user of dbUsers.documents) {
            console.log(`🧾 Checking ${user.email} (${user.role})`);

            // Check if user already exists in Appwrite Auth
            const res = await fetch(`${APPWRITE_ENDPOINT}/users?search=${user.email}`, {
                headers: {
                    "X-Appwrite-Project": PROJECT_ID,
                    "X-Appwrite-Key": API_KEY,
                },
            });

            const result = await res.json();

            const exists =
                result.total && result.users && result.users.length > 0
                    ? result.users.some((u: any) => u.email === user.email)
                    : false;

            if (exists) {
                console.log(`✅ ${user.email} already exists in Auth.`);
                continue;
            }

            // Create new Appwrite Auth user with temporary password
            const createRes = await fetch(`${APPWRITE_ENDPOINT}/users`, {
                method: "POST",
                headers: {
                    "X-Appwrite-Project": PROJECT_ID,
                    "X-Appwrite-Key": API_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: user.userId,
                    email: user.email,
                    password: "TempPass123!",
                    name: user.name || user.email.split("@")[0],
                }),
            });

            const createData = await createRes.json();

            if (createRes.ok) {
                console.log(`✅ Created Auth user for ${user.email}`);
            } else {
                console.error(
                    `❌ Failed to create Auth user for ${user.email}:`,
                    createData.message || createData
                );
            }
        }

        console.log("🎉 User sync complete!");
    } catch (err) {
        console.error("💥 Sync failed:", err);
    }
}

syncUsers();
    