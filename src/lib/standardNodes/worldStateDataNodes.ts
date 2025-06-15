import type { NodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/NodeBluePrint.js';
import { FirestoreNodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/FirestoreNodeBluePrint.js';
import { NumberSocketParamsBuilder } from '../../routes/app/lib/SocketParamBuilders.js';

const nodeBluePrintController: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

export async function worldStateDataNodes() {
    const weather =
        await nodeBluePrintController.initOfficialNodeBluePrint('weather');
    weather.title = 'Weather at GPS Coordinate (Approximate)';
    weather.documentation = 'Returns the weather at a given GPS Coordinate';

    await weather.newInputSocket('lat', {
        label: 'GPS Latitude',
        documentation: 'Latitude',
        type: 'number',
        params: new NumberSocketParamsBuilder(40.758701)
            .setMin(-90)
            .setMax(90)
            .setStep(0.000001)
            .build(), // millcreek
    });
    await weather.newInputSocket('long', {
        label: 'GPS Longitude',
        documentation: 'Longitude',
        type: 'number',
        params: new NumberSocketParamsBuilder(-111.876183)
            .setMin(-180)
            .setMax(180)
            .setStep(0.000001)
            .build(), // millcreek
    });

    await weather.newOutputSocket('precipitation', {
        label: 'Precipitation',
        documentation: 'How much it rains',
        type: 'number',
    });

    await weather.newOutputSocket('predipication_variance', {
        label: 'Precipitation Uncertainty',
        documentation: 'How much it rains when this says it will rain.',
        type: 'number',
    });

    await weather.newOutputSocket('temp_f', {
        label: 'Temperature (F)',
        documentation: 'In farenheight',
        type: 'number',
    });

    await weather.newOutputSocket('temp_c', {
        label: 'Temperature (C)',
        documentation: 'In celcius',
        type: 'number',
    });

    await weather.newOutputSocket('wind_speed_mph', {
        label: 'Wind Speed (mph)',
        documentation: 'Wind speed in miles per hour',
        type: 'number',
    });

    await weather.newOutputSocket('wind_speed_kmph', {
        label: 'Wind Speed (km/h)',
        documentation: 'Wind speed in kilometers per hour',
        type: 'number',
    });

    await weather.newOutputSocket('anomolous_rating', {
        label: 'Anomolous rating',
        documentation:
            'How anomalous is the weather in this location on this day given known history? ' +
            'Is today significatnly different?',
        type: 'number',
    });

    weather.code = `
  throw new Error("Weather Node is a Work In Progress. Please Check Back Later or Implement your Own.");
`;
}
