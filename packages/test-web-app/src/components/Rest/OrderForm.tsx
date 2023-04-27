import { FC, useState } from 'react'
import { Alert, Grid, Button, TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, RadioGroup, Radio, FormControlLabel } from '@mui/material'
import { OrderControllerApi, Configuration, NewOrder, OrderSideEnum, ErrorContext, Order } from '@fakehost/rest-generated-client-api'
import { config } from '@/config'

type OrderFormProps = {
    onClose: () => void
}

export const OrderForm: FC<OrderFormProps> = ({ onClose }) => {
    const [error, setError] = useState<string>()
    const [success, setSuccess] = useState<Order>()

    const handleError = async (error: ErrorContext) => {
        if (error.response) {
            const json = await error.response.json()
            setError(json.message)
        }
    }

    const handleJsonSubmit = async (formData: FormData) => {
        const configuration = new Configuration({ basePath: config.restUrl })
        const api = new OrderControllerApi(configuration)
        try {
            const result = await api.placeOrderJson({ newOrder: getOrder(formData) })
            setSuccess(result)
        }
        catch (ex) {
            handleError(ex as ErrorContext)
        }
    }

    const handleFormUrlEncodedSubmit = async (formData: FormData) => {
        const configuration = new Configuration({ basePath: config.restUrl })
        const api = new OrderControllerApi(configuration)
        try {
            const result = await api.placeOrderForm(getOrder(formData))
            setSuccess(result)
        }
        catch (ex) {
            handleError(ex as ErrorContext)
        }
    }

    const handleMultipartFormDataSubmit = async (formData: FormData) => {
        const result = await fetch(`${config.restUrl}/orders/form-data`, {
            method: 'POST',
            body: formData
        })
        if (result.ok) {
            setSuccess(await result.json())
        }
        else {
            const error = await result.json()
            setError(error.message)
        }
    }

    const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault()
        setSuccess(undefined)
        setError(undefined)
        const formData = new FormData(e.currentTarget)
        const contentType = formData.get('content-type')
        formData.delete('content-type')

        switch (contentType) {
            case 'application/json':
                return handleJsonSubmit(formData)
            case 'application/x-www-form-urlencoded':
                return handleFormUrlEncodedSubmit(formData)
            case 'multipart/form-data':
                return handleMultipartFormDataSubmit(formData)
        }
    }

    return (
        <Dialog open={true}>
            <form onSubmit={handleSubmit}>

                <DialogTitle>Test POST Data</DialogTitle>
                <DialogContent>

                    <Grid container direction={"column"} spacing={2}>
                        <Grid item>
                            {error && <Alert severity="error">{error}</Alert>}
                            {success && <Alert severity="success"><code>{JSON.stringify(success)}</code></Alert>}
                        </Grid>
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
                            <RadioGroup aria-label="side" name="side" defaultValue={OrderSideEnum.Buy} row>
                                <FormControlLabel value={OrderSideEnum.Buy} control={<Radio />} label="Buy" />
                                <FormControlLabel value={OrderSideEnum.Sell} control={<Radio />} label="Sell" />
                            </RadioGroup>
                        </Grid>
                        <Grid item>
                            <RadioGroup aria-label="content-type" defaultValue={"application/json"} name="content-type">
                                <FormControlLabel value="application/json" control={<Radio />} label="application/json" />
                                <FormControlLabel value="application/x-www-form-urlencoded" control={<Radio />} label="application/x-www-form-urlencoded" />
                                <FormControlLabel value="multipart/form-data" control={<Radio />} label="multipart/form-data" />
                            </RadioGroup>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button variant="contained" type="submit">Send</Button>
                </DialogActions>
            </form>

        </Dialog >
    )
}

const getOrder = (formData: FormData): NewOrder => ({
    symbol: formData.get('symbol') as string,
    quantity: Number(formData.get('quantity')),
    side: formData.get('side') === 'buy' ? OrderSideEnum.Buy : OrderSideEnum.Sell
})
