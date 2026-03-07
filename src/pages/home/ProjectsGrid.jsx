import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { getChannelContents, getGroupChannels } from '../../api/arenaClient.js'
import { GridContainer, GridColumn } from '../../styles'
import { useLoading } from '../../contexts/LoadingContext'
import { getProjectsCache, setProjectsCache } from '../../utils/projectsCache'

const DEFAULT_GROUP_SLUG =
  import.meta.env.VITE_ARENA_GROUP_SLUG?.trim() ||
  import.meta.env.VITE_ARENA_CHANNEL_SLUG?.trim() ||
  'numan-studio'

const ProjectsSection = styled.section`
  width: 100%;
  padding: 20px;
`

const ProjectsGridContainer = styled(GridContainer)`
  row-gap: 20px;
`

const ProjectColumn = styled(GridColumn)`
  @media (max-width: 767px) {
    grid-column: 1 / -1;
  }
`

const getGridPosition = (index) => {
  let remaining = index
  let row = 0
  while (true) {
    const rowSize = row % 2 === 0 ? 2 : 3
    if (remaining < rowSize) {
      if (rowSize === 2) {
        return remaining === 0
          ? { start: 2, end: 7 }
          : { start: 7, end: 13 }
      }
      if (remaining === 0) return { start: 2, end: 6 }
      if (remaining === 1) return { start: 6, end: 10 }
      return { start: 10, end: 13 }
    }
    remaining -= rowSize
    row++
  }
}

const ProjectCard = styled.div`
  position: relative;
  width: 100%;
  cursor: pointer;
  overflow: hidden;
`

const ProjectImage = styled.img`
  width: 100%;
  height: auto;
  display: block;
`

const parseBlockTextContent = (block) => {
  const content = block.content
  if (content && typeof content === 'object' && !Array.isArray(content)) {
    return (content.plain || content.markdown || '').trim()
  }
  if (typeof content === 'string') return content.trim()
  if (block.content_html) return block.content_html.replace(/<[^>]*>/g, '').trim()
  return ''
}

const ProjectsGrid = ({ selectedTags = [] }) => {
  const [projects, setProjects] = useState(() => getProjectsCache() || [])
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { setIsLoading } = useLoading()
  const loadingSource = 'projects'

  const filteredProjects = useMemo(() => {
    if (!selectedTags || selectedTags.length === 0) return projects
    const set = new Set(selectedTags)
    return projects.filter((p) => p.tags?.some((t) => set.has(t)))
  }, [projects, selectedTags])

  useEffect(() => {
    const cached = getProjectsCache()
    if (cached) {
      setProjects(cached)
      setIsLoading(false, loadingSource)
      return
    }

    let shouldIgnore = false

    const fetchProjects = async () => {
      setIsLoading(true, loadingSource)

      try {
        const channels = await getGroupChannels(DEFAULT_GROUP_SLUG, {
          per: 100,
          maxPages: 5,
        })

        const projectChannels = channels.filter((channel) => {
          const title = (channel.title || channel.slug || '').trim()
          return title.startsWith('Project')
        })

        const projectsWithCovers = await Promise.all(
          projectChannels.map(async (channel) => {
            const blocks = await getChannelContents(channel.slug, {
              per: 100,
            })

            const coverBlock = blocks.find(
              (block) =>
                (block.title || block.generated_title || '')
                  .toLowerCase()
                  .trim() === 'cover'
            )

            const orderBlock = blocks.find(
              (block) =>
                (block.title || block.generated_title || '')
                  .toLowerCase()
                  .trim() === 'order'
            )

            const tagsBlock = blocks.find(
              (block) =>
                (block.title || block.generated_title || '')
                  .toLowerCase()
                  .trim() === 'tags'
            )

            const imageUrl =
              coverBlock?.image?.large?.src ||
              coverBlock?.image?.medium?.src ||
              coverBlock?.image?.src ||
              coverBlock?.image?.small?.src ||
              null

            const orderText = orderBlock ? parseBlockTextContent(orderBlock) : ''
            const orderNum = orderText ? parseInt(orderText, 10) : NaN

            const tagsText = tagsBlock ? parseBlockTextContent(tagsBlock) : ''
            const projectTags = tagsText
              ? tagsText.split(',').map((t) => t.trim()).filter(Boolean)
              : []

            const channelTitle = channel.title || channel.slug || ''
            const projectName = channelTitle.replace(/^Project\s*\/\s*/i, '').trim()

            return {
              ...channel,
              coverImage: imageUrl,
              projectName: projectName || channelTitle,
              order: isNaN(orderNum) ? Infinity : orderNum,
              tags: projectTags,
            }
          })
        )

        const filteredProjects = projectsWithCovers.filter((p) => p.coverImage)

        filteredProjects.sort((a, b) => {
          if (a.order !== b.order) return a.order - b.order
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
          return aTime - bTime
        })

        if (!shouldIgnore) {
          setProjectsCache(filteredProjects)
          setProjects(filteredProjects)
          setError(null)
        }
      } catch (err) {
        if (!shouldIgnore) {
          setProjects([])
          setError(err)
        }
      } finally {
        if (!shouldIgnore) {
          setIsLoading(false, loadingSource)
        }
      }
    }

    fetchProjects()

    return () => {
      shouldIgnore = true
    }
  }, [setIsLoading, loadingSource])

  const handleProjectClick = (slug) => {
    // Save scroll position before navigating
    sessionStorage.setItem('scrollPosition', window.scrollY.toString())
    navigate(`/project/${slug}`)
  }

  if (error) {
    return (
      <ProjectsSection id="projects-grid">
        <p>Error loading projects: {error.message}</p>
      </ProjectsSection>
    )
  }

  if (projects.length === 0) {
    return (
      <ProjectsSection id="projects-grid">
        <p>No projects found.</p>
      </ProjectsSection>
    )
  }

  return (
    <ProjectsSection id="projects-grid">
      {selectedTags.length > 0 && filteredProjects.length === 0 ? (
        <p>No projects match the selected tags.</p>
      ) : null}
      <ProjectsGridContainer>
        {filteredProjects.map((project, index) => {
          const { start, end } = getGridPosition(index)
          return (
            <ProjectColumn key={project.id || project.slug} start={start} end={end}>
              <ProjectCard onClick={() => handleProjectClick(project.slug)}>
                <ProjectImage
                  src={project.coverImage}
                  alt={project.projectName}
                  loading="lazy"
                />
              </ProjectCard>
            </ProjectColumn>
          )
        })}
      </ProjectsGridContainer>
    </ProjectsSection>
  )
}

export default ProjectsGrid
