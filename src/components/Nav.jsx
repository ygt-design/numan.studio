import { useState } from 'react'
import styled from 'styled-components'
import { GridContainer, GridColumn } from '../styles'

const NavWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  padding: 20px 0 0 20px;
`

const NavIsland = styled.nav`
  display: flex;
  flex-direction: ${(props) => (props.$isOpen ? 'column' : 'row')};
  justify-content: flex-start;
  align-items: flex-start;
  gap: 1rem;
  padding: 0;
  font-family: 'PPNeueMontreal', sans-serif;
  font-size: 1rem;
  line-height: 1.45;
  letter-spacing: 0.02em;
  width: fit-content;

  @media (min-width: 768px) {
    font-size: 1.15rem;
  }
`

const ToggleButton = styled.button`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  width: 64px;
  height: 64px;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
`

const PlusIcon = styled.span`
  display: block;
  position: relative;
  width: 40px;
  height: 40px;

  &::before,
  &::after {
    content: '';
    position: absolute;
    background: currentColor;
    transition: transform 0.2s ease;
  }

  &::before {
    left: 50%;
    top: 0;
    bottom: 0;
    width: 2px;
    transform: translateX(-50%) rotate(${(props) => (props.$isOpen ? '-90deg' : '0deg')});
  }

  &::after {
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    transform: translateY(-50%);
  }
`

const NavLinks = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
`

const NavLink = styled.a`
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    opacity: 0.7;
  }
`

const Nav = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <NavWrapper>
      <GridContainer>
        <GridColumn span={3}>
          <NavIsland $isOpen={isOpen}>
            <ToggleButton
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-expanded={isOpen}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              <PlusIcon $isOpen={isOpen} />
            </ToggleButton>
            {isOpen && (
              <NavLinks>
                <NavLink href="#" onClick={() => setIsOpen(false)}>Work</NavLink>
                <NavLink href="#" onClick={() => setIsOpen(false)}>Gallery</NavLink>
                <NavLink href="#" onClick={() => setIsOpen(false)}>About</NavLink>
              </NavLinks>
            )}
          </NavIsland>
        </GridColumn>
      </GridContainer>
    </NavWrapper>
  )
}

export default Nav

