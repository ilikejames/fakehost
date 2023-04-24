import { FC } from 'react'
import { Grid, Button, TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, RadioGroup, Radio, FormControlLabel } from '@mui/material'

export const Form: FC = () => {

    const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
    }

    return (
        <Dialog open={true}>
            <DialogTitle>Test POST Data</DialogTitle>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <Grid container direction={"column"} spacing={2}>
                        <Grid item>
                            <DialogContentText>This form POSTS to the server and outputs the response.</DialogContentText>
                            <DialogContentText>The service will either echo what was submitted, or return an error.</DialogContentText>
                        </Grid>
                        <Grid item>
                            <TextField fullWidth label="Symbol" name="symbol" />
                        </Grid>
                        <Grid item>
                            <TextField fullWidth label="Quantity" name="quantity" type="number" />
                        </Grid>
                        <Grid item>
                            <RadioGroup aria-label="side" name="side" row>
                                <FormControlLabel value="buy" control={<Radio />} label="Buy" />
                                <FormControlLabel value="sell" control={<Radio />} label="Sell" />
                            </RadioGroup>
                        </Grid>
                    </Grid>
                </form>
            </DialogContent>

            <DialogActions>
                <Button>Cancel</Button>
                <Button variant="contained" type="submit">Send</Button>
            </DialogActions>
        </Dialog >
    )
}