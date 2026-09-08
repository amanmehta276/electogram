import type { Project } from "./useProjects"
import { X } from "lucide-react"
import "./ProjectsPanel.css"

interface ProjectsPanelProps {
  projects: Project[]
  activeId: string | null
  onClose: () => void
  onLoad: (project: Project) => void
  onDelete: (id: string) => void
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ProjectsPanel({
  projects,
  activeId,
  onClose,
  onLoad,
  onDelete,
}: ProjectsPanelProps) {
  const sorted = [...projects].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <div className="projects-overlay" onClick={onClose}>
      <aside
        className="projects-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Saved boards"
      >
        <div className="projects-header">
          <div>
            <div className="projects-eyebrow">Boards</div>
            <h2>Saved projects</h2>
          </div>
          <button className="projects-close" onClick={onClose} aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {sorted.length === 0 && (
          <p className="projects-empty">
            No boards saved yet. Give it a name up top and hit "Save" — it
            will show up here.
          </p>
        )}

        <div className="projects-list">
          {sorted.map((project) => (
            <div
              key={project.id}
              className={`projects-item ${project.id === activeId ? "projects-item-active" : ""}`}
            >
              <button
                className="projects-item-main"
                onClick={() => onLoad(project)}
              >
                <span className="projects-item-name">{project.name}</span>
                <span className="projects-item-time">
                  {formatTime(project.updatedAt)}
                </span>
              </button>
              <button
                className="projects-item-delete"
                onClick={() => onDelete(project.id)}
                aria-label={`Delete ${project.name}`}
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        <p className="projects-note">
          This only saves in this browser (localStorage) — nothing goes to a
          server.
        </p>
      </aside>
    </div>
  )
}
