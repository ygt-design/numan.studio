import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { getChannel, getChannelContents } from '../../api/arenaClient.js'
import { GridContainer } from '../../styles'
import { useLoading } from '../../contexts/LoadingContext'

const PageWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  padding: 20px;
`

/* Header: title, meta, description centered */
const HeaderSection = styled.section`
  padding-top: 3rem;
  padding-bottom: 2rem;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  @media (min-width: 768px) {
    padding-top: 5rem;
    padding-bottom: 3rem;
    margin-bottom: 3rem;
  }

  @media (min-width: 1024px) {
    padding-top: 6rem;
    padding-bottom: 4rem;
  }
`

const HeaderInner = styled.div`
  width: 100%;
  max-width: 720px;
`

const ProjectName = styled.h1`
  font-family: 'ABCGravity', sans-serif;
  font-size: 2.5rem;
  line-height: 0.95;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  text-align: center;

  @media (min-width: 768px) {
    font-size: 4.5rem;
    margin-bottom: 1.25rem;
  }

  @media (min-width: 1024px) {
    font-size: 6rem;
    margin-bottom: 1.5rem;
  }

  @media (min-width: 1440px) {
    font-size: 7rem;
  }
`

const ProjectMeta = styled.div`
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #333;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem 1rem;
  margin-bottom: 1.5rem;
`

const MetaItem = styled.span`
  text-transform: capitalize;
`

const Description = styled.div`
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 1rem;
  line-height: 1.45;
  color: black;
  text-align: center;

  p {
    margin: 0 0 1rem 0;

    &:last-child {
      margin-bottom: 0;
    }
  }

  @media (min-width: 768px) {
    font-size: 1.15rem;
  }
`

/* Images grid – same curated layout as homepage */
const ImagesGridContainer = styled(GridContainer)`
  row-gap: 20px;
`

const ImageColumn = styled.div`
  grid-column: 1 / -1;

  @media (min-width: 768px) {
    grid-column: ${(props) => {
      if (props.$layoutType === 'double-left') return '1 / 7'
      if (props.$layoutType === 'double-right') return '7 / 13'
      if (props.$layoutType === 'double-right-first') return '7 / 10'
      if (props.$layoutType === 'double-right-second') return '10 / 13'
      if (props.$layoutType === 'double-left-first') return '1 / 4'
      if (props.$layoutType === 'double-left-second') return '4 / 7'
      if (props.$layoutType === 'single-left') return '1 / 7'
      if (props.$layoutType === 'single-right') return '7 / 13'
      return 'span 12'
    }};
  }
`

const ProjectImage = styled.img`
  width: 100%;
  height: auto;
  display: block;
`

const StatusMessage = styled.p`
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 1rem;
  line-height: 1.45;
  padding: 20px;
