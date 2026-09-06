"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronRight, Ellipsis, Eye, Landmark, Search, Trash2 } from "lucide-react";
import { api } from "@/src/lib/api";
import type { ApplicationDetail, ApplicationStatus, ApplicationSummary } from "@/src/types";
import { Button, LinkButton } from "@/components/ui/button";
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState, LoadingState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { SubmittedApplicationDialog } from "@/components/application/submitted-application-dialog";
import { applicationFlowPath } from "@/components/application/application-flow-navigation";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";
import { localizeServiceName } from "@/src/i18n/service-localization";
import { ApplicationStatusBadge } from "@/components/application/status-badge";

type Filter = "All" | "Draft" | "Submitted";
export type ApplicationListItem = ApplicationSummary;

const actionableStatuses: ApplicationStatus[] = [
  "DRAFT",
  "ADDITIONAL_INFO_REQUIRED",
  "CONSENT_REQUIRED",
  "READY_FOR_REVIEW",
  "PAYMENT_REQUIRED",
];

function isDraft(status: ApplicationStatus) {
  return actionableStatuses.includes(status);
}

function resumeRoute(application: ApplicationDetail) {
  if (application.status === "ADDITIONAL_INFO_REQUIRED") return "additional";
  if (application.status === "DRAFT" || application.status === "CONSENT_REQUIRED") return "consent";
  if (application.status === "PAYMENT_REQUIRED") return "payment";
  return "preview";
}

function formatDate(value: string, language: string) {
  return new Intl.DateTimeFormat(`${language}-IN`, { dateStyle: "medium" }).format(new Date(value));
}

function ApplicationRow({
  application,
  showUpdated = true,
  onOpen,
  onViewDetails,
  onDelete,
}: {
  application: ApplicationListItem;
  showUpdated?: boolean;
  onOpen: (application: ApplicationListItem) => void;
  onViewDetails: (application: ApplicationListItem) => void;
  onDelete: (application: ApplicationListItem) => void;
}) {
  const { language, t } = useCitizenPreferences();
  const draft = isDraft(application.status);
  const canDelete = draft;
  const viewLabel = draft ? t("continue") : t("view");
  const badge = <ApplicationStatusBadge status={application.status} />;

  return (
    <article
      className={`grid gap-3 px-5 py-5 transition-colors hover:bg-muted/40 ${
        showUpdated ? "sm:grid-cols-[minmax(0,1fr)_130px_110px_140px]" : "sm:grid-cols-[minmax(0,1fr)_110px_140px]"
      } sm:items-center sm:gap-6 ${draft ? "bg-amber-50/30" : ""}`}
    >
      <div className="min-w-0">
        <p className="text-base font-medium text-foreground sm:text-sm">{localizeServiceName(application.service_id, application.service_name, language)}</p>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <Landmark className="size-4 shrink-0" aria-hidden="true" />
          {application.department}
        </p>
      </div>
      {showUpdated ? (
        <div className="flex items-baseline justify-between gap-3 sm:block">
          <p className="text-xs text-muted-foreground sm:hidden">{t("updated")}</p>
          <p className="text-sm text-muted-foreground">{formatDate(application.updated_at, language)}</p>
        </div>
      ) : null}
      <div className="flex items-center gap-2">{badge}</div>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Button
          type="button"
          variant={draft ? "link" : "ghost"}
          size="sm"
          className={draft ? "text-primary" : "text-muted-foreground"}
          onPress={() => onOpen(application)}
        >
          {viewLabel}
          {draft ? <ArrowRight aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
        </Button>
        {canDelete ? (
          <DropdownMenuTrigger>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("moreActions", { name: application.service_name })}
            >
              <Ellipsis aria-hidden="true" />
            </Button>
            <DropdownMenu placement="bottom end">
              <DropdownMenuItem onAction={() => onViewDetails(application)}>
                <Eye aria-hidden="true" />
                {t("viewDetails")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onAction={() => onDelete(application)}>
                <Trash2 aria-hidden="true" />
                {t("deleteDraft")}
              </DropdownMenuItem>
            </DropdownMenu>
          </DropdownMenuTrigger>
        ) : null}
      </div>
    </article>
  );
}

function ApplicationList({
  applications,
  showUpdated = true,
  onOpen,
  onViewDetails,
  onDelete,
}: {
  applications: ApplicationListItem[];
  showUpdated?: boolean;
  onOpen: (application: ApplicationListItem) => void;
  onViewDetails: (application: ApplicationListItem) => void;
  onDelete: (application: ApplicationListItem) => void;
}) {
  const { t } = useCitizenPreferences();
  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm" aria-label={t("applications")}>
      <div
        className={`hidden ${
          showUpdated ? "grid-cols-[minmax(0,1fr)_130px_110px_140px]" : "grid-cols-[minmax(0,1fr)_110px_140px]"
        } gap-6 border-b px-5 py-3 text-xs font-medium text-muted-foreground sm:grid`}
      >
        <span>{t("applicationColumn")}</span>
        {showUpdated ? <span>{t("updated")}</span> : null}
        <span>{t("status")}</span>
        <span className="sr-only">{t("action")}</span>
      </div>
      {applications.map((application, index) => (
        <div key={application.id} className={index > 0 ? "border-t" : undefined}>
          <ApplicationRow
            application={application}
            showUpdated={showUpdated}
            onOpen={onOpen}
            onViewDetails={onViewDetails}
            onDelete={onDelete}
          />
        </div>
      ))}
    </section>
  );
}

