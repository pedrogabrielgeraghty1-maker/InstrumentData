"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createItemAction } from "@/app/actions";

const initialForm = {
  user_name: "",
  instrument_name: "",
  part_number: "",
  serial_number: "",
};

export default function ItemForm() {
  const router = useRouter();
  const [formValues, setFormValues] = useState(initialForm);
  const [selectedFileName, setSelectedFileName] = useState("No file selected");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFileName(file ? file.name : "No file selected");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const fileInput = formElement.elements.namedItem("photo") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];

    if (!file) {
      setError("Select a part image before submitting.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadJson = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadJson.url) {
        throw new Error(uploadJson.error ?? "Image upload failed.");
      }

      const submitFormData = new FormData();
      submitFormData.append("user_name", formValues.user_name);
      submitFormData.append("instrument_name", formValues.instrument_name);
      submitFormData.append("part_number", formValues.part_number);
      submitFormData.append("serial_number", formValues.serial_number);
      submitFormData.append("photo_url", uploadJson.url);

      const result = await createItemAction(submitFormData);

      if (!result.success) {
        throw new Error(result.message ?? "Unable to save the item.");
      }

      setSuccess("Part recorded successfully.");
      setFormValues(initialForm);
      formElement.reset();
      setSelectedFileName("No file selected");
      router.refresh();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "There was a problem saving the part entry."
      );
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
            New entry
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Track a part</h2>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="user_name" className="mb-1.5 block text-sm font-medium text-slate-700">
            User name
          </label>
          <input
            id="user_name"
            name="user_name"
            value={formValues.user_name}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
            placeholder="John Smith"
            required
          />
        </div>

        <div>
          <label htmlFor="instrument_name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Instrument name
          </label>
          <input
            id="instrument_name"
            name="instrument_name"
            value={formValues.instrument_name}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
            placeholder="Ultrasound Model X"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="part_number" className="mb-1.5 block text-sm font-medium text-slate-700">
              Part number
            </label>
            <input
              id="part_number"
              name="part_number"
              value={formValues.part_number}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
              placeholder="P-00481"
              required
            />
          </div>

          <div>
            <label htmlFor="serial_number" className="mb-1.5 block text-sm font-medium text-slate-700">
              Serial number
            </label>
            <input
              id="serial_number"
              name="serial_number"
              value={formValues.serial_number}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
              placeholder="SN-12345"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="photo" className="mb-1.5 block text-sm font-medium text-slate-700">
            Part photo
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-violet-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-violet-500"
              required
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">Selected file: {selectedFileName}</p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isUploading || isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isUploading || isSubmitting ? "Saving entry..." : "Save part entry"}
        </button>
      </form>
    </section>
  );
}
