"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, CheckCircle2, CircleAlert, UserRound, X } from "lucide-react";
import { z } from "zod";
import { api } from "@/src/lib/api";
import type { Address, CitizenProfile, Document } from "@/src/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { ErrorState, LoadingState } from "@/components/ui/data-state";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const states = [
  "Andhra Pradesh",
  "Bihar",
  "Delhi",
  "Karnataka",
  "Maharashtra",
  "Tamil Nadu",
  "Uttar Pradesh",
  "West Bengal",
];

const profileFormSchema = z
  .object({
    full_name: z.string().trim().min(1, "Full name is required."),
    date_of_birth: z.string(),
    email: z.string().email("Enter a valid email address.").or(z.literal("")),
    mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number."),
    alternate_mobile: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number.")
      .or(z.literal("")),
  })
  .passthrough();

type ProfileFormValues = z.infer<typeof profileFormSchema> & Record<string, unknown>;
type ProfileKey = keyof CitizenProfile;
type AddressPrefix = "permanent" | "current";
type AddressField = "line1" | "line2" | "city" | "district" | "state" | "pincode" | "country";
type ToastState = { message: string; tone: "success" | "error" };

const profileGroups: Array<{ title: string; keys: ProfileKey[] }> = [
  { title: "Personal Details", keys: ["full_name", "date_of_birth", "gender", "nationality", "marital_status"] },
  { title: "Contact Details", keys: ["mobile", "alternate_mobile", "email"] },
  { title: "Parents Details", keys: ["father_name", "mother_name", "guardian_name", "guardian_relationship"] },
  {
    title: "Social / Reservation Details",
    keys: ["category", "ews_status", "disability_status", "ex_serviceman_status", "minority_status"],
  },
  {
    title: "Basic Education",
    keys: ["highest_qualification", "current_education_status", "current_course", "current_institution"],
  },
  {
    title: "Other General Details",
    keys: ["employment_status", "occupation", "annual_family_income_range", "preferred_language"],
  },
];

const labels: Record<string, string> = {
  full_name: "Full Name",
  date_of_birth: "Date of Birth",
  gender: "Gender",
  nationality: "Nationality",
  marital_status: "Marital Status",
  mobile: "Primary Mobile",
  alternate_mobile: "Alternate Mobile",
  email: "Email Address",
  father_name: "Father's Name",
  mother_name: "Mother's Name",
  guardian_name: "Guardian Name",
  guardian_relationship: "Guardian Relationship",
  category: "Category",
  ews_status: "EWS Status",
  disability_status: "Person with Disability (PwD)",
  ex_serviceman_status: "Ex-Serviceman Status",
  minority_status: "Minority Status",
  highest_qualification: "Highest Qualification",
  current_education_status: "Current Education Status",
  current_course: "Current Course",
  current_institution: "Current Institution",
  employment_status: "Employment Status",
  occupation: "Occupation",
  annual_family_income_range: "Annual Family Income Range",
  preferred_language: "Preferred Language",
};

const options: Record<string, string[]> = {
  gender: ["Male", "Female", "Other"],
  nationality: ["Indian"],
  marital_status: ["Unmarried", "Married", "Other"],
  guardian_relationship: ["Parent", "Relative", "Other"],
  category: ["General", "OBC", "SC", "ST"],
  ews_status: ["Yes", "No", "Not Applicable"],
  disability_status: ["Yes", "No"],
  ex_serviceman_status: ["Yes", "No"],
  minority_status: ["Yes", "No"],
  highest_qualification: [
    "Below Class 10",
    "Class 10",
    "Class 12",
    "Diploma",
    "Undergraduate",
    "Graduate",
    "Postgraduate",
    "Doctorate",
    "Other",
  ],
  current_education_status: [
    "School Student",
    "College Student",
    "University Student",
    "Pursuing Diploma",
    "Pursuing Undergraduate",
    "Pursuing Postgraduate",
    "Completed Education",
    "Not Currently Studying",
    "Other",
  ],
  employment_status: ["Student", "Employed", "Self-employed", "Unemployed", "Other"],
  annual_family_income_range: [
    "Below ₹1 lakh",
    "₹1–2.5 lakh",
    "₹2.5–5 lakh",
    "₹5–8 lakh",
    "Above ₹8 lakh",
    "Prefer not to specify",
  ],
  preferred_language: ["English", "Hindi", "Tamil"],
};