`

/* Same row pattern as ProjectsGrid */
const curatedLayout = [
  'single-left',
  'single-right',
  'double-right-both',
  'single-left',
  'single-right',
  'single-right',
  'double-left-both',
]

const extractImageUrl = (block) =>
  block?.image?.large?.src ||
  block?.image?.medium?.src ||
  block?.image?.src ||
  block?.image?.small?.src ||
  null

const extractTextContent = (block) => {
  if (!block) return ''

  const content = block.content
  const isMarkdownContent =
    content && typeof content === 'object' && !Array.isArray(content)

  let text = ''

  if (isMarkdownContent) {
    text = content.html || content.plain || content.markdown || ''
  } else {
    text =
      block.content_html ||
      (typeof content === 'string' ? content : '') ||
      block.description ||
      ''
  }

  const desc = block.description
  if (
    !text &&
    desc &&
    typeof desc === 'object' &&
    !Array.isArray(desc)
  ) {
    text = desc.html || desc.plain || desc.markdown || ''
  }

  if (
    text &&
    typeof text === 'string' &&
    !text.startsWith('<') &&
    !(isMarkdownContent && content.html)
  ) {
    const paragraphs = text
      .split(/\n\s*\n/)
      .filter((p) => p.trim())
      .map((p) => `<p>${p.trim()}</p>`)
      .join('')
    text = paragraphs || text.replace(/\n/g, '<br>')
  }

  return text
}

const blockTitle = (block) =>
  (block.title || block.generated_title || '').toLowerCase().trim()

const parseBlockTextContent = (block) => {
  if (!block) return ''
  const content = block.content
  if (content && typeof content === 'object' && !Array.isArray(content)) {
    return (content.plain || content.markdown || '').trim()
  }
  if (typeof content === 'string') return content.trim()
  if (block.content_html) return block.content_html.replace(/<[^>]*>/g, '').trim()
  return ''
}

const buildImageLayoutConfig = (imageBlocks) => {
  if (!imageBlocks.length) return []
  const layout = []
  let index = 0
  let rowIndex = 0
  while (index < imageBlocks.length) {
    const rowType = curatedLayout[rowIndex % curatedLayout.length]
    if (rowType === 'double-right-both' && index + 1 < imageBlocks.length) {
      layout.push({
        type: 'double',
        items: [
          { block: imageBlocks[index], layoutType: 'double-right-first' },
          { block: imageBlocks[index + 1], layoutType: 'double-right-second' },
        ],
      })
      index += 2
    } else if (rowType === 'double-left-both' && index + 1 < imageBlocks.length) {
      layout.push({
        type: 'double',
        items: [
          { block: imageBlocks[index], layoutType: 'double-left-first' },
          { block: imageBlocks[index + 1], layoutType: 'double-left-second' },
        ],
      })
      index += 2
    } else if (rowType === 'single-left') {
      layout.push({
        type: 'single',
        items: [{ block: imageBlocks[index], layoutType: 'single-left' }],
      })
      index += 1
    } else if (rowType === 'single-right') {
      layout.push({
        type: 'single',
        items: [{ block: imageBlocks[index], layoutType: 'single-right' }],
      })
      index += 1
    } else {
      layout.push({
        type: 'single',
        items: [{ block: imageBlocks[index], layoutType: 'single-left' }],
      })
      index += 1
    }
    rowIndex += 1
  }
  return layout
}

const ProjectDetail = () => {
  const { slug } = useParams()
  const [channel, setChannel] = useState(null)
  const [imageBlocks, setImageBlocks] = useState([])
  const [descriptionHtml, setDescriptionHtml] = useState('')
  const [year, setYear] = useState('')
  const [medium, setMedium] = useState('')
  const [dimensions, setDimensions] = useState('')
  const [error, setError] = useState(null)
  const { setIsLoading } = useLoading()
  const loadingSource = 'project-detail'

  useEffect(() => {
    let shouldIgnore = false

    const fetchData = async () => {
      setIsLoading(true, loadingSource)

      try {
        const [channelData, blocks] = await Promise.all([
          getChannel(slug),
          getChannelContents(slug, { per: 100 }),
        ])

        if (shouldIgnore) return

        setChannel(channelData)

        const descBlock = blocks.find((b) => blockTitle(b) === 'description')
        setDescriptionHtml(extractTextContent(descBlock))

        const yearBlock = blocks.find((b) => blockTitle(b) === 'year')
        const mediumBlock = blocks.find((b) => blockTitle(b) === 'medium')
        const dimensionsBlock = blocks.find((b) => blockTitle(b) === 'dimensions')
        setYear(parseBlockTextContent(yearBlock))
        setMedium(parseBlockTextContent(mediumBlock))
        setDimensions(parseBlockTextContent(dimensionsBlock))

        const withImages = blocks.filter((b) => extractImageUrl(b))
        const coverIndex = withImages.findIndex((b) => blockTitle(b) === 'cover')

        if (coverIndex > 0) {
          const [cover] = withImages.splice(coverIndex, 1)
          withImages.unshift(cover)
        }

        setImageBlocks(withImages)
      } catch (err) {
        if (!shouldIgnore) {
          setError(err)
        }
      } finally {
        if (!shouldIgnore) {
          setIsLoading(false, loadingSource)
        }
      }
    }

    fetchData()

    return () => {
      shouldIgnore = true
    }
  }, [slug, setIsLoading, loadingSource])

  const projectName = channel
    ? (channel.title || '').replace(/^Project\s*\/\s*/i, '').trim() || slug
    : ''

  const imageLayoutConfig = useMemo(
    () => buildImageLayoutConfig(imageBlocks),
    [imageBlocks]
  )

  if (error) {
    return <StatusMessage>Error loading project: {error.message}</StatusMessage>
  }

  return (
    <PageWrapper>
      <HeaderSection>
        <HeaderInner>
          {projectName && <ProjectName>{projectName}</ProjectName>}
          {(year || medium || dimensions) && (
            <ProjectMeta>
              {year && <MetaItem>{year}</MetaItem>}
              {medium && <MetaItem>{medium}</MetaItem>}
              {dimensions && <MetaItem>{dimensions}</MetaItem>}
            </ProjectMeta>
          )}
          {descriptionHtml && (
            <Description
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          )}
        </HeaderInner>
      </HeaderSection>

      {imageLayoutConfig.length > 0 && (
        <ImagesGridContainer>
          {imageLayoutConfig.map((row) =>
            row.items.map((item) => (
              <ImageColumn
                key={item.block.id}
                $layoutType={item.layoutType}
              >
                <ProjectImage
                  src={extractImageUrl(item.block)}
                  alt={item.block.title || item.block.generated_title || projectName}
                  loading="lazy"
                />
              </ImageColumn>
            ))
          )}
        </ImagesGridContainer>
      )}
    </PageWrapper>
  )
}

export default ProjectDetail
