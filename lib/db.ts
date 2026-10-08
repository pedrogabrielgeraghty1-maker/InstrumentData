import { createClient, sql, type QueryResult, type QueryResultRow } from "@vercel/postgres";
import { createLocalItem, deleteLocalItem, getLocalItems } from "@/lib/local-db";

type SqlValue = string | number | boolean | null | undefined;

async function runQuery<T extends QueryResultRow>(
  strings: TemplateStringsArray,
  ...values: SqlValue[]
): Promise<QueryResult<T>> {
  const queryDirect = async (connectionString: string) => {
    const client = createClient({ connectionString });
    await client.connect();
    try {
      return await client.sql<T>(strings, ...values);
    } finally {
      await client.end();
    }
  }

  const directConnectionString = process.env.POSTGRES_URL_NON_POOLING;
  if (directConnectionString) {
    return queryDirect(directConnectionString);
  }

  try {
    return await sql<T>(strings, ...values);
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : undefined;

    if (code !== "invalid_connection_string" || !process.env.POSTGRES_URL) {
      throw error;
    }

    return queryDirect(process.env.POSTGRES_URL);
  }
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

const isDatabaseConfigured = () => {
  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;

  if (!connectionString) {
    return false;
  }

  try {
    const { hostname, password, username } = new URL(connectionString);
    return !(hostname === "host" && username === "username" && password === "password");
  } catch {
    return false;
  }
};

export async function getItems(): Promise<ItemRecord[]> {
  if (!isDatabaseConfigured()) {
    return getLocalItems();
  }

  try {
    const { rows } = await runQuery<ItemRecord>`
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
    const { rows } = await runQuery<ItemRecord>`
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
    try {
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
    await runQuery`
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
