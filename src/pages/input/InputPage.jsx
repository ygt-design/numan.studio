import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { getGroupChannels, createChannel, createBlock, uploadFileToArena } from '../../api/arenaClient.js'
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
  max-width: 250px;
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
  padding: 0.5rem 0;
  border: none;
  border-bottom: 1px solid #ccc;
  color: black;
  background: transparent;
  outline: none;
  transition: border-color 0.15s ease;
  width: 100%;

  &:focus {
    border-bottom-color: black;
  }

  &::placeholder {
    color: #aaa;
  }
`

const Textarea = styled.textarea`
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 1rem;
  line-height: 1.45;
  padding: 0.5rem 0;
  border: none;
  border-bottom: 1px solid #ccc;
  background: transparent;
  color: black;
  outline: none;
  resize: vertical;
  min-height: 100px;
  width: 100%;
  transition: border-color 0.15s ease;

  &:focus {
    border-bottom-color: black;
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
  border: 1px dashed #ccc;
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

const InputPage = () => {
  const navigate = useNavigate()

  const [channels, setChannels] = useState([])
  const [channelsLoading, setChannelsLoading] = useState(true)

  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])

  const [submitting, setSubmitting] = useState(false)
  const [submitProgress, setSubmitProgress] = useState('')
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(null)

  useEffect(() => {
    let ignore = false

    const load = async () => {
      try {
        const all = await getGroupChannels(DEFAULT_GROUP_SLUG, {
          per: 100,
          maxPages: 5,
        })

        if (ignore) return

        const projects = all.filter((ch) =>
          (ch.title || ch.slug || '').trim().startsWith('Project'),
        )

        setChannels(projects)
      } catch {
        /* channel list is informational; silently degrade */
      } finally {
        if (!ignore) setChannelsLoading(false)
      }
    }

    load()
    return () => { ignore = true }
  }, [])

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCoverFile(file)
    const url = URL.createObjectURL(file)
    setCoverPreview(url)
  }

  const removeCover = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverFile(null)
    setCoverPreview(null)
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
      const newChannel = await createChannel(channelTitle)

      if (description.trim()) {
        setSubmitProgress('Adding description…')
        await createBlock(newChannel.id, {
          value: description.trim(),
          title: 'Description',
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
              <ChannelItem key={ch.id || ch.slug}>
                <Link to={`/project/${ch.slug}`}>
                  {deriveProjectName(ch.title || ch.slug)}
                </Link>
                <ArenaButton
                  href={`https://www.are.na/${DEFAULT_GROUP_SLUG}/${ch.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Are.na
                </ArenaButton>
              </ChannelItem>
            ))}
          </ChannelList>
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
                <FileDropZone>
                  <DropZoneText>
                    Click to select a cover image
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
              <FileDropZone>
                <DropZoneText>
                  Click to add images
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
