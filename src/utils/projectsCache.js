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
  projectsCache = projects
  projectsCacheTimestamp = Date.now()
}

export const invalidateProjectsCache = () => {
  projectsCache = null
  projectsCacheTimestamp = null
}
