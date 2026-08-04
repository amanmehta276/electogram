import { useCallback, useEffect, useState } from "react"

export interface Project {
  id: string
  name: string
  code: string
  updatedAt: number
}

const STORAGE_KEY = "vyomstech-pcb-projects"

function loadAll(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Project[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistAll(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}

function makeId() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Manages a list of saved PCB projects in the browser's localStorage.
 * Each project is { id, name, code, updatedAt }. Nothing leaves the browser —
 * there is no backend, so projects only exist on this device/browser.
 */
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    setProjects(loadAll())
  }, [])

  const saveProject = useCallback(
    (id: string | null, name: string, code: string): Project => {
      const now = Date.now()
      const saved: Project = id
        ? { id, name, code, updatedAt: now }
        : { id: makeId(), name, code, updatedAt: now }

      setProjects((prev) => {
        const exists = prev.some((p) => p.id === saved.id)
        const next = exists
          ? prev.map((p) => (p.id === saved.id ? saved : p))
          : [...prev, saved]
        persistAll(next)
        return next
      })

      return saved
    },
    [],
  )

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== id)
      persistAll(next)
      return next
    })
  }, [])

  return { projects, saveProject, deleteProject }
}
