"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import {
  MOCK_PROJECTS,
  MOCK_PROJECT_ACTIVITY,
  type Project,
} from "@/app/lib/mock/mock-projects";
import type { CreateProjectFormData } from "@/app/components/projects/CreateProjectDialog";
import { ProjectCard } from "@/app/components/projects/ProjectCard";
import { CreateProjectDialog } from "@/app/components/projects/CreateProjectDialog";
import { ProjectDocumentList } from "@/app/components/projects/ProjectDocumentList";
import { ProjectActivityLog } from "@/app/components/projects/ProjectActivityLog";

function makeProjectFromForm(data: CreateProjectFormData): Project {
  const id = `p-new-${Date.now()}`;
  return {
    id,
    name: data.name,
    description: data.description || undefined,
    documentCount: 0,
    aggregateScore: 0,
    lastUpdated: new Date().toISOString().slice(0, 10),
    documents: [],
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [selectedProject, setSelectedProject] = useState<Project | null>(MOCK_PROJECTS[0] ?? null);
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreateProject = useCallback((data: CreateProjectFormData) => {
    setProjects((prev) => [makeProjectFromForm(data), ...prev]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Projects
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Manage documentation projects and track compliance across documents.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]"
            title="Demo mode. New projects are stored in memory only."
          >
            Demo mode
          </span>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          >
            <Plus className="size-4" aria-hidden />
            Create project
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Your projects
          </h2>
          <div className="space-y-2">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                selected={selectedProject?.id === project.id}
                onSelect={() => setSelectedProject(project)}
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedProject ? (
            <>
              <section aria-labelledby="documents-heading">
                <h2 id="documents-heading" className="mb-3 text-sm font-semibold text-[var(--foreground)]">
                  Documents
                </h2>
                <ProjectDocumentList documents={selectedProject.documents} />
              </section>
              <ProjectActivityLog entries={MOCK_PROJECT_ACTIVITY} />
            </>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              Select a project to view its documents and activity.
            </p>
          )}
        </div>
      </div>

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
