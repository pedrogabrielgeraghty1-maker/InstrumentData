import Image from "next/image";

import { deleteItemAction, fetchItems } from "@/app/actions";
import ItemForm from "@/components/item-form";
import { isDatabaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

const formatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function Home() {
  const items = await fetchItems();
  const needsVercelDatabase = process.env.VERCEL === "1" && !isDatabaseConfigured();

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
            Inventory tracker
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
            Instrument parts dashboard
          </h1>
        </header>

        {needsVercelDatabase ? (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            Connect a PostgreSQL database to this Vercel project and redeploy to enable persistent records.
            Add a Vercel Blob store as well to enable image uploads.
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                  Entry form
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Track a new item</h2>
              </div>
              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-3 text-sm text-violet-800">
                Add the user, instrument, part number, serial, and a photo for easy traceability.
              </div>
            </div>
            <div className="mt-6">
              <ItemForm />
            </div>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Recorded entries
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Part log</h2>
              </div>
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                {items.length} items
              </span>
            </div>

            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
                <p className="text-lg font-semibold text-slate-700">No parts recorded yet.</p>
                <p className="mt-2 text-sm text-slate-500">
                  Use the form to add your first instrument part entry.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm text-slate-700">
                  <thead>
                    <tr className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      <th className="px-3 py-2 font-medium">Photo</th>
                      <th className="px-3 py-2 font-medium">Instrument</th>
                      <th className="px-3 py-2 font-medium">Part #</th>
                      <th className="px-3 py-2 font-medium">Serial</th>
                      <th className="px-3 py-2 font-medium">User</th>
                      <th className="px-3 py-2 font-medium">Created</th>
                      <th className="px-3 py-2 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="rounded-2xl bg-slate-50 shadow-sm ring-1 ring-slate-200">
                        <td className="rounded-l-2xl px-3 py-3 align-middle">
                          <Image
                            src={item.photo_url || "/placeholder.svg"}
                            alt={`${item.instrument_name} part`}
                            width={64}
                            height={64}
                            className="h-16 w-16 rounded-xl object-cover shadow-sm"
                          />
                        </td>
                        <td className="px-3 py-3 align-middle font-semibold text-slate-900">
                          {item.instrument_name}
                        </td>
                        <td className="px-3 py-3 align-middle">{item.part_number}</td>
                        <td className="px-3 py-3 align-middle font-mono text-xs text-slate-600">
                          {item.serial_number}
                        </td>
                        <td className="px-3 py-3 align-middle">{item.user_name}</td>
                        <td className="px-3 py-3 align-middle text-slate-600">
                          {formatter.format(new Date(item.created_at))}
                        </td>
                        <td className="rounded-r-2xl px-3 py-3 text-right align-middle">
                          <form action={deleteItemAction}>
                            <input type="hidden" name="id" value={item.id} />
                            <button
                              type="submit"
                              className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
