"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { cn } from "@/app/lib/utils";

const documentTypeOptions = [
  { value: "procedure", label: "Procedure" },
  { value: "description", label: "Description" },
  { value: "warning", label: "Warning" },
  { value: "mixed", label: "Mixed" },
] as const;

const documentTypeValues = [
  "procedure",
  "description",
  "warning",
  "mixed",
] as const;

const schema = z.object({
  project: z.string().optional(),
  documentType: z.enum(documentTypeValues).optional(),
  revision: z.string().optional(),
  author: z.string().optional(),
});

export type UploadMetadataFormValues = z.infer<typeof schema>;

/** Form state allows empty string for documentType (select placeholder) */
type FormState = Omit<UploadMetadataFormValues, "documentType"> & {
  documentType?: UploadMetadataFormValues["documentType"] | "";
};

interface UploadMetadataFormProps {
  onSubmit: (values: UploadMetadataFormValues) => void;
  onAnalyze: (metadata: UploadMetadataFormValues) => void;
  hasFiles: boolean;
  isAnalyzing?: boolean;
  className?: string;
}

export function UploadMetadataForm({
  onSubmit,
  onAnalyze,
  hasFiles,
  isAnalyzing = false,
  className,
}: UploadMetadataFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormState>({
    defaultValues: {
      project: "",
      documentType: "",
      revision: "",
      author: "",
    },
  });

  const handleFormSubmit = (data: FormState) => {
    const parsed = schema.safeParse({
      ...data,
      documentType: data.documentType === "" ? undefined : data.documentType,
    });
    if (parsed.success) onSubmit(parsed.data);
  };

  const getParsedMetadata = (): UploadMetadataFormValues => {
    const data = watch();
    const parsed = schema.safeParse({
      ...data,
      documentType: data.documentType === "" ? undefined : data.documentType,
    });
    return parsed.success ? parsed.data : {};
  };

  const handleAnalyzeClick = () => {
    onAnalyze(getParsedMetadata());
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn("space-y-4", className)}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="upload-project"
            className="mb-1 block text-sm font-medium text-[var(--foreground)]"
          >
            Project (optional)
          </label>
          <input
            id="upload-project"
            type="text"
            {...register("project")}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            placeholder="e.g. B737 AMM Rev 12"
          />
          {errors.project && (
            <p className="mt-1 text-xs text-[var(--danger)]">
              {errors.project.message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="upload-documentType"
            className="mb-1 block text-sm font-medium text-[var(--foreground)]"
          >
            Document type (optional)
          </label>
          <select
            id="upload-documentType"
            {...register("documentType")}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          >
            <option value="">— Select —</option>
            {documentTypeOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="upload-revision"
            className="mb-1 block text-sm font-medium text-[var(--foreground)]"
          >
            Revision (optional)
          </label>
          <input
            id="upload-revision"
            type="text"
            {...register("revision")}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            placeholder="e.g. 12"
          />
        </div>
        <div>
          <label
            htmlFor="upload-author"
            className="mb-1 block text-sm font-medium text-[var(--foreground)]"
          >
            Author (optional)
          </label>
          <input
            id="upload-author"
            type="text"
            {...register("author")}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            placeholder="Author name"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleAnalyzeClick}
          disabled={!hasFiles || isAnalyzing}
          className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Analyzing...
            </>
          ) : (
            "Analyze"
          )}
        </button>
        <p className="text-xs text-[var(--muted-foreground)]">
          {hasFiles
            ? "Upload and run STE compliance analysis; you will be redirected to the dashboard."
            : "Add at least one document to analyze."}
        </p>
      </div>
    </form>
  );
}
