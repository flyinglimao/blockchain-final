import styled from "@emotion/styled";
import { Typography } from "@mui/material";

const Root = styled.div`
  padding: 20px 0;
  width: 100%;
  height: 160px;
  display: grid;
  align-items: center;
`;

export function Hero() {
  return (
    <Root>
      <div>
        <Typography variant="h3">Pools</Typography>
        <Typography variant="p">Add funds to pools to earn.</Typography>
      </div>
    </Root>
  );
}
