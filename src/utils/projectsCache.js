let projectsCache = null
let projectsCacheTimestamp = null
const CACHE_DURATION = 5 * 60 * 1000

export const getProjectsCache = () => {
  const now = Date.now()
  if (
    projectsCache &&
    projectsCacheTimestamp &&
    now - projectsCacheTimestamp < CACHE_DURATION
  ) {
    return projectsCache
  }
  return null
}

export const setProjectsCache = (projects) => {
  // Never cache an empty list — that freezes a failed/empty fetch for 5 minutes
  // and hides newly created projects (and recovers slowly from auth issues).
  if (!Array.isArray(projects) || projects.length === 0) {
    projectsCache = null
    projectsCacheTimestamp = null
    return
  }

  projectsCache = projects
  projectsCacheTimestamp = Date.now()
}

export const invalidateProjectsCache = () => {
  projectsCache = null
  projectsCacheTimestamp = null
}
