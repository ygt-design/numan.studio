import { useState } from 'react'
import Intro from './Intro'
import ProjectsGrid from './ProjectsGrid'
import TagsMenu from './TagsMenu'

const Home = () => {
  const [selectedTags, setSelectedTags] = useState([])

  return (
    <>
      <TagsMenu
        selectedTags={selectedTags}
        onSelectTags={setSelectedTags}
      />
      <Intro />
      <ProjectsGrid selectedTags={selectedTags} />
    </>
  )
}

export default Home