const addressFields: Array<[AddressField, string]> = [
  ["line1", "Address Line 1"],
  ["line2", "Address Line 2"],
  ["city", "Village / Town / City"],
  ["district", "District"],
  ["state", "State / UT"],
  ["pincode", "PIN Code"],
  ["country", "Country"],
];

function ProfilePicture({
  photo,
  preview,
  name,
  size = "size-24",
}: {
  photo?: Document;
  preview?: string;
  name: string;
  size?: string;
}) {
  const src =
    preview ||
    (photo
      ? `${apiBaseUrl}/api/profile/documents/${photo.id}/file?v=${encodeURIComponent(photo.updated_at)}`
      : undefined);
  return (
    <Avatar className={`${size} bg-muted ring-2 ring-background`}>
      <AvatarImage src={src} alt={`${name}'s profile photo`} className="object-cover" />
      <AvatarFallback>
        <UserRound className="size-10" aria-hidden="true" />
        <span className="sr-only">Profile photo unavailable</span>
      </AvatarFallback>
    </Avatar>
  );
}

function addressValues(address?: Address) {
  return {
    line1: address?.line1 ?? "",
    line2: address?.line2 ?? "",
    city: address?.city ?? "",
    district: address?.district ?? "",
    state: address?.state ?? "",
    pincode: address?.pincode ?? "",
    country: address?.country ?? "India",
  };
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not provided";
  const normalized = String(value);
  if (normalized === "NONE") return "No";
  if (normalized === "NOT_PROVIDED") return "Not provided";
  return normalized.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function AddressView({ title, address }: { title: string; address?: Address }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      {address ? (
        <address className="not-italic text-sm leading-6 text-muted-foreground">
          {address.line1}
          {address.line2 ? (
            <>
              <br />
              {address.line2}
            </>
          ) : null}
          <br />
          {address.city}, {address.district}
          <br />
          {address.state} - {address.pincode}
          <br />
          {address.country}
        </address>
      ) : (
        <p className="text-sm text-muted-foreground">Not provided</p>
      )}
    </section>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  const Icon = toast.tone === "success" ? CheckCircle2 : CircleAlert;
  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className="fixed right-4 top-4 z-[70] flex max-w-sm items-center gap-3 rounded-xl border bg-popover px-4 py-3 text-sm shadow-xl"
    >
      <Icon
        className={`size-5 shrink-0 ${toast.tone === "success" ? "text-emerald-600" : "text-destructive"}`}
        aria-hidden="true"
      />
      <p className="font-medium">{toast.message}</p>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Dismiss notification"
        onPress={onDismiss}
      >
        <X aria-hidden="true" />
      </Button>
    </div>
  );
}

