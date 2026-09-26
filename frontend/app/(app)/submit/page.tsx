"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, ImageIcon, Plus, X, Send } from "lucide-react";
import Link from "next/link";
import { useData } from "@/lib/data-store";
import type { Attachment, CustomFieldDef } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import {
  cloudinaryImage,
  isImageAttachment,
  uploadAccept,
  uploadFile,
} from "@/lib/cloudinary";
import { CategoryIcon } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function SubmitPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { role } = useSession();
  const { getCategories, createProblem, loading, error, refetch } = useData();
  const categories = getCategories();

  // Only industry accounts post problems; everyone else is sent back.
  useEffect(() => {
    if (role && role !== "industry") router.replace("/dashboard");
  }, [role, router]);

  const [categoryId, setCategoryId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [rewardPoints, setRewardPoints] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [dataFiles, setDataFiles] = useState<Attachment[]>([]);
  const [proofFiles, setProofFiles] = useState<Attachment[]>([]);
  // In-flight uploads per field, so the submit button waits for them.
  const [uploading, setUploading] = useState({ data: 0, proof: 0 });
  const [submitting, setSubmitting] = useState(false);
  const anyUploading = uploading.data + uploading.proof > 0;

  const category = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId]
  );

  // Reset per-category answers whenever the category changes.
  function chooseCategory(id: string) {
    setCategoryId(id);
    setFieldValues({});
  }

  function setField(key: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  }

  // Reward is optional; when filled it must be a whole number, 0 or more.
  const rewardValid = rewardPoints === "" || /^\d+$/.test(rewardPoints.trim());

  const requiredFilled =
    category &&
    title.trim() &&
    location.trim() &&
    description.trim() &&
    category.customFields.every((f) => String(fieldValues[f.key] ?? "").trim()) &&
    rewardValid;

  // Uploads each picked file to Cloudinary; failures are reported per file
  // and don't block the others.
  async function addFiles(
    kind: "data" | "proof",
    files: File[],
    setFiles: React.Dispatch<React.SetStateAction<Attachment[]>>
  ) {
    setUploading((u) => ({ ...u, [kind]: u[kind] + files.length }));
    await Promise.all(
      files.map(async (file) => {
        try {
          const uploaded = await uploadFile(file, kind);
          setFiles((prev) => [...prev, uploaded]);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : t("upload.failed"));
        } finally {
          setUploading((u) => ({ ...u, [kind]: u[kind] - 1 }));
        }
      })
    );
  }

  async function submit() {
    if (!requiredFilled || !category) {
      toast.error(t("submit.required"));
      return;
    }
    setSubmitting(true);
    try {
      // Numeric custom fields get coerced back to numbers before hitting the API.
      const customFieldValues: Record<string, string | number> = {};
      for (const f of category.customFields) {
        const raw = fieldValues[f.key] ?? "";
        customFieldValues[f.key] = f.type === "number" ? Number(raw) : raw;
      }

      await createProblem({
        title: title.trim(),
        categoryId: category.id,
        description: description.trim(),
        location: location.trim(),
        rewardPoints: rewardPoints.trim() ? Number(rewardPoints) : 0,
        customFieldValues,
        dataAttachments: dataFiles,
        proofAttachments: proofFiles,
      });
      toast.success(t("submit.success"));
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("submit.required"));
    } finally {
      setSubmitting(false);
    }
  }

  if (role !== "industry") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
        <p className="text-muted-foreground">{t("submit.industryOnly")}</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard">{t("problem.backToDashboard")}</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => refetch()}>
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          {t("submit.title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("submit.subtitle")}</p>
      </div>

      {/* Step 1: category */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-heading text-lg font-medium text-foreground">
            {t("submit.step.category")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("submit.step.categoryHint")}
          </p>
        </div>
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("submit.noCategories")}</p>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {categories.map((c) => {
            const active = categoryId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => chooseCategory(c.id)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl bg-card p-3 text-left ring-1 transition-colors",
                  active
                    ? "ring-2 ring-primary"
                    : "ring-foreground/10 hover:ring-foreground/25"
                )}
              >
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    color: c.accentColor,
                    backgroundColor: `color-mix(in oklch, ${c.accentColor}, transparent 88%)`,
                  }}
                >
                  <CategoryIcon name={c.icon} className="size-5" />
                </span>
                <span className="font-heading text-sm font-medium text-foreground">
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <>
          {/* Step 2: basics */}
          <section className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="font-heading text-lg font-medium text-foreground">
              {t("submit.step.basics")}
            </h2>
            <Field label={t("submit.field.title")} htmlFor="title">
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("submit.field.titlePlaceholder")}
              />
            </Field>
            <Field label={t("submit.field.location")} htmlFor="location">
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("submit.field.locationPlaceholder")}
              />
            </Field>
            <Field label={t("submit.field.description")} htmlFor="description">
              <Textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("submit.field.descriptionPlaceholder")}
              />
            </Field>
            <Field label={t("submit.field.reward")} htmlFor="reward">
              <Input
                id="reward"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={rewardPoints}
                onChange={(e) => setRewardPoints(e.target.value)}
                placeholder="0"
              />
              <p className="text-sm text-muted-foreground">
                {t("submit.field.rewardHint")}
              </p>
            </Field>
          </section>

          {/* Step 3: extra fields, defined by the chosen category */}
          <section className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="font-heading text-lg font-medium text-foreground">
              {t("submit.step.details")}
            </h2>
            {!category && (
              <p className="text-sm text-muted-foreground">{t("submit.categoryFirst")}</p>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {category?.customFields.map((f) => (
                <DynamicField
                  key={f.key}
                  field={f}
                  value={fieldValues[f.key] ?? ""}
                  onChange={(v) => setField(f.key, v)}
                  selectPlaceholder={t("submit.field.selectPlaceholder")}
                />
              ))}
            </div>
          </section>

          {/* Step 4: attachments (uploaded to Cloudinary) */}
          <section className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="font-heading text-lg font-medium text-foreground">
              {t("submit.step.attachments")}
            </h2>
            <AttachmentField
              label={t("submit.data.label")}
              hint={t("submit.data.hint")}
              addLabel={t("submit.addFile")}
              uploadingLabel={t("upload.uploading")}
              kind="data"
              files={dataFiles}
              uploading={uploading.data > 0}
              onAdd={(files) => addFiles("data", files, setDataFiles)}
              onRemove={(url) =>
                setDataFiles((prev) => prev.filter((f) => f.url !== url))
              }
            />
            <AttachmentField
              label={t("submit.proof.label")}
              hint={t("submit.proof.hint")}
              addLabel={t("submit.addFile")}
              uploadingLabel={t("upload.uploading")}
              kind="proof"
              files={proofFiles}
              uploading={uploading.proof > 0}
              onAdd={(files) => addFiles("proof", files, setProofFiles)}
              onRemove={(url) =>
                setProofFiles((prev) => prev.filter((f) => f.url !== url))
              }
            />
            <p className="text-sm text-muted-foreground">
              {t("submit.uploadNote")}
            </p>
          </section>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <Button
              size="lg"
              onClick={submit}
              disabled={!requiredFilled || submitting || anyUploading}
            >
              {submitting ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Send />
              )}
              {t("submit.submit")}
            </Button>
          </div>
      </>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

/** Renders the right control for a custom field's type. */
function DynamicField({
  field,
  value,
  onChange,
  selectPlaceholder,
}: {
  field: CustomFieldDef;
  value: string;
  onChange: (v: string) => void;
  selectPlaceholder: string;
}) {
  const labelWithUnit = field.unit
    ? `${field.label} (${field.unit})`
    : field.label;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`cf-${field.key}`}>{labelWithUnit}</Label>
      {field.type === "select" ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={`cf-${field.key}`} className="w-full">
            <SelectValue placeholder={selectPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={`cf-${field.key}`}
          type={field.type === "number" ? "number" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

/** File picker that lists what's been uploaded; images get a thumbnail. */
function AttachmentField({
  label,
  hint,
  addLabel,
  uploadingLabel,
  kind,
  files,
  uploading,
  onAdd,
  onRemove,
}: {
  label: string;
  hint: string;
  addLabel: string;
  uploadingLabel: string;
  kind: "data" | "proof";
  files: Attachment[];
  uploading: boolean;
  onAdd: (files: File[]) => void;
  onRemove: (url: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const Icon = kind === "proof" ? ImageIcon : FileText;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow picking the same file again later
    if (picked.length > 0) onAdd(picked);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">{hint}</p>
        </div>
        <input
          ref={input}
          type="file"
          multiple
          accept={uploadAccept(kind)}
          className="hidden"
          onChange={handleChange}
        />
        <Button
          variant="outline"
          size="sm"
          type="button"
          disabled={uploading}
          onClick={() => input.current?.click()}
        >
          {uploading ? (
            <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Plus />
          )}
          {uploading ? uploadingLabel : addLabel}
        </Button>
      </div>
      {files.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {files.map((f) => (
            <li
              key={f.url}
              className="flex items-center gap-2.5 rounded-lg bg-muted px-3 py-2"
            >
              {isImageAttachment(f) ? (
                // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already resizes and optimizes this.
                <img
                  src={cloudinaryImage(f.url!, "c_fill,w_80,h_80")}
                  alt=""
                  className="size-8 shrink-0 rounded object-cover"
                />
              ) : (
                <Icon className="size-4 shrink-0 text-primary" />
              )}
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {f.name}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {f.size}
              </span>
              <button
                type="button"
                onClick={() => onRemove(f.url!)}
                className="text-muted-foreground transition-colors hover:text-destructive"
                aria-label="Remove"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
