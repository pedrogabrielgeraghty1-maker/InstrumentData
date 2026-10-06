import { sql } from "@vercel/postgres";

export type ItemRecord = {
  id: number;
  user_name: string;
  instrument_name: string;
  part_number: string;
  serial_number: string;
  photo_url: string | null;
  created_at: string;
};

const isDatabaseConfigured = () => Boolean(process.env.POSTGRES_URL);

export async function getItems(): Promise<ItemRecord[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    const { rows } = await sql<ItemRecord>`
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
    return {
      success: false,
      message: "Database is not configured yet. Add POSTGRES_URL to your environment.",
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
    const { rows } = await sql<ItemRecord>`
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
    return {
      success: false,
      message: "Database is not configured yet. Add POSTGRES_URL to your environment.",
    };
  }

  try {
    await sql`
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
