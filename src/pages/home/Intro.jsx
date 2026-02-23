import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { getChannelContents, getGroupChannels } from '../../api/arenaClient.js'
import { GridContainer, GridColumn } from '../../styles'
import { useLoading } from '../../contexts/LoadingContext'

const DEFAULT_GROUP_SLUG =
  import.meta.env.VITE_ARENA_GROUP_SLUG?.trim() ||
  import.meta.env.VITE_ARENA_CHANNEL_SLUG?.trim() ||
  'numan-studio'

const IntroWrapper = styled.div`
  width: 100%;
  height: 100svh;
  z-index: 10;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;

  @media (min-width: 768px) {
    height: 100vh;
  }
`

const IntroContent = styled.div`
  width: 100%;
  max-width: 100%;
`

const TitleContainer = styled.div`
  width: 100%;
  overflow: hidden;
`

const Logo = styled.svg`
  width: 100%;
  height: auto;
  display: block;
  path {
    fill: ${(props) => props.$fill || 'red'};
  }
`

const BodyCopy = styled.div`
  margin: 0;
  color: black;
  font-size: 1rem;
  line-height: 1.45;
  font-family: 'PPNeueMontreal', sans-serif;

  p {
    margin: 0 0 1.5rem 0;

    &:last-child {
      margin-bottom: 0;
    }
  }

  @media (min-width: 768px) {
    font-size: 1.15rem;
  }
`

const BodyCopyContainer = styled.div`
  width: 100%;
`

const ResponsiveBodyColumn = styled(GridColumn)`
  @media (max-width: 767px) {
    grid-column: 1 / 13;
  }
`

const Intro = () => {
  const [aboutText, setAboutText] = useState('')
  const { setIsLoading } = useLoading()
  const loadingSource = 'intro'

  useEffect(() => {
    let shouldIgnore = false

    const fetchAboutText = async () => {
      setIsLoading(true, loadingSource)
      try {
        const channels = await getGroupChannels(DEFAULT_GROUP_SLUG, {
          per: 100,
          maxPages: 5,
        })

        const aboutChannel = channels.find(
          (channel) =>
            (channel.title || channel.slug || '').toLowerCase() === 'about'
        )

        if (!aboutChannel) {
          return
        }

        const blocks = await getChannelContents(aboutChannel.slug, {
          per: 100,
        })

        const aboutTextBlock = blocks.find(
          (block) =>
            (block.title || block.generated_title || '').trim() === 'About Text'
        )

        if (aboutTextBlock && !shouldIgnore) {
          const content = aboutTextBlock.content
          const isMarkdownContent =
            content && typeof content === 'object' && !Array.isArray(content)

          let text = ''

          if (isMarkdownContent) {
            text = content.html || content.plain || content.markdown || ''
          } else {
            text =
              aboutTextBlock.content_html ||
              (typeof content === 'string' ? content : '') ||
              aboutTextBlock.description ||
              ''
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

          setAboutText(text)
        }
      } catch (err) {
        console.error('Error fetching about text:', err)
      } finally {
        setIsLoading(false, loadingSource)
      }
    }

    fetchAboutText()

    return () => {
      shouldIgnore = true
    }
  }, [setIsLoading, loadingSource])

  return (
    <IntroWrapper>
      <BodyCopyContainer>
        <GridContainer>
          <ResponsiveBodyColumn start={7} end={13}>
            {aboutText && (
              <BodyCopy
                dangerouslySetInnerHTML={{ __html: aboutText }}
              />
            )}
          </ResponsiveBodyColumn>
        </GridContainer>
      </BodyCopyContainer>
      <IntroContent>
        <GridContainer>
          <GridColumn span={12}>
            <TitleContainer>
              <Logo
                viewBox="0 0 360 64"
                role="img"
                aria-label="NUMAN"
                $fill="black"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M0,0h28.57l15.3,33.29V0h21.5v62.17h-27.01L21.5,25.71v36.46H0V0Z"/>
                <path d="M72.23,42.53V0h22.98v41.01c0,4.42,2.43,6.72,6.76,6.72s6.76-2.3,6.76-6.72V0h22.98v42.53c0,13.57-9.71,21.24-29.74,21.24s-29.74-7.67-29.74-21.24Z"/>
                <path d="M138.55,0h30.82l9.32,36.55L188.11,0h29.91v62.17h-21.16V24.49l-9.62,37.67h-17.77l-9.75-37.07v37.07h-21.16V0Z"/>
                <path d="M240.17,0h32.38l18.68,62.17h-24.02l-2.6-10.49h-16.91l-2.64,10.49h-23.76L240.17,0ZM261.29,36.07l-4.99-21.16-5.12,21.16h10.1Z"/>
                <path d="M294.62,0h28.57l15.3,33.29V0h21.5v62.17h-27.01l-16.86-36.46v36.46h-21.5V0Z"/>
              </Logo>
            </TitleContainer>
          </GridColumn>
        </GridContainer>
      </IntroContent>
    </IntroWrapper>
  )
}

export default Intro
