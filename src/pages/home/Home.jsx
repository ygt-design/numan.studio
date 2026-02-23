import { useState } from 'react'
import Intro from './Intro'
import ProjectsGrid from './ProjectsGrid'
import TagsMenu from './TagsMenu'

const Home = () => {
  const [selectedTags, setSelectedTags] = useState([])
  const [tagsMenuHeight, setTagsMenuHeight] = useState(0)

  return (
    <>
      <TagsMenu
        selectedTags={selectedTags}
        onSelectTags={setSelectedTags}
        onHeightChange={setTagsMenuHeight}
      />
      <Intro tagsMenuHeight={tagsMenuHeight} />
      <ProjectsGrid selectedTags={selectedTags} />
    </>
  )
}

export default Home