export function ApplicationsPage() {
  const router = useRouter();
  const { t } = useCitizenPreferences();
  const [applications, setApplications] = useState<ApplicationListItem[]>();
  const [filter, setFilter] = useState<Filter>("Draft");
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string>();
  const [deleteError, setDeleteError] = useState<string>();
  const [pendingDelete, setPendingDelete] = useState<ApplicationListItem>();
  const [selectedSubmittedApplication, setSelectedSubmittedApplication] = useState<ApplicationDetail | null>(null);

  useEffect(() => {
    api.getApplications().then(setApplications).catch(() => setApplications([]));
  }, []);

  const sortedApplications = useMemo(
    () =>
      applications
        ?.filter((application) => {
          const matchesFilter =
            filter === "All"
              ? true
              : filter === "Draft"
              ? isDraft(application.status)
              : !isDraft(application.status);
          const searchText = `${application.service_name} ${application.department} ${
            application.reference_number ?? ""
          }`.toLowerCase();
          return matchesFilter && searchText.includes(query.trim().toLowerCase());
        })
        .sort((first, second) => new Date(second.updated_at).getTime() - new Date(first.updated_at).getTime()) ?? [],
    [applications, filter, query]
  );
  const draftApplications = sortedApplications.filter((application) => isDraft(application.status));
  const historyApplications = sortedApplications.filter((application) => !isDraft(application.status));
  const counts = useMemo(
    () => ({
      all: applications?.length ?? 0,
      draft: applications?.filter((application) => isDraft(application.status)).length ?? 0,
      submitted: applications?.filter((application) => !isDraft(application.status)).length ?? 0,
    }),
    [applications]
  );

  async function deleteDraft(application: ApplicationListItem) {
    setDeletingId(application.id);
    setDeleteError(undefined);
    try {
      await api.deleteApplication(application.id);
      setApplications((current) => current?.filter((item) => item.id !== application.id));
      setPendingDelete(undefined);
    } catch {
      setDeleteError(t("deleteDraftError"));
    } finally {
      setDeletingId(undefined);
    }
  }

  async function openApplication(application: ApplicationListItem) {
    try {
      const detail = await api.getApplication(application.id);
      if (isDraft(detail.status)) {
        router.push(applicationFlowPath(application.id, resumeRoute(detail)));
        return;
      }
      setSelectedSubmittedApplication(detail);
    } catch {
      setDeleteError(t("applicationLoadError"));
    }
  }

  async function viewDetails(application: ApplicationListItem) {
    if (isDraft(application.status)) {
      router.push(`/applications/${application.id}`);
      return;
    }
    try {
      setSelectedSubmittedApplication(await api.getApplication(application.id));
    } catch {
      setDeleteError(t("applicationLoadError"));
    }
  }

  function emptyState() {
    if (query.trim()) {
      return (
        <EmptyState>
          <p className="font-medium text-foreground">{t("noApplications")}</p>
          <p className="mt-1">{t("changeApplicationSearch")}</p>
        </EmptyState>
      );
    }
    if (filter === "Draft") {
      return (
        <EmptyState>
          <p className="font-medium text-foreground">{t("noDraftApplications")}</p>
          <p className="mt-1">{t("noDraftApplicationsDescription")}</p>
          <LinkButton href="/services" className="mt-4">
            {t("browseServices")}
          </LinkButton>
        </EmptyState>
      );
    }
    if (filter === "Submitted") {
      return (
        <EmptyState>
          <p className="font-medium text-foreground">{t("noSubmittedApplications")}</p>
          <p className="mt-1">{t("noSubmittedApplicationsDescription")}</p>
        </EmptyState>
      );
    }
    return (
      <EmptyState>
        <p className="font-medium text-foreground">{t("noApplicationsYet")}</p>
        <p className="mt-1">{t("noApplicationsYetDescription")}</p>
        <LinkButton href="/services" className="mt-4">
          {t("browseServices")}
        </LinkButton>
      </EmptyState>
    );
  }

  const filterButton = (value: Filter, label: string, count: number) => (
    <button
      type="button"
      onClick={() => setFilter(value)}
      aria-pressed={filter === value}
      className={`min-h-10 rounded-full border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        filter === value
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:bg-muted"
      }`}
    >
      {label} <span className="tabular-nums">{count}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block sm:max-w-sm sm:flex-1">
          <span className="sr-only">{t("searchApplications")}</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchApplications")}
            className="min-h-11 pl-9"
          />
        </label>
        <div className="flex flex-wrap gap-2" aria-label={t("filterApplications")}>
          {filterButton("All", t("all"), counts.all)}
          {filterButton("Draft", t("draft"), counts.draft)}
          {filterButton("Submitted", t("submitted"), counts.submitted)}
        </div>
      </div>
      {deleteError ? (
        <p role="alert" className="text-sm text-destructive">
          {deleteError}
        </p>
      ) : null}
      {!applications ? (
        <LoadingState label={t("loadingApplications")} />
      ) : sortedApplications.length === 0 ? (
        emptyState()
      ) : filter === "All" && draftApplications.length > 0 ? (
        <div className="space-y-7">
          <section className="space-y-3">
            <h2 className="text-base font-semibold">{t("needsAttention")}</h2>
            <ApplicationList
              applications={draftApplications}
              showUpdated={true}
              onOpen={openApplication}
              onViewDetails={viewDetails}
              onDelete={setPendingDelete}
            />
          </section>
          {historyApplications.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-base font-semibold">{t("applicationHistory")}</h2>
              <ApplicationList
                applications={historyApplications}
                showUpdated={false}
                onOpen={openApplication}
                onViewDetails={viewDetails}
                onDelete={setPendingDelete}
              />
            </section>
          ) : null}
        </div>
      ) : (
        <ApplicationList
          applications={sortedApplications}
          showUpdated={filter === "Draft"}
          onOpen={openApplication}
          onViewDetails={viewDetails}
          onDelete={setPendingDelete}
        />
      )}
      <Dialog
        isOpen={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(undefined);
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("deleteDraftTitle")}</DialogTitle>
          <DialogDescription>
            {t("deleteDraftDescription")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose type="button">{t("cancel")}</DialogClose>
          <Button
            type="button"
            variant="destructive"
            onPress={() => {
              if (pendingDelete) void deleteDraft(pendingDelete);
            }}
            isDisabled={!pendingDelete || deletingId === pendingDelete.id}
          >
            {deletingId ? t("deleting") : t("delete")}
          </Button>
        </DialogFooter>
      </Dialog>
      <SubmittedApplicationDialog
        application={selectedSubmittedApplication}
        isOpen={Boolean(selectedSubmittedApplication)}
        onOpenChange={(open) => {
          if (!open) setSelectedSubmittedApplication(null);
        }}
      />
    </div>
  );
}
