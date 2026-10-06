"use server";

import { revalidatePath } from "next/cache";

import { createItem, deleteItem, getItems } from "@/lib/db";

export async function createItemAction(formData: FormData) {
  const payload = {
    user_name: String(formData.get("user_name") ?? "").trim(),
    instrument_name: String(formData.get("instrument_name") ?? "").trim(),
    part_number: String(formData.get("part_number") ?? "").trim(),
    serial_number: String(formData.get("serial_number") ?? "").trim(),
    photo_url: String(formData.get("photo_url") ?? "").trim() || null,
  };

  const result = await createItem(payload);

  if (result.success) {
    revalidatePath("/");
  }

  return result;
}

export async function deleteItemAction(formData: FormData): Promise<void> {
  const rawId = formData.get("id");
  const itemId = Number(rawId);

  if (!Number.isInteger(itemId) || itemId <= 0) {
    throw new Error("A valid item id is required.");
  }

  const result = await deleteItem(itemId);

  if (!result.success) {
    throw new Error(result.message ?? "Could not delete the item.");
  }

  revalidatePath("/");
}

export async function fetchItems() {
  return getItems();
}
