import { createGlobalStyle } from "styled-components";
import styled from "styled-components";

export const GlobalStyle = createGlobalStyle`

  @font-face {
    font-family: 'ABCGravity';
    src: url('/fonts/ABCGravity-Normal.otf') format('opentype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'PPNeueMontreal';
    src: url('/fonts/PPNeueMontreal-Book.otf') format('opentype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

  :root {
    color-scheme: light dark;
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    line-height: 1.5;
    font-weight: 400;
    color:rgb(0, 0, 0);
  }

  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-height: 100vh;
    background: white;
  }

  #root {
    min-height: 100vh;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    font-family: inherit;
  }
`;

// 12-column grid system with 20px gaps
export const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
  width: 100%;
`;

export const GridColumn = styled.div`
  grid-column: ${(props) => {
    if (props.span) {
      return `span ${props.span}`;
    }
    if (props.start && props.end) {
      return `${props.start} / ${props.end}`;
    }
    return "span 1";
  }};
`;
