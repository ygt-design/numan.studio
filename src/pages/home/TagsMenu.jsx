import { useEffect, useState, useRef, useLayoutEffect } from 'react'
import styled from 'styled-components'
import { getChannelContents, getGroupChannels } from '../../api/arenaClient.js'

const DEFAULT_GROUP_SLUG =
  import.meta.env.VITE_ARENA_GROUP_SLUG?.trim() ||
  import.meta.env.VITE_ARENA_CHANNEL_SLUG?.trim() ||
  'numan-studio'

const MenuWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 50;
  padding: 20px 0 0 20px;
  max-height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;

  @media (min-width: 768px) {
    width: 120px;
    max-width: 120px;
    overflow-x: hidden;
    overflow-y: auto;
  }

  @media (max-width: 767px) {
    padding: 12px 20px;
    max-width: 100%;
    width: 100%;
    max-height: none;
    overflow: visible;
  }
`

const TagList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 0.9rem;
  line-height: 1.6;
  color: black;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  gap: 0.35rem;
  min-width: 0;

  @media (min-width: 768px) {
    width: 100%;
  }

  @media (max-width: 767px) {
    flex-direction: row;
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 0.25rem;
    font-size: 0.8rem;
    line-height: 1.4;
    padding-bottom: 4px;

    &::-webkit-scrollbar {
      height: 4px;
    }
    scrollbar-width: thin;
  }
`

const TagItem = styled.li`
  margin: 0;
  padding: 0;
  flex-shrink: 0;

  @media (min-width: 768px) {
    flex-shrink: unset;
  }
`

const TagButton = styled.button`
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 1rem;
  color: black;
  border: none;
  cursor: pointer;
  text-align: left;
  text-decoration: none;
  font-weight: ${(props) => (props.$selected ? '600' : 'inherit')};
  border: 0.5px solid #ccc;
  padding: 0.35rem;
  width: fit-content;
  max-width: 100%;
  margin-bottom: 0;
  background-color: ${(props) => (props.$selected ? '#ccc' : 'white')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background-color: #ccc;
    color: white;
  }

  @media (min-width: 768px) {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }

  @media (max-width: 767px) {
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
    flex-shrink: 0;
  }
`

const ClearButton = styled.button`
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 1rem;
  color: black;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  text-decoration: none;
  font-weight: 600;
  border: 0.5px solid #ccc;
  padding: 0.35rem;
  width: fit-content;
  margin-top: 0.5rem;
  margin-bottom: 0;
  background-color: white;
  flex-shrink: 0;

  @media (min-width: 768px) {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  @media (max-width: 767px) {
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
    margin-top: 0.35rem;
  }
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

const scrollToProjectsGrid = () => {
  const el = document.getElementById('projects-grid')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const TagsMenu = ({ selectedTags = [], onSelectTags, onHeightChange }) => {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const wrapperRef = useRef(null)

  useLayoutEffect(() => {
    if (!onHeightChange || !wrapperRef.current) return
    const el = wrapperRef.current
    const observer = new ResizeObserver(() => {
      if (window.innerWidth <= 767) {
        onHeightChange(el.offsetHeight)
      } else {
        onHeightChange(0)
      }
    })
    observer.observe(el)
    if (window.innerWidth <= 767) {
      onHeightChange(el.offsetHeight)
    }
    return () => observer.disconnect()
  }, [onHeightChange, tags.length, selectedTags.length])

  const handleTagClick = (tag) => {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag]
    if (onSelectTags) onSelectTags(next)
    scrollToProjectsGrid()
  }

  const handleClear = () => {
    if (onSelectTags) onSelectTags([])
  }

  useEffect(() => {
    let ignore = false

    const load = async () => {
      setLoading(true)
      try {
        const channels = await getGroupChannels(DEFAULT_GROUP_SLUG, {
          per: 100,
          maxPages: 5,
        })

        const projectChannels = channels.filter((ch) => {
          const title = (ch.title || ch.slug || '').trim()
          return title.startsWith('Project')
        })

        const tagSet = new Set()

        await Promise.all(
          projectChannels.map(async (channel) => {
            const blocks = await getChannelContents(channel.slug, { per: 100 })
            const tagsBlock = blocks.find(
              (b) => (b.title || b.generated_title || '').toLowerCase().trim() === 'tags'
            )
            if (!tagsBlock) return
            const text = parseBlockTextContent(tagsBlock)
            if (!text) return
            text.split(',').forEach((t) => {
              const tag = t.trim()
              if (tag) tagSet.add(tag)
            })
          })
        )

        if (!ignore) {
          setTags(Array.from(tagSet).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })))
        }
      } catch {
        if (!ignore) setTags([])
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    load()
    return () => { ignore = true }
  }, [])

  if (loading || tags.length === 0) return null

  return (
    <MenuWrapper ref={wrapperRef}>
      <TagList>
        {tags.map((tag) => (
          <TagItem key={tag}>
            <TagButton
              type="button"
              $selected={selectedTags.includes(tag)}
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </TagButton>
          </TagItem>
        ))}
      </TagList>
      {selectedTags.length > 0 && (
        <ClearButton type="button" onClick={handleClear}>
          All
        </ClearButton>
      )}
    </MenuWrapper>
  )
}

export default TagsMenu
