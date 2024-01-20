import { IstanbulEinDataset } from "./data-readers";

const istanbulDataset = new IstanbulEinDataset("./data/istanbul");

(async () => {

    await istanbulDataset.loadDataset();
    await istanbulDataset.saveAsBins("./data/istanbul");
    console.log ("I am done");
})();

// const istanbulDataset = new IstanbulEinDataset("./data/istanbul", "", IstanbulEinDataset.EinFileType.ConnectionBins);

// (async () => {

//     await istanbulDataset.loadDataset();
//     // await istanbulDataset.saveAsJson("./data/istanbul/dataset.json");
//     // await istanbulDataset.saveAsBins("./data/istanbul");
//     console.log(istanbulDataset.connections.from.subarray(0, 100));
//     console.log(istanbulDataset.connections.to.subarray(0, 100));
//     console.log(istanbulDataset.connections.value.subarray(0, 100));
//     console.log ("I am done");
// })();