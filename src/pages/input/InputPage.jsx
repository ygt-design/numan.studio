import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getGroupChannels, getChannelContents, createChannel, createBlock, updateBlock, uploadFileToArena } from '../../api/arenaClient.js'
import { invalidateProjectsCache } from '../../utils/projectsCache'
import { GridContainer, GridColumn } from '../../styles'

const DEFAULT_GROUP_SLUG =
  import.meta.env.VITE_ARENA_GROUP_SLUG?.trim() ||
  import.meta.env.VITE_ARENA_CHANNEL_SLUG?.trim() ||
  'numan-studio'

const PageWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  padding: 20px;
`

const DesktopGrid = styled(GridContainer)`
  height: 100%;
`

const LeftColumn = styled(GridColumn)`
  @media (min-width: 768px) {
    grid-column: 1 / 5;
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
    margin-top: 2rem;
  }
`

const RightColumn = styled(GridColumn)`
  @media (min-width: 768px) {
    grid-column: 6 / 13;
    height: calc(100vh - 40px);
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 0;
    }
    scrollbar-width: none;
  }

  @media (max-width: 767px) {
    grid-column: 1 / 13;
    order: 1;
  }
`

const SectionTitle = styled.h2`
  font-family: 'ABCGravity', sans-serif;
  font-size: 1.75rem;
  text-transform: uppercase;
  margin: 0 0 1.5rem 0;
  line-height: 1;

  @media (min-width: 768px) {
    font-size: 2.5rem;
  }
`

const GroupLink = styled.a`
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 0.9rem;
  color: white;
  background-color: black;
  border: 0.5px solid black;
  padding: 0.5rem;
  border-radius: 2px;
  text-decoration: none;
  display: inline-block;
  margin-bottom: 1.25rem;
  transition: color 0.15s ease;

  &:hover {
    background-color: #ccc;
    color: black;
  }
`

const ChannelList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

`

const ChannelItem = styled.li`
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 1rem;
  line-height: 1.45;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  gap: 0.5rem;
  flex-wrap: wrap;
  cursor: pointer;

  border: 0.5px solid #ccc;

  a {
    color: black;
    text-decoration: none;
    transition: opacity 0.15s ease;
  }

  &:hover {
    background-color: #ccc;
    color: white;
  }
`

const ChannelItemName = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
`

const ArenaButton = styled.a`
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 0.75rem;
  color: #666;
  text-decoration: none;
  padding: 0.25rem 0.5rem;
  border: 0.5px solid black;
  border-radius: 2px;
  transition: border-color 0.15s ease, color 0.15s ease;
  flex-shrink: 0;

  &:hover {
    background-color: black;
    color: white;
  }
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`

const FieldRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  flex-wrap: wrap;

  ${FieldGroup} {
    flex: 1;
    min-width: 120px;
  }
`

const Label = styled.label`
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 0.85rem;
  line-height: 1.3;
  color: #666;
`

const Input = styled.input`
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 1rem;
  line-height: 1.45;
  padding: 0.5rem;
  border: none;
  border: 1px solid #ccc;
  color: black;
  background: transparent;
  outline: none;
  transition: border-color 0.15s ease;
  width: 100%;

  &:focus {
    border-color: black;
  }

  &::placeholder {
    color: #aaa;
  }
`

const Textarea = styled.textarea`
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 1rem;
  line-height: 1.45;
  padding: 0.5rem;
  border: none;
  border: 1px solid #ccc;
  background: transparent;
  color: black;
  outline: none;
  resize: vertical;
  min-height: 100px;
  width: 100%;
  transition: border-color 0.15s ease;

  &:focus {
    border-color: black;
  }

  &::placeholder {
    color: #aaa;
  }
`

const SubmitButton = styled.button`
  padding: 0.75rem;
  background: black;
  color: white;
  border: none;
  cursor: pointer;
  border: 0.5px solid black;
  border-radius: 2px;
  transition: all 0.15s ease;
  align-self: flex-start;

  &:hover:not(:disabled) {
    background-color: #ccc;
    color: black;
  }

  &:disabled {
    background-color: #ccc;
    color: black;
  }
`

const ErrorMessage = styled.p`
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 0.9rem;
  color: #c00;
`

const SuccessMessage = styled.p`
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 0.9rem;
  color: #090;
`

const HintText = styled.span`
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 0.8rem;
  color: #999;
`

const FileDropZone = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
  border: 1px dashed ${(props) => (props.$isDragOver ? 'black' : '#ccc')};
  background: ${(props) => (props.$isDragOver ? '#f0f0f0' : 'transparent')};
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
  min-height: 120px;

  &:hover {
    border-color: black;
    background: #fafafa;
  }

  input[type='file'] {
    display: none;
  }
`

const DropZoneText = styled.span`
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 0.9rem;
  color: #999;
  text-align: center;
`

const PreviewGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 0.5rem;
`

const PreviewItem = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
`

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`

const RemoveButton = styled.button`
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border: none;
  background: black;
  color: white;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  &:hover {
    opacity: 0.7;
  }
`

const ProgressText = styled.span`
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 0.85rem;
  color: #666;
`

const ReorderSection = styled.div`
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
`

const ReorderList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const ReorderItemWrapper = styled.li`
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 0.9rem;
  line-height: 1.45;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 0.5px solid #ccc;
  background: white;
  cursor: grab;
  user-select: none;
  touch-action: none;

  &:active {
    cursor: grabbing;
  }
`

const ReorderPosition = styled.span`
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 0.75rem;
  color: #999;
  min-width: 1.25rem;
  text-align: right;
  flex-shrink: 0;
`

const ReorderName = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const DragHandle = styled.span`
  font-size: 0.85rem;
  color: #bbb;
  flex-shrink: 0;
`

const SaveOrderButton = styled.button`
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 0.85rem;
  padding: 0.5rem;
  margin-top: 0.75rem;
  background: black;
  color: white;
  border: 0.5px solid black;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background-color: #ccc;
    color: black;
  }

  &:disabled {
    background-color: #ccc;
    color: black;
  }
`

const OrderMessage = styled.span`
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 0.8rem;
  display: block;
  margin-top: 0.5rem;
  color: ${(props) => (props.$error ? '#c00' : '#090')};
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

const SortableProjectItem = ({ id, name, position }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <ReorderItemWrapper ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ReorderPosition>{position}</ReorderPosition>
      <ReorderName>{name}</ReorderName>
      <DragHandle>⠿</DragHandle>
    </ReorderItemWrapper>
  )
}

const InputPage = () => {
  const navigate = useNavigate()

  const [channels, setChannels] = useState([])
  const [channelsLoading, setChannelsLoading] = useState(true)

  const [reorderItems, setReorderItems] = useState([])
  const [reorderLoading, setReorderLoading] = useState(true)
  const [orderDirty, setOrderDirty] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [orderSaveMessage, setOrderSaveMessage] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [year, setYear] = useState('')
  const [medium, setMedium] = useState('')
  const [dimensions, setDimensions] = useState('')
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])

  const [coverDragOver, setCoverDragOver] = useState(false)
  const [imagesDragOver, setImagesDragOver] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [submitProgress, setSubmitProgress] = useState('')
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    let ignore = false

    const load = async () => {
      setReorderLoading(true)

      try {
        const all = await getGroupChannels(DEFAULT_GROUP_SLUG, {
          per: 100,
          maxPages: 5,
        })

        if (ignore) return

        const projects = all.filter((ch) =>
          (ch.title || ch.slug || '').trim().startsWith('Project'),
        )

        const withOrder = await Promise.all(
          projects.map(async (ch) => {
            const blocks = await getChannelContents(ch.slug, { per: 100 })
            const orderBlock = blocks.find(
              (b) => (b.title || b.generated_title || '').toLowerCase().trim() === 'order'
            )
            const orderText = orderBlock ? parseBlockTextContent(orderBlock) : ''
            const orderNum = orderText ? parseInt(orderText, 10) : NaN
            return {
              channel: ch,
              orderBlock: orderBlock || null,
              orderValue: isNaN(orderNum) ? Infinity : orderNum,
            }
          })
        )

        withOrder.sort((a, b) => {
          if (a.orderValue !== b.orderValue) return a.orderValue - b.orderValue
          const aTime = a.channel.created_at ? new Date(a.channel.created_at).getTime() : 0
          const bTime = b.channel.created_at ? new Date(b.channel.created_at).getTime() : 0
          return aTime - bTime
        })

        if (!ignore) {
          setChannels(withOrder.map((item) => item.channel))
          setReorderItems(withOrder)
          setOrderDirty(false)
        }
      } catch {
        /* channel list is informational; silently degrade */
      } finally {
        if (!ignore) {
          setChannelsLoading(false)
          setReorderLoading(false)
        }
      }
    }

    load()
    return () => { ignore = true }
  }, [reloadKey])

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setReorderItems((items) => {
      const oldIndex = items.findIndex((item) => String(item.channel.id) === active.id)
      const newIndex = items.findIndex((item) => String(item.channel.id) === over.id)
      return arrayMove(items, oldIndex, newIndex)
    })
    setOrderDirty(true)
    setOrderSaveMessage(null)
  }, [])

  const handleSaveOrder = async () => {
    setSavingOrder(true)
    setOrderSaveMessage(null)

    try {
      await Promise.all(
        reorderItems.map(async (item, index) => {
          const position = String(index + 1)
          if (item.orderBlock) {
            await updateBlock(item.orderBlock.id, { content: position })
          } else {
            await createBlock(item.channel.id, { value: position, title: 'Order' })
          }
        })
      )

      invalidateProjectsCache()
      setOrderSaveMessage('Order saved.')
      setOrderDirty(false)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setOrderSaveMessage(`Failed: ${err.message}`)
    } finally {
      setSavingOrder(false)
    }
  }

  const getImageFiles = (fileList) =>
    Array.from(fileList || []).filter((f) => f.type && f.type.startsWith('image/'))

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCoverFile(file)
    const url = URL.createObjectURL(file)
    setCoverPreview(url)
  }

  const handleCoverDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setCoverDragOver(false)
    if (submitting) return
    const files = getImageFiles(e.dataTransfer?.files)
    const file = files[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const handleCoverDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setCoverDragOver(true)
  }

  const handleCoverDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setCoverDragOver(false)
  }

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setImageFiles((prev) => [...prev, ...files])
    setImagePreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ])
  }

  const handleImagesDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setImagesDragOver(false)
    if (submitting) return
    const files = getImageFiles(e.dataTransfer?.files)
    if (!files.length) return
    setImageFiles((prev) => [...prev, ...files])
    setImagePreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ])
  }

  const handleImagesDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setImagesDragOver(true)
  }

  const handleImagesDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setImagesDragOver(false)
  }

  const removeCover = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverFile(null)
    setCoverPreview(null)
  }

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index])
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(null)
    setSubmitProgress('')

    const trimmedName = projectName.trim()
    if (!trimmedName) {
      setSubmitError('Project name is required.')
      return
    }

    setSubmitting(true)

    try {
      setSubmitProgress('Creating channel…')
      const channelTitle = `Project / ${trimmedName}`
      const newChannel = await createChannel(channelTitle, { visibility: 'private' })

      if (description.trim()) {
        setSubmitProgress('Adding description…')
        await createBlock(newChannel.id, {
          value: description.trim(),
          title: 'Description',
        })
      }

      if (tags.trim()) {
        setSubmitProgress('Adding tags…')
        await createBlock(newChannel.id, {
          value: tags.trim(),
          title: 'Tags',
        })
      }

      if (year.trim()) {
        setSubmitProgress('Adding year…')
        await createBlock(newChannel.id, {
          value: year.trim(),
          title: 'Year',
        })
      }

      if (medium.trim()) {
        setSubmitProgress('Adding medium…')
        await createBlock(newChannel.id, {
          value: medium.trim(),
          title: 'Medium',
        })
      }

      if (dimensions.trim()) {
        setSubmitProgress('Adding dimensions…')
        await createBlock(newChannel.id, {
          value: dimensions.trim(),
          title: 'Dimensions',
        })
      }

      if (coverFile) {
        setSubmitProgress('Uploading cover image…')
        const coverUrl = await uploadFileToArena(coverFile)
        await createBlock(newChannel.id, {
          value: coverUrl,
          title: 'Cover',
        })
      }

      for (let i = 0; i < imageFiles.length; i++) {
        setSubmitProgress(`Uploading image ${i + 1} of ${imageFiles.length}…`)
        const url = await uploadFileToArena(imageFiles[i])
        await createBlock(newChannel.id, { value: url })
      }

      setSubmitProgress('Setting order…')
      const maxOrder = reorderItems.reduce(
        (max, item) => (item.orderValue !== Infinity ? Math.max(max, item.orderValue) : max),
        0,
      )
      await createBlock(newChannel.id, { value: String(maxOrder + 1), title: 'Order' })

      invalidateProjectsCache()
      setSubmitProgress('')
      setSubmitSuccess(`Created "${channelTitle}". Redirecting…`)

      setTimeout(() => {
        navigate(`/project/${newChannel.slug}`)
      }, 1200)
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong.')
      setSubmitProgress('')
    } finally {
      setSubmitting(false)
    }
  }

  const deriveProjectName = (title) =>
    (title || '').replace(/^Project\s*\/\s*/i, '').trim() || title

  return (
    <PageWrapper>
      <DesktopGrid>
        <LeftColumn>
          <SectionTitle>Projects</SectionTitle>
          <GroupLink
            href={`https://www.are.na/${DEFAULT_GROUP_SLUG}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View the full project list on Are.na
          </GroupLink>

          {channelsLoading && (
            <HintText>Loading channels…</HintText>
          )}

          <ChannelList>
            {channels.map((ch) => (
              <ChannelItem
                key={ch.id || ch.slug}
                onClick={() => navigate(`/project/${ch.slug}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(`/project/${ch.slug}`)
                  }
                }}
              >
                <ChannelItemName>{deriveProjectName(ch.title || ch.slug)}</ChannelItemName>
                <ArenaButton
                  href={`https://www.are.na/${DEFAULT_GROUP_SLUG}/${ch.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  Are.na
                </ArenaButton>
              </ChannelItem>
            ))}
          </ChannelList>

          {!reorderLoading && reorderItems.length > 0 && (
            <ReorderSection>
              <SectionTitle style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>
                Reorder projects
              </SectionTitle>
              <HintText style={{ display: 'block', marginBottom: '0.75rem' }}>
                Drag to reorder. 1 = top of grid.
              </HintText>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={reorderItems.map((item) => String(item.channel.id))}
                  strategy={verticalListSortingStrategy}
                >
                  <ReorderList>
                    {reorderItems.map((item, index) => (
                      <SortableProjectItem
                        key={item.channel.id}
                        id={String(item.channel.id)}
                        name={deriveProjectName(item.channel.title || item.channel.slug)}
                        position={index + 1}
                      />
                    ))}
                  </ReorderList>
                </SortableContext>
              </DndContext>
              <SaveOrderButton
                type="button"
                onClick={handleSaveOrder}
                disabled={savingOrder || !orderDirty}
              >
                {savingOrder ? 'Saving…' : 'Save order'}
              </SaveOrderButton>
              {orderSaveMessage && (
                <OrderMessage $error={orderSaveMessage.startsWith('Failed')}>
                  {orderSaveMessage}
                </OrderMessage>
              )}
            </ReorderSection>
          )}
        </LeftColumn>

        <RightColumn>
          <SectionTitle>Submit a new project</SectionTitle>

          <Form onSubmit={handleSubmit}>
            <FieldGroup>
              <Label htmlFor="projectName">Project name</Label>
              <Input
                id="projectName"
                type="text"
                placeholder="e.g. Hand Pot"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
                disabled={submitting}
              />
              <HintText>
                Channel will be titled "Project / {projectName || '…'}"
              </HintText>
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the project…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
              />
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                type="text"
                placeholder="e.g. sculpture, ceramic, 2024"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={submitting}
              />
              <HintText>Separate multiple tags with commas (virgül)</HintText>
            </FieldGroup>

            <FieldRow>
              <FieldGroup>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="text"
                  placeholder="e.g. 2024"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  disabled={submitting}
                />
              </FieldGroup>
              <FieldGroup>
                <Label htmlFor="medium">Medium</Label>
                <Input
                  id="medium"
                  type="text"
                  placeholder="e.g. ceramic, stoneware"
                  value={medium}
                  onChange={(e) => setMedium(e.target.value)}
                  disabled={submitting}
                />
              </FieldGroup>
              <FieldGroup>
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input
                  id="dimensions"
                  type="text"
                  placeholder="e.g. 30 × 20 × 15 cm"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  disabled={submitting}
                />
              </FieldGroup>
            </FieldRow>

            <FieldGroup>
              <Label>Cover image</Label>
              {coverPreview ? (
                <PreviewGrid>
                  <PreviewItem>
                    <PreviewImage src={coverPreview} alt="Cover preview" />
                    <RemoveButton
                      type="button"
                      onClick={removeCover}
                      disabled={submitting}
                    >
                      ×
                    </RemoveButton>
                  </PreviewItem>
                </PreviewGrid>
              ) : (
                <FileDropZone
                  $isDragOver={coverDragOver}
                  onDragOver={handleCoverDragOver}
                  onDragLeave={handleCoverDragLeave}
                  onDrop={handleCoverDrop}
                >
                  <DropZoneText>
                    Drag an image here or click to select
                  </DropZoneText>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    disabled={submitting}
                  />
                </FileDropZone>
              )}
            </FieldGroup>

            <FieldGroup>
              <Label>Additional images</Label>
              <FileDropZone
                $isDragOver={imagesDragOver}
                onDragOver={handleImagesDragOver}
                onDragLeave={handleImagesDragLeave}
                onDrop={handleImagesDrop}
              >
                <DropZoneText>
                  Drag images here or click to add
                </DropZoneText>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                  disabled={submitting}
                />
              </FileDropZone>
              {imagePreviews.length > 0 && (
                <PreviewGrid>
                  {imagePreviews.map((src, i) => (
                    <PreviewItem key={i}>
                      <PreviewImage src={src} alt={`Image ${i + 1}`} />
                      <RemoveButton
                        type="button"
                        onClick={() => removeImage(i)}
                        disabled={submitting}
                      >
                        ×
                      </RemoveButton>
                    </PreviewItem>
                  ))}
                </PreviewGrid>
              )}
              <HintText>Each file will become a separate image block.</HintText>
            </FieldGroup>

            {submitError && <ErrorMessage>{submitError}</ErrorMessage>}
            {submitSuccess && <SuccessMessage>{submitSuccess}</SuccessMessage>}
            {submitProgress && <ProgressText>{submitProgress}</ProgressText>}

            <SubmitButton type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create project'}
            </SubmitButton>
          </Form>
        </RightColumn>
      </DesktopGrid>
    </PageWrapper>
  )
}

export default InputPage
