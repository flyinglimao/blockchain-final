import {
  Container,
  Box,
  FormControlLabel,
  Switch,
  TextField,
  TableContainer,
  Paper,
  Table,
  TableBody,
} from "@mui/material";
import { Hero } from "./Hero";
import { Strategy } from "./Strategy";
import { useList } from "react-firebase-hooks/database";
import { ref, getDatabase } from "firebase/database";
import { firebaseApp } from "../firebase";
import { useMemo, useState } from "react";

const db = getDatabase(firebaseApp);

export function StrategyList() {
  const [onlyAllowed, setOnlyAllowed] = useState(true);
  const [onlyInvested, setOnlyInvested] = useState(false);
  const [snapshots] = useList(ref(db, "strategies"));
  const strategies = useMemo(
    () => snapshots.map((e) => ({ ...e.val(), id: e.key })),
    [snapshots]
  );

  return (
    <Container maxWidth="lg">
      <Hero />
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <FormControlLabel
            control={<Switch />}
            label="Only Allowed"
            checked={onlyAllowed}
            onChange={(evt) => setOnlyAllowed(evt.target.checked)}
          />
          <FormControlLabel
            control={<Switch />}
            label="Only Invested"
            checked={onlyInvested}
            onChange={(evt) => setOnlyInvested(evt.target.checked)}
          />
        </div>
        <TextField
          id="outlined-basic"
          label="Search"
          variant="outlined"
          size="small"
        />
      </Box>
      <TableContainer component={Paper} sx={{ marginTop: "12px" }}>
        <Table aria-label="collapsible table">
          <TableBody>
            {strategies.map((strategy, idx) => (
              <Strategy
                info={strategy}
                isLast={idx === strategies.length - 1}
                key={`strategy-${idx}`}
                onlyAllowed={onlyAllowed}
                onlyInvested={onlyInvested}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
