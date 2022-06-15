import { useEffect, useState } from "react";
import {
  Box,
  Avatar,
  Collapse,
  Paper,
  TableRow,
  TableCell,
  Typography,
  IconButton,
  Grid,
  Link,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from "@mui/material";
import { KeyboardArrowUp, KeyboardArrowDown } from "@mui/icons-material";
import styled from "@emotion/styled";
import { useStrategy } from "../hooks/useStrategy";
import { ethers } from "ethers";
import { useAllowance, useApprove } from "../hooks/useERC20";
import { useAccount, useConnect } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { ENX_ADDRESS, PROTOCOL_ADDRESS } from "../constants";

const StrategyIcon = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const InfoList = styled.ul`
  list-style: none;
  padding-left: 0;
  li {
    display: flex;
    justify-content: space-between;
  }
`;

export function Strategy(props) {
  const { info } = props;
  const [open, setOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openStopLossDialog, setOpenStopLossDialog] = useState(false);
  const [stopLoss, setStopLoss] = useState("");
  const [stopLossReward, setStopLossReward] = useState("");
  const [investType, setInvestType] = useState("Deposit");
  const [investChange, setInvestChange] = useState("");
  const strategy = useStrategy(props.info.id, props.info.strategyContract);
  const { data: account } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const allowance = useAllowance(
    props.info.investToken,
    (account && account.address) || ethers.constants.AddressZero,
    info.strategyContract
  );
  const enxAllowance = useAllowance(
    ENX_ADDRESS,
    (account && account.address) || ethers.constants.AddressZero,
    PROTOCOL_ADDRESS
  );
  const {
    writeAsync: approve,
    status: approveStatus,
    error: approveError,
    reset: approveReset,
  } = useApprove(props.info.investToken);
  const {
    writeAsync: enxApprove,
    status: enxApproveStatus,
    error: enxApproveError,
    reset: enxApproveReset,
  } = useApprove(ENX_ADDRESS);
  const [investError, setInvestError] = useState("");
  const [stopLossError, setStopLossError] = useState("");

  useEffect(() => {
    if (strategy.stopLoss !== "Loading")
      setStopLoss(
        ethers.utils.formatUnits(
          strategy.stopLoss,
          props.info.investTokenDecimals
        )
      );
    if (strategy.stopLossReward !== "Loading")
      setStopLossReward(ethers.utils.formatUnits(strategy.stopLossReward, 18));
  }, [
    props.info.investTokenDecimals,
    strategy.stopLoss,
    strategy.stopLossReward,
  ]);
  useEffect(() => {
    approveError && setInvestError(approveError.message);
  }, [approveError]);
  useEffect(() => {
    enxApproveError && setStopLossError(enxApproveError.message);
  }, [enxApproveError]);
  useEffect(() => {
    strategy &&
      strategy.deposit &&
      strategy.deposit.error &&
      setInvestError(strategy.deposit.error.message);
    strategy &&
      strategy.withdraw &&
      strategy.withdraw.error &&
      setInvestError(strategy.withdraw.error.message);
    strategy &&
      strategy.setStopLoss &&
      strategy.setStopLoss.error &&
      setStopLossError(strategy.setStopLoss.error.message);
  }, [strategy]);

  if (
    !strategy.isApproved ||
    (props.onlyAllowed && !strategy.isAllowed) ||
    (props.onlyInvested && !strategy.isInvested)
  )
    return <></>;
  return (
    <>
      <Dialog open={openDialog} fullWidth>
        <DialogTitle>{investType}</DialogTitle>
        <DialogContent>
          {investError && <Alert severity="error">{investError}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label={`${investType} Amount`}
            type="number"
            fullWidth
            variant="standard"
            value={investChange}
            onChange={(evt) => setInvestChange(evt.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              approveReset();
              strategy.deposit.reset();
              strategy.withdraw.reset();
              setInvestError("");
              setOpenDialog(false);
            }}
            disabled={
              approveStatus === "loading" ||
              approveStatus === "success" ||
              strategy[investType.toLowerCase()].status === "loading" ||
              strategy[investType.toLowerCase()].status === "success"
            }
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              approveReset();
              strategy.deposit.reset();
              strategy.withdraw.reset();
              setInvestError("");
              if (
                investType === "Deposit" &&
                allowance.lt(
                  ethers.utils.parseUnits(
                    investChange,
                    info.investTokenDecimals
                  )
                )
              ) {
                const tx = await approve({
                  args: [
                    info.strategyContract,
                    ethers.utils.parseUnits(
                      investChange,
                      info.investTokenDecimals
                    ),
                  ],
                });
                await tx.wait();
                approveReset();
              }
              const tx = await strategy[investType.toLowerCase()].writeAsync({
                args: [
                  info.id,
                  ethers.utils.parseUnits(
                    investChange,
                    info.investTokenDecimals
                  ),
                ],
              });
              await tx.wait();
              strategy[investType.toLowerCase()].reset();
              strategy.refetch();
              setOpenDialog(false);
              setInvestError("");
              setInvestChange("");
            }}
            disabled={
              approveStatus === "loading" ||
              approveStatus === "success" ||
              strategy[investType.toLowerCase()].status === "loading" ||
              strategy[investType.toLowerCase()].status === "success"
            }
          >
            {investType}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openStopLossDialog} fullWidth>
        <DialogTitle>Set Stop Loss</DialogTitle>
        <DialogContent>
          {stopLossError && <Alert severity="error">{stopLossError}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Stop Loss"
            type="number"
            fullWidth
            variant="standard"
            value={stopLoss}
            onChange={(evt) => {
              setStopLoss(evt.target.value);
              console.log(evt.target.value);
            }}
          />
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Stop Loss Fee"
            type="number"
            fullWidth
            variant="standard"
            helperText="The fee for the stop loss executor, in ENX"
            value={stopLossReward}
            onChange={(evt) => setStopLossReward(evt.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              enxApproveReset();
              strategy.setStopLoss.reset();
              setStopLossError("");
              setOpenStopLossDialog(false);
            }}
            disabled={
              enxApproveStatus === "loading" ||
              enxApproveStatus === "success" ||
              strategy.stopLoss.status === "loading" ||
              strategy.stopLoss.status === "success"
            }
          >
            Cancel
          </Button>
          <Button
            disabled={
              enxApproveStatus === "loading" ||
              enxApproveStatus === "success" ||
              strategy.stopLoss.status === "loading" ||
              strategy.stopLoss.status === "success"
            }
            onClick={async () => {
              enxApproveReset();
              strategy.setStopLoss.reset();
              setStopLossError("");
              if (
                enxAllowance.lt(ethers.utils.parseUnits(stopLossReward, 18))
              ) {
                const tx = await enxApprove({
                  args: [
                    PROTOCOL_ADDRESS,
                    ethers.utils.parseUnits(stopLossReward, 18),
                  ],
                });
                await tx.wait();
                approveReset();
              }
              const tx = await strategy.setStopLoss.writeAsync({
                args: [
                  info.id,
                  ethers.utils.parseUnits(
                    stopLoss,
                    props.info.investTokenDecimals
                  ),
                  ethers.utils.parseUnits(stopLossReward, 18),
                ],
              });
              await tx.wait();
              strategy.setStopLoss.reset();
              strategy.refetch();
              setOpenStopLossDialog(false);
              setStopLossError("");
              setStopLoss("");
              setStopLossReward("");
            }}
          >
            Set
          </Button>
        </DialogActions>
      </Dialog>
      <TableRow
        onClick={() => setOpen((e) => !e)}
        sx={{ "& > *": { borderBottom: "unset" } }}
      >
        <TableCell>
          <Avatar>
            <StrategyIcon src={info.logo} alt={info.name} />
          </Avatar>
        </TableCell>
        <TableCell>
          <Typography variant="h6" component="p">
            {info.name}
          </Typography>
          <Typography variant="subtitle" component="p">
            {new Date(info.startedAt * 1000).toLocaleString()}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="h6" component="p">
            Invested
          </Typography>
          <Typography variant="subtitle" component="p">
            {ethers.utils.formatUnits(strategy.invested).toString()}{" "}
            {info.investTokenName}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="h6" component="p">
            Current Value
          </Typography>
          <Typography variant="subtitle" component="p">
            {ethers.utils.formatUnits(strategy.currentValue).toString()}{" "}
            {info.investTokenName}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="h6" component="p">
            Annualized ROI
          </Typography>
          <Typography variant="subtitle" component="p">
            {typeof strategy.cumulativeROI === "number"
              ? (
                  (strategy.cumulativeROI /
                    (new Date().getTime() -
                      new Date(info.startedAt * 1000).getTime())) *
                    (86400 * 1000 * 365) *
                    100 -
                  100
                ).toFixed(2)
              : strategy.cumulativeROI}{" "}
            %
          </Typography>
        </TableCell>
        <TableCell>
          Detail
          <IconButton
            aria-label="expand row"
            size="small"
            defaultChecked={false}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography
                variant="body"
                component="p"
                sx={{ marginTop: 3, marginBottom: 1 }}
              >
                {info.description}
              </Typography>
              <Grid container spacing={4} alignItems="center">
                <Grid item xs={3}>
                  <InfoList>
                    <li>
                      <span>Total Value:</span>
                      <span>
                        {ethers.utils
                          .formatUnits(
                            strategy.totalValue,
                            info.investTokenDecimals
                          )
                          .toString()}{" "}
                        {info.investTokenName}
                      </span>
                    </li>
                    <li>
                      <span>Invest Token:</span>
                      <span>
                        <Link
                          href={`https://rinkeby.etherscan.io/address/${info.investToken}`}
                          target="_blank"
                        >
                          {info.investTokenName}
                        </Link>
                      </span>
                    </li>
                    <li>
                      <Link
                        href={`https://rinkeby.etherscan.io/address/${info.strategyContract}`}
                        target="_blank"
                      >
                        View Contract
                      </Link>
                    </li>
                  </InfoList>
                </Grid>
                <Grid item xs={9}>
                  <Grid
                    container
                    spacing={3}
                    alignItems="stretch"
                    sx={{ height: "100%" }}
                  >
                    <Grid item xs={4}>
                      <Paper
                        sx={{
                          paddingTop: 2,
                          paddingBottom: 2,
                          paddingLeft: 3,
                          paddingRight: 3,
                        }}
                      >
                        <Typography variant="h6" component="p">
                          Invested
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="body" component="p">
                            {ethers.utils
                              .formatUnits(strategy.invested)
                              .toString()}{" "}
                            {info.investTokenName}
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{
                              minWidth: "32px",
                              marginRight: "8px",
                              opacity: 0,
                              pointerEvents: "none",
                            }}
                          >
                            &nbsp;
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper
                        sx={{
                          paddingTop: 2,
                          paddingBottom: 2,
                          paddingLeft: 3,
                          paddingRight: 3,
                        }}
                      >
                        <Typography variant="h6" component="p">
                          Current Value
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="body" component="p">
                            {ethers.utils
                              .formatUnits(strategy.currentValue)
                              .toString()}{" "}
                            {info.investTokenName}
                          </Typography>
                          <div>
                            <Button
                              variant="outlined"
                              size="small"
                              sx={{ minWidth: "32px", marginRight: "8px" }}
                              onClick={() => {
                                if (!account) {
                                  return connect();
                                }
                                strategy.refetch();
                                setOpenDialog(true);
                                setInvestType("Withdraw");
                              }}
                            >
                              -
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              sx={{ minWidth: "32px" }}
                              onClick={() => {
                                if (!account) {
                                  return connect();
                                }
                                strategy.refetch();
                                setOpenDialog(true);
                                setInvestType("Deposit");
                              }}
                            >
                              +
                            </Button>
                          </div>
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper
                        sx={{
                          paddingTop: 2,
                          paddingBottom: 2,
                          paddingLeft: 3,
                          paddingRight: 3,
                        }}
                      >
                        <Typography variant="h6" component="p">
                          Stop Loss
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="body" component="p">
                            {ethers.utils
                              .formatUnits(strategy.stopLoss)
                              .toString()}{" "}
                            {info.investTokenName}
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: "32px", marginRight: "8px" }}
                            onClick={() => {
                              if (!account) {
                                return connect();
                              }
                              strategy.refetch();
                              setOpenStopLossDialog(true);
                            }}
                          >
                            Change
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}
