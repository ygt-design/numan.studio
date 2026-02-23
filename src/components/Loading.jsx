import styled, { keyframes } from 'styled-components'

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`

const LoadingContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(248, 250, 252, 1);
  z-index: 9999;
`

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(15, 23, 42, 0.1);
  border-top-color: #0f172a;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`

const Loading = () => {
  return (
    <LoadingContainer>
      <Spinner />
    </LoadingContainer>
  )
}

export default Loading

