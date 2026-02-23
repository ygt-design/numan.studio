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

/* Column 1 left empty so fixed tags menu stays visible while scrolling */
const ResponsiveProjectColumn = styled(GridColumn)`
  @media (min-width: 768px) {
    grid-column: ${(props) => {
      if (props.$layoutType === 'double-left') {
        return '2 / 8';
      } else if (props.$layoutType === 'double-right') {
        return '8 / 13';
      } else if (props.$layoutType === 'double-right-first') {
        return '8 / 11';
      } else if (props.$layoutType === 'double-right-second') {
        return '11 / 13';
      } else if (props.$layoutType === 'double-left-first') {
        return '2 / 5';
      } else if (props.$layoutType === 'double-left-second') {
        return '5 / 8';
      } else if (props.$layoutType === 'single-left') {
        return '2 / 8';
      } else if (props.$layoutType === 'single-right') {
        return '8 / 13';
      }
      return 'span 12';
    }};
  }
`

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

// Curated layout configuration
// Each entry defines the layout for a row:
// - 'double-left-right': 2 items (left: 1-8, right: 5-12)
// - 'double-right-both': 2 items (both in 5-12, split as 5-9 and 9-13)
// - 'double-left-both': 2 items (both in 1-9, split as 1-5 and 5-9)
// - 'single-left': 1 item (columns 1-8)
// - 'single-right': 1 item (columns 5-12)
const curatedLayout = [
  'single-left',        // 1st: 1 big on left
  'single-right',       // 2nd: 1 big on right
  'double-right-both',  // 3rd: 2 small on right
  'single-left',        // 4th: 1 big on left
  'single-right',       // 5th: 1 big on right
  'single-right',       // 6th: 1 big on right
  'double-left-both',   // 7th: 2 small on left
]

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

  // Create layout configuration once when filtered projects change
  const layoutConfig = useMemo(() => {
    if (filteredProjects.length === 0) return []

    const layout = []
    let projectIndex = 0
    let rowIndex = 0

    while (projectIndex < filteredProjects.length) {
      // Cycle through the curated layout pattern
      const rowType = curatedLayout[rowIndex % curatedLayout.length]

      if (rowType === 'double-left-right' && projectIndex + 1 < filteredProjects.length) {
        // Two items: left (1-8) and right (5-12)
        layout.push({
          type: 'double',
          items: [
            { project: filteredProjects[projectIndex], layoutType: 'double-left' },
            { project: filteredProjects[projectIndex + 1], layoutType: 'double-right' },
          ],
        })
        projectIndex += 2
      } else if (rowType === 'double-right-both' && projectIndex + 1 < filteredProjects.length) {
        // Two items: both in columns 5-12
        layout.push({
          type: 'double',
          items: [
            { project: filteredProjects[projectIndex], layoutType: 'double-right-first' },
            { project: filteredProjects[projectIndex + 1], layoutType: 'double-right-second' },
          ],
        })
        projectIndex += 2
      } else if (rowType === 'double-left-both' && projectIndex + 1 < filteredProjects.length) {
        // Two items: both in columns 1-9
        layout.push({
          type: 'double',
          items: [
            { project: filteredProjects[projectIndex], layoutType: 'double-left-first' },
            { project: filteredProjects[projectIndex + 1], layoutType: 'double-left-second' },
          ],
        })
        projectIndex += 2
      } else if (rowType === 'single-left') {
        // Single item: left (1-8)
        layout.push({
          type: 'single',
          items: [
            { project: filteredProjects[projectIndex], layoutType: 'single-left' },
          ],
        })
        projectIndex += 1
      } else if (rowType === 'single-right') {
        // Single item: right (5-12)
        layout.push({
          type: 'single',
          items: [
            { project: filteredProjects[projectIndex], layoutType: 'single-right' },
          ],
        })
        projectIndex += 1
      } else {
        // Fallback: single item on left if layout type is unknown
        layout.push({
          type: 'single',
          items: [
            { project: filteredProjects[projectIndex], layoutType: 'single-left' },
          ],
        })
        projectIndex += 1
      }
      rowIndex += 1
    }

    return layout
  }, [filteredProjects])

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
        {layoutConfig.map((row) =>
          row.items.map((item) => (
            <ResponsiveProjectColumn
              key={item.project.id || item.project.slug}
              span={12}
              $layoutType={item.layoutType}
            >
              <ProjectCard onClick={() => handleProjectClick(item.project.slug)}>
                <ProjectImage
                  src={item.project.coverImage}
                  alt={item.project.projectName}
                  loading="lazy"
                />
              </ProjectCard>
            </ResponsiveProjectColumn>
          ))
        )}
      </ProjectsGridContainer>
    </ProjectsSection>
  )
}

export default ProjectsGrid
