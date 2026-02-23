import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { getChannel, getChannelContents } from '../../api/arenaClient.js'
import { GridContainer, GridColumn } from '../../styles'
import { useLoading } from '../../contexts/LoadingContext'

const PageWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  padding: 20px;

  @media (min-width: 768px) {
    height: 100vh;
    overflow: hidden;
  }
`

const DesktopGrid = styled(GridContainer)`
  height: 100%;
`

const LeftColumn = styled(GridColumn)`
  @media (min-width: 768px) {
    grid-column: 1 / 7;
    height: calc(100vh - 40px);
    overflow-y: auto;
    padding-right: 10px;

    &::-webkit-scrollbar {
      width: 0;
    }
    scrollbar-width: none;
  }

  @media (max-width: 767px) {
    grid-column: 1 / 13;
    order: 2;
  }
`

const RightColumn = styled(GridColumn)`
  @media (min-width: 768px) {
    grid-column: 7 / 13;
    height: calc(100vh - 40px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  @media (max-width: 767px) {
    grid-column: 1 / 13;
    order: 1;
    margin-bottom: 2rem;
  }
`

const ImageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const ProjectImage = styled.img`
  width: 100%;
  height: auto;
  display: block;
`

const ProjectName = styled.h1`
  font-family: 'ABCGravity', sans-serif;
  font-size: 2.5rem;
  line-height: 0.95;
  margin: 0 0 1rem 0;
  text-transform: uppercase;

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

const Description = styled.div`
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 1rem;
  line-height: 1.45;
  color: black;

  p {
    margin: 0 0 1.5rem 0;

    &:last-child {
      margin-bottom: 0;
    }
  }

  @media (min-width: 768px) {
    font-size: 1.15rem;
    margin-top: auto;
  }
`

const StatusMessage = styled.p`
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 1rem;
  line-height: 1.45;
  padding: 20px;
`

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

const ProjectDetail = () => {
  const { slug } = useParams()
  const [channel, setChannel] = useState(null)
  const [imageBlocks, setImageBlocks] = useState([])
  const [descriptionHtml, setDescriptionHtml] = useState('')
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

  if (error) {
    return <StatusMessage>Error loading project: {error.message}</StatusMessage>
  }

  return (
    <PageWrapper>
      <DesktopGrid>
        <LeftColumn>
          <ImageList>
            {imageBlocks.map((block) => (
              <ProjectImage
                key={block.id}
                src={extractImageUrl(block)}
                alt={block.title || block.generated_title || projectName}
                loading="lazy"
              />
            ))}
          </ImageList>
        </LeftColumn>

        <RightColumn>
          {projectName && <ProjectName>{projectName}</ProjectName>}
          {descriptionHtml && (
            <Description
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          )}
        </RightColumn>
      </DesktopGrid>
    </PageWrapper>
  )
}

export default ProjectDetail
