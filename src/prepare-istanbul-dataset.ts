import { IstanbulEinDataset } from "./data-readers";

// (async () => {

//     const istanbulDataset = new IstanbulEinDataset("./data/istanbul");

//     await istanbulDataset.loadDataset();
//     await istanbulDataset.saveAsBins("./data/istanbul");
//     console.log ("I am done");
// })();


(async () => {

    const istanbulDataset = new IstanbulEinDataset("./data/istanbul", "", IstanbulEinDataset.EinFileType.ConnectionBinsNode);
    await istanbulDataset.loadDataset();
    // await istanbulDataset.saveAsBins("./data/istanbul/debug");
    await istanbulDataset.saveAsPajekNet("./data/istanbul/pajek/istanbul.net");
    const i = 537000000;
    console.log(istanbulDataset.connections.from.subarray(0 + i, 100 + i));
    console.log(istanbulDataset.connections.to.subarray(0 + i, 100 + i));
    console.log(istanbulDataset.connections.value.subarray(0 + i, 100 + i));
    console.log ("I am done");
})();