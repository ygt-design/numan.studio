import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { GridContainer, GridColumn } from '../styles'

const VisualizationWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 2;
  padding: 20px;
  display: flex;
  justify-content: center;
  overflow: hidden;
  opacity: ${(props) => (props.$visible ? 0.3 : 0)};
  transition: opacity 0.2s ease;
`

const GridWrapper = styled.div`
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
`

const ColumnIndicator = styled(GridColumn)`
  background-color: rgba(37, 99, 235, 0.1);
  border: 1px solid rgba(37, 99, 235, 0.3);
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  font-size: 0.75rem;
  color: rgba(37, 99, 235, 0.6);
  font-family: 'Inter', monospace;
`

const GridVisualization = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = e.target.closest('input, textarea, [contenteditable="true"]')
      if ((e.key === 'g' || e.key === 'G') && !isInput) {
        setIsVisible((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <VisualizationWrapper $visible={isVisible}>
      <GridWrapper>
        <GridContainer>
          {Array.from({ length: 12 }, (_, i) => (
            <ColumnIndicator key={i} span={1}>
              {i + 1}
            </ColumnIndicator>
          ))}
        </GridContainer>
      </GridWrapper>
    </VisualizationWrapper>
  )
}

export default GridVisualization