function AddressEditor({
  prefix,
  form,
}: {
  prefix: AddressPrefix;
  form: ReturnType<typeof useForm<ProfileFormValues>>;
}) {
  const errors = form.formState.errors as Record<string, { message?: string }>;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {addressFields.map(([key, label]) => {
        const name = `${prefix}_${key}`;
        const error = errors[name]?.message;
        return (
          <div key={key} className={key === "line1" || key === "line2" ? "sm:col-span-2" : undefined}>
            <Label htmlFor={name}>{label}</Label>
            {key === "state" ? (
              <Select
                aria-label={label}
                selectedKey={String(form.watch(name) || "")}
                onSelectionChange={(value) => form.setValue(name, String(value), { shouldDirty: true })}
              >
                <SelectTrigger id={name} className="mt-2" aria-invalid={Boolean(error)}>
                  <SelectValue>{String(form.watch(name) || "Select a state")}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem id={state} key={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={name}
                className="mt-2"
                type="text"
                inputMode={key === "pincode" ? "numeric" : undefined}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${name}-error` : undefined}
                {...form.register(name)}
              />
            )}
            {error ? <p id={`${name}-error`} className="mt-1 text-xs text-destructive">{error}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

function FieldEditor({
  field,
  form,
}: {
  field: ProfileKey;
  form: ReturnType<typeof useForm<ProfileFormValues>>;
}) {
  const name = String(field);
  const error = (form.formState.errors as Record<string, { message?: string }>)[name]?.message;
  const choices = options[name];
  return (
    <div>
      <Label htmlFor={name}>{labels[name]}</Label>
      {choices ? (
        <Select
          aria-label={labels[name]}
          selectedKey={String(form.watch(name) || "")}
          onSelectionChange={(value) =>
            form.setValue(name, String(value), { shouldDirty: true, shouldValidate: true })
          }
        >
          <SelectTrigger id={name} className="mt-2" aria-invalid={Boolean(error)}>
            <SelectValue>
              {displayValue(form.watch(name)) === "Not provided"
                ? "Select an option"
                : displayValue(form.watch(name))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {choices.map((choice) => (
              <SelectItem id={choice} key={choice}>
                {choice}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={name}
          className="mt-2"
          type={name === "date_of_birth" ? "date" : name.includes("mobile") ? "tel" : "text"}
          inputMode={name.includes("mobile") ? "tel" : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          {...form.register(name)}
        />
      )}
      {error ? <p id={`${name}-error`} className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function ProfileContent() {
  const [data, setData] = useState<{ profile: CitizenProfile; documents: Document[] }>();
  const [isEditing, setIsEditing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sameAddress, setSameAddress] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [file, setFile] = useState<File>();
  const [photoPreview, setPhotoPreview] = useState<string>();
  const [toast, setToast] = useState<ToastState>();
  const fileInput = useRef<HTMLInputElement>(null);
  const form = useForm<ProfileFormValues>({ resolver: zodResolver(profileFormSchema) as never });
  const [currentEducationStatus, employmentStatus] = useWatch({
    control: form.control,
    name: ["current_education_status", "employment_status"],
  });

  const resetForm = useCallback(
    (profile: CitizenProfile) => {
      const permanent = profile.addresses.find((address) => address.type === "PERMANENT");
      const current = profile.addresses.find(
        (address) => address.type === "CORRESPONDENCE" || address.type === "CURRENT"
      );
      const editableValues = Object.fromEntries(
        profileGroups.flatMap((group) => group.keys).map((key) => [key, profile[key] ?? ""])
      );
      form.reset({
        ...editableValues,
        ...Object.fromEntries(
          Object.entries(addressValues(permanent)).map(([key, value]) => [`permanent_${key}`, value])
        ),
        ...Object.fromEntries(
          Object.entries(addressValues(current)).map(([key, value]) => [`current_${key}`, value])
        ),
      } as ProfileFormValues);
      setSameAddress(profile.current_address_same_as_permanent || !current);
    },
    [form]
  );

  const loadProfile = useCallback(async () => {
    const [profile, documents] = await Promise.all([api.getProfile(), api.getDocuments()]);
    setData({ profile, documents });
    resetForm(profile);
  }, [resetForm]);

  useEffect(() => {
    Promise.all([api.getProfile(), api.getDocuments()])
      .then(([profile, documents]) => {
        setData({ profile, documents });
        resetForm(profile);
      })
      .catch(() => setFailed(true));
  }, [resetForm]);

  useEffect(
    () => () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    },
    [photoPreview]
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(undefined), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (failed) return <ErrorState>We couldn&apos;t load your profile.</ErrorState>;
  if (!data) return <LoadingState label="Loading profile…" />;

  const profile = data.profile;
  const photo = data.documents.find((document) => document.document_type === "PROFILE_PHOTO");
  const permanentAddress = profile.addresses.find((address) => address.type === "PERMANENT");
  const currentAddress = profile.addresses.find(
    (address) => address.type === "CORRESPONDENCE" || address.type === "CURRENT"
  );
  const isStudying =
    String(currentEducationStatus).includes("Student") ||
    String(currentEducationStatus).startsWith("Pursuing");
  const visibleFields = (fields: ProfileKey[]) =>
    fields
      .filter((field) => !["current_course", "current_institution"].includes(String(field)) || isStudying)
      .filter((field) => field !== "occupation" || employmentStatus !== "Student");

  function showToast(message: string, tone: ToastState["tone"]) {
    setToast({ message, tone });
  }

  function openEditor() {
    resetForm(profile);
    setIsEditing(true);
  }

  function cancelEditor() {
    resetForm(profile);
    setIsEditing(false);
  }

  function clearPhotoDialog() {
    setPhotoOpen(false);
    setFile(undefined);
    setPhotoPreview(undefined);
    if (fileInput.current) fileInput.current.value = "";
  }

  function choosePhoto(selectedFile?: File) {
    if (!selectedFile) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(selectedFile.type) || selectedFile.size > 5_242_880) {
      showToast("Choose a JPG, PNG or WEBP image up to 5 MB.", "error");
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setFile(selectedFile);
    setPhotoPreview(URL.createObjectURL(selectedFile));
  }

  async function uploadPhoto() {
    if (!file) return;
    setPhotoBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (photo) await api.replaceDocument(photo.id, formData);
      else {
        formData.append("document_type", "PROFILE_PHOTO");
        await api.uploadDocument(formData);
      }
      await loadProfile();
      clearPhotoDialog();
      showToast("Profile photo updated.", "success");
    } catch {
      showToast("Could not update profile photo. Please try again.", "error");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removePhoto() {
    if (!photo) return;
    setPhotoBusy(true);
    try {
      await api.deleteDocument(photo.id);
      await loadProfile();
      setRemoveOpen(false);
      clearPhotoDialog();
      showToast("Profile photo removed.", "success");
    } catch {
      showToast("Could not remove profile photo. Please try again.", "error");
    } finally {
      setPhotoBusy(false);
    }
  }

  const saveProfile = form.handleSubmit(async (values) => {
    const makeAddress = (prefix: AddressPrefix, type: "PERMANENT" | "CORRESPONDENCE") => ({
      type,
      line1: String(values[`${prefix}_line1`] || ""),
      line2: String(values[`${prefix}_line2`] || "") || null,
      city: String(values[`${prefix}_city`] || ""),
      district: String(values[`${prefix}_district`] || ""),
      state: String(values[`${prefix}_state`] || ""),
      pincode: String(values[`${prefix}_pincode`] || ""),
      country: String(values[`${prefix}_country`] || "India"),
    });
    const profileValues = Object.fromEntries(
      profileGroups.flatMap((group) => group.keys).map((key) => [key, values[String(key)] ?? null])
    );
    const permanent = makeAddress("permanent", "PERMANENT");
    const addresses = [
      permanent,
      sameAddress ? { ...permanent, type: "CORRESPONDENCE" as const } : makeAddress("current", "CORRESPONDENCE"),
    ];
    try {
      const updatedProfile = await api.updateProfile({
        ...profileValues,
        current_address_same_as_permanent: sameAddress,
        addresses,
      });
      setData((current) => (current ? { ...current, profile: updatedProfile } : current));
      resetForm(updatedProfile);
      setIsEditing(false);
      showToast("Profile updated successfully.", "success");
    } catch {
      showToast("Could not update your profile. Please try again.", "error");
    }
  });

  return (
    <div className="space-y-6">
      <header className={`rounded-xl border bg-card p-5 ${isEditing ? "border-primary/25" : ""}`}>
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <div className="relative">
            <ProfilePicture photo={photo} name={profile.full_name} size="size-28" />
            <TooltipTrigger>
              <Button
                type="button"
                size="icon"
                className="absolute -right-1 -bottom-1 rounded-full"
                aria-label="Change profile photo"
                onPress={() => setPhotoOpen(true)}
              >
                <Camera aria-hidden="true" />
              </Button>
              <Tooltip>Change profile photo</Tooltip>
            </TooltipTrigger>
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-semibold">{profile.full_name}</h1>
            <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
          </div>
          {isEditing ? <div className="flex w-full gap-2 sm:w-auto"><Button type="button" variant="outline" className="flex-1 sm:flex-none" onPress={cancelEditor} isDisabled={form.formState.isSubmitting}>Cancel</Button><Button type="submit" form="profile-edit-form" className="flex-1 sm:flex-none" isDisabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Saving…" : "Save Changes"}</Button></div> : <Button type="button" onPress={openEditor}>Edit Profile</Button>}
        </div>
      </header>

      <form id="profile-edit-form" onSubmit={saveProfile} className="grid gap-5 xl:grid-cols-2">
        {profileGroups.map(({ title, keys }) => (
          <Card key={title} className={isEditing ? "border-primary/20" : undefined}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? <div className="grid gap-4 sm:grid-cols-2">{visibleFields(keys).map((key) => <FieldEditor key={String(key)} field={key} form={form} />)}</div> : <dl className="grid gap-4 sm:grid-cols-2">{visibleFields(keys).map((key) => <div key={String(key)}><dt className="text-xs text-muted-foreground">{labels[String(key)]}</dt><dd className="mt-1 text-sm font-medium">{displayValue(profile[key])}</dd></div>)}</dl>}
            </CardContent>
          </Card>
        ))}
        <Card className={`xl:col-span-2 ${isEditing ? "border-primary/20" : ""}`}>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? <div className="space-y-6"><section><h3 className="text-sm font-medium">Permanent Address</h3><div className="mt-4"><AddressEditor prefix="permanent" form={form} /></div></section><div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3.5"><Checkbox id="same-address" aria-label="Current correspondence address is the same as permanent address" isSelected={sameAddress} onChange={setSameAddress} /><label htmlFor="same-address" className="cursor-pointer text-sm leading-5 font-medium">Current / correspondence address is same as permanent address</label></div>{sameAddress ? <p className="text-sm text-muted-foreground">Current / correspondence address will use the permanent address.</p> : <section><h3 className="text-sm font-medium">Current / Correspondence Address</h3><div className="mt-4"><AddressEditor prefix="current" form={form} /></div></section>}</div> : <div className="grid gap-6 sm:grid-cols-2"><AddressView title="Permanent Address" address={permanentAddress} /><AddressView title="Current / Correspondence Address" address={profile.current_address_same_as_permanent ? permanentAddress : currentAddress} /></div>}
          </CardContent>
        </Card>
      </form>

      {/* Photo Upload Dialog */}
      <Dialog
        isOpen={photoOpen}
        onOpenChange={(open) => {
          if (!open) clearPhotoDialog();
        }}
        overlayClassName="bg-black/50 backdrop-blur-sm"
      >
        <DialogHeader>
          <DialogTitle>{photo ? "Change profile photo" : "Add profile photo"}</DialogTitle>
          <DialogDescription>JPG, PNG or WEBP · maximum 5 MB</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <ProfilePicture photo={photo} preview={photoPreview} name={profile.full_name} size="size-28" />
          <input
            ref={fileInput}
            className="sr-only"
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={(event) => choosePhoto(event.target.files?.[0])}
          />
          <Button type="button" variant="outline" onPress={() => fileInput.current?.click()}>
            {file ? "Choose Different Photo" : photo ? "Choose New Photo" : "Choose Image"}
          </Button>
          {file ? (
            <p className="text-sm">
              {file.name} · {(file.size / 1024).toFixed(0)} KB
            </p>
          ) : null}
          {photo ? (
            <Button type="button" variant="destructive" onPress={() => setRemoveOpen(true)}>
              Remove Photo
            </Button>
          ) : null}
        </div>
        <DialogFooter>
          <DialogClose type="button">Cancel</DialogClose>
          <Button type="button" isDisabled={!file || photoBusy} onPress={uploadPhoto}>
            {photoBusy ? "Saving…" : photo ? "Save Photo" : "Add Photo"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Remove Photo Confirmation Dialog */}
      <Dialog
        isOpen={removeOpen}
        onOpenChange={setRemoveOpen}
        overlayClassName="bg-black/50 backdrop-blur-sm"
      >
        <DialogHeader>
          <DialogTitle>Remove profile photo?</DialogTitle>
          <DialogDescription>
            Your profile photo will no longer be available for future applications.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose type="button">Cancel</DialogClose>
          <Button type="button" variant="destructive" isDisabled={photoBusy} onPress={removePhoto}>
            {photoBusy ? "Removing…" : "Remove Photo"}
          </Button>
        </DialogFooter>
      </Dialog>

      {toast ? <Toast toast={toast} onDismiss={() => setToast(undefined)} /> : null}
    </div>
  );
}
