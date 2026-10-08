import { defaultClientConfig, prismaPostgres } from "@prisma/ppg";

type PostgresClient = ReturnType<typeof prismaPostgres>;
type SqlValue = string | number | boolean | null | undefined;

let postgresClient: PostgresClient | undefined;

function getConnectionString() {
  const candidates = [
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_URL,
    process.env.PRISMA_DATABASE_URL,
    process.env.DATABASE_URL,
  ];

  return candidates.find((connectionString) => {
    if (!connectionString) {
      return false;
    }

    try {
      const { hostname, password, username } = new URL(connectionString);
      return !(
        hostname === "host" &&
        username === "username" &&
        password === "password"
      );
    } catch {
      return false;
    }
  });
}

function getPostgresClient() {
  if (!postgresClient) {
    const connectionString = getConnectionString();
    if (!connectionString) {
      throw new Error("A PostgreSQL connection string is not configured.");
    }

    postgresClient = prismaPostgres(defaultClientConfig(connectionString));
  }

  return postgresClient;
}

async function runQuery<T extends object>(
  strings: TemplateStringsArray,
  ...values: SqlValue[]
): Promise<T[]> {
  return getPostgresClient().sql<T>(strings, ...values).collect();
}

async function runCommand(
  strings: TemplateStringsArray,
  ...values: SqlValue[]
) {
  return getPostgresClient().sql.exec(strings, ...values);
}

export type ItemRecord = {
  id: number;
  user_name: string;
  instrument_name: string;
  part_number: string;
  serial_number: string;
  photo_url: string | null;
  created_at: string;
};

export const isDatabaseConfigured = () => {
  return Boolean(getConnectionString());
};

const isVercelRuntime = () => process.env.VERCEL === "1";

async function ensureItemsTable() {
  await runCommand`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      user_name TEXT NOT NULL,
      instrument_name TEXT NOT NULL,
      part_number TEXT NOT NULL,
      serial_number TEXT NOT NULL UNIQUE,
      photo_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await runCommand`
    CREATE INDEX IF NOT EXISTS idx_items_created_at
    ON items (created_at DESC)
  `;
}

async function getLocalDatabase() {
  return import("@/lib/local-db");
}

export async function getItems(): Promise<ItemRecord[]> {
  if (!isDatabaseConfigured()) {
    if (isVercelRuntime()) {
      return [];
    }

    const { getLocalItems } = await getLocalDatabase();
    return getLocalItems();
  }

  try {
    await ensureItemsTable();
    const rows = await runQuery<ItemRecord>`
      SELECT id, user_name, instrument_name, part_number, serial_number, photo_url, created_at
      FROM items
      ORDER BY created_at DESC
    `;

    return rows;
  } catch (error) {
    console.error("Unable to fetch items:", error);
    return [];
  }
}

export async function createItem(input: {
  user_name: string;
  instrument_name: string;
  part_number: string;
  serial_number: string;
  photo_url?: string | null;
}) {
  if (!isDatabaseConfigured()) {
    if (isVercelRuntime()) {
      return {
        success: false,
        message:
          "Production storage is not configured. Add a PostgreSQL database to this Vercel project and redeploy.",
      };
    }

    const userName = input.user_name.trim();
    const instrumentName = input.instrument_name.trim();
    const partNumber = input.part_number.trim();
    const serialNumber = input.serial_number.trim();
    const photoUrl = input.photo_url?.trim() || null;

    if (!userName || !instrumentName || !partNumber || !serialNumber) {
      return {
        success: false,
        message: "All fields are required before saving the part entry.",
      };
    }

    try {
      const { createLocalItem } = await getLocalDatabase();
      const item = createLocalItem({
        user_name: userName,
        instrument_name: instrumentName,
        part_number: partNumber,
        serial_number: serialNumber,
        photo_url: photoUrl,
      });

      return { success: true, item };
    } catch (error) {
      console.error("Unable to create local item:", error);
      return {
        success: false,
        message: "Could not save the item. The serial number may already exist.",
      };
    }
  }

  const userName = input.user_name.trim();
  const instrumentName = input.instrument_name.trim();
  const partNumber = input.part_number.trim();
  const serialNumber = input.serial_number.trim();
  const photoUrl = input.photo_url?.trim() || null;

  if (!userName || !instrumentName || !partNumber || !serialNumber) {
    return {
      success: false,
      message: "All fields are required before saving the part entry.",
    };
  }

  try {
    await ensureItemsTable();
    const rows = await runQuery<ItemRecord>`
      INSERT INTO items (user_name, instrument_name, part_number, serial_number, photo_url)
      VALUES (${userName}, ${instrumentName}, ${partNumber}, ${serialNumber}, ${photoUrl})
      RETURNING id, user_name, instrument_name, part_number, serial_number, photo_url, created_at
    `;

    return {
      success: true,
      item: rows[0],
    };
  } catch (error) {
    console.error("Unable to create item:", error);

    return {
      success: false,
      message: "Could not save the item. The serial number may already exist.",
    };
  }
}

export async function deleteItem(id: number) {
  if (!isDatabaseConfigured()) {
    if (isVercelRuntime()) {
      return {
        success: false,
        message:
          "Production storage is not configured. Add a PostgreSQL database to this Vercel project and redeploy.",
      };
    }

    try {
      const { deleteLocalItem } = await getLocalDatabase();
      const deleted = deleteLocalItem(id);
      return deleted
        ? { success: true }
        : { success: false, message: "Could not delete the selected item." };
    } catch (error) {
      console.error("Unable to delete local item:", error);
      return {
        success: false,
        message: "Could not delete the selected item.",
      };
    }
  }

  try {
    await ensureItemsTable();
    await runCommand`
      DELETE FROM items
      WHERE id = ${id}
    `;

    return { success: true };
  } catch (error) {
    console.error("Unable to delete item:", error);

    return {
      success: false,
      message: "Could not delete the selected item.",
    };
  }
}
