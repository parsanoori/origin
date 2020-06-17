import React, { useState } from 'react';
import {
    List,
    Card,
    CardHeader,
    CardContent,
    ListItem,
    ListItemAvatar,
    Avatar,
    Grid,
    ListItemText,
    Typography,
    Checkbox,
    Button,
    FormControlLabel,
    CardActions
} from '@material-ui/core';
import { ICertificateViewItem } from '../../features/certificates';
import {
    deviceById,
    getEnvironment,
    getProducingDevices,
    PowerFormatter,
    moment,
    energyImageByType,
    getCurrencies
} from '../..';
import { useSelector, useDispatch } from 'react-redux';
import { BigNumber } from 'ethers/utils';
import { formatCurrencyComplete, useTranslation, EnergyFormatter } from '../../utils';
import CurrencyTextField from '@unicef/material-ui-currency-textfield';
import { createBundle } from '../../features/bundles';
import { BundleItemDTO } from '../../utils/exchange';

interface IOwnProps {
    selected: ICertificateViewItem[];
    totalVolume: BigNumber;
    callback: () => void;
}

export const SelectedForSale = (props: IOwnProps) => {
    const { selected, totalVolume, callback } = props;
    const environment = useSelector(getEnvironment);
    const devices = useSelector(getProducingDevices);
    const [price, setPrice] = useState(0);
    const [sellAsBundle, setSellAsBundle] = useState(false);
    const currency = useSelector(getCurrencies)[0];
    const { t } = useTranslation();
    const dispatch = useDispatch();

    async function requestCreateBundle() {
        const items: BundleItemDTO[] = [];
        for (const cert of selected) {
            const {
                assetId,
                energy: { privateVolume, publicVolume }
            } = cert;
            items.push({
                assetId,
                volume: privateVolume.add(publicVolume).toString()
            });
        }
        dispatch(
            createBundle({
                bundleDTO: {
                    price,
                    items
                },
                callback
            })
        );
    }

    return (
        <Card>
            <CardHeader title="SELECTED FOR SALE" />
            <CardContent>
                <List>
                    {selected.map((cert) => {
                        const device = deviceById(cert.deviceId, environment, devices);
                        const type = device.deviceType.split(';')[0];
                        const energy = cert.energy.publicVolume;
                        const { province, region } = device;
                        return (
                            <ListItem key={cert.id}>
                                <ListItemAvatar>
                                    <Avatar src={energyImageByType(type)}></Avatar>
                                </ListItemAvatar>
                                <Grid container spacing={3}>
                                    <Grid item xs={8}>
                                        <ListItemText
                                            primary={
                                                <div>
                                                    <Typography>
                                                        {province}, {region}
                                                    </Typography>
                                                    <Typography>{device.facilityName}</Typography>
                                                </div>
                                            }
                                            secondary={moment(new Date(cert.creationTime)).format(
                                                'MMM, YYYY'
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={4}>
                                        <ListItemText
                                            primary={PowerFormatter.format(energy.toNumber(), true)}
                                            secondary={`${(
                                                (100 * energy.toNumber()) /
                                                totalVolume.toNumber()
                                            ).toFixed(0)} %`}
                                        />
                                    </Grid>
                                </Grid>
                            </ListItem>
                        );
                    })}
                </List>
                <Grid container justify="space-between">
                    <Grid item>Total Volume</Grid>
                    <Grid item>{PowerFormatter.format(totalVolume.toNumber(), true)}</Grid>
                </Grid>
                <CurrencyTextField
                    fullWidth
                    variant="filled"
                    className="mt-3"
                    required
                    label={t('bundle.properties.price')}
                    currencySymbol="$"
                    outputFormat="number"
                    value={price}
                    onChange={(event, value) => setPrice(value)}
                />
                <Grid container justify="space-between" style={{ margin: '10px' }}>
                    <Grid item>Total Price</Grid>
                    <Grid item>
                        {formatCurrencyComplete(
                            Number(EnergyFormatter.format(totalVolume, false)) * price,
                            currency
                        )}
                    </Grid>
                </Grid>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={sellAsBundle}
                            onChange={() => setSellAsBundle(!sellAsBundle)}
                        />
                    }
                    label="Sell as bundle"
                ></FormControlLabel>
            </CardContent>
            <CardActions>
                <Button
                    color="primary"
                    onClick={requestCreateBundle}
                    variant="contained"
                    disabled={!sellAsBundle}
                >
                    Sell {selected.length} certificates
                </Button>
                <Button color="secondary" onClick={callback}>
                    Cancel
                </Button>
            </CardActions>
        </Card>
    );
};
