import { IstanbulEinDataset } from "./data-readers";

const prepareBins = async () => {
    const istanbulDataset = new IstanbulEinDataset("./data/istanbul");

    await istanbulDataset.loadDataset();
    await istanbulDataset.saveAsBins("./data/istanbul");
    console.log("I am done");
};

const preparePajek = async () => {
    const istanbulDataset = new IstanbulEinDataset(
        "./data/istanbul",
        "",
        IstanbulEinDataset.EinFileType.ConnectionBinsNode
    );
    await istanbulDataset.loadDataset();
    // await istanbulDataset.saveAsBins("./data/istanbul/debug");
    await istanbulDataset.saveAsPajekNet("./data/istanbul/pajek/istanbul.net");
    const i = 537000000;
    console.log(istanbulDataset.connections.from.subarray(0 + i, 100 + i));
    console.log(istanbulDataset.connections.to.subarray(0 + i, 100 + i));
    console.log(istanbulDataset.connections.value.subarray(0 + i, 100 + i));
    console.log("I am done");
};

const prepareFeatures = async () => {
    const istanbulDataset = new IstanbulEinDataset(
        "./data/istanbul",
        "",
        IstanbulEinDataset.EinFileType.ConnectionBinsNode,
        [
            [
                "Degree.txt",
                IstanbulEinDataset.FeatureFileType.InvestorLineTxtNode,
                (a) => Math.floor(parseFloat(a)),
            ],
            [
                "Centrality.txt",
                IstanbulEinDataset.FeatureFileType.InvestorLineTxtNode,
                (a) => parseFloat(a),
            ],
            [
                "NumberTrades.txt",
                IstanbulEinDataset.FeatureFileType.InvestorLineTxtNode,
                (a) => Math.floor(parseFloat(a)),
            ],
            [
                "Profits.txt",
                IstanbulEinDataset.FeatureFileType.InvestorLineTxtNode,
                (a) => parseFloat(a),
            ],
            [
                "ProfitsExcess.txt",
                IstanbulEinDataset.FeatureFileType.InvestorLineTxtNode,
                (a) => parseFloat(a),
            ],
            [
                "Volume.txt",
                IstanbulEinDataset.FeatureFileType.InvestorLineTxtNode,
                (a) => parseFloat(a),
            ],
        ]
    );
    await istanbulDataset.loadDataset();
    const x = 0;
    for (let i = 0; i < istanbulDataset.nodes.features.length; i++) {
        console.log(istanbulDataset.nodes.features[i].subarray(0 + x, 100 + x));
    }
    console.log("Saving");
    await istanbulDataset.saveAsBins("./data/istanbul/debug");
    console.log("I am done");
};

const checkFeaturesBin = async () => {
    const istanbulDataset = new IstanbulEinDataset(
        "./data/istanbul/debug",
        "",
        IstanbulEinDataset.EinFileType.ConnectionBinsNode,
        [
            [
                "feature_degree_${FILE_ID}.bin",
                IstanbulEinDataset.FeatureFileType.InvestorBinNode,
                (a) => Math.floor(parseFloat(a)),
            ],
            [
                "feature_centrality_${FILE_ID}.bin",
                IstanbulEinDataset.FeatureFileType.InvestorBinNode,
                (a) => parseFloat(a),
            ],
            [
                "feature_number_of_trades_${FILE_ID}.bin",
                IstanbulEinDataset.FeatureFileType.InvestorBinNode,
                (a) => Math.floor(parseFloat(a)),
            ],
            [
                "feature_profits_${FILE_ID}.bin",
                IstanbulEinDataset.FeatureFileType.InvestorBinNode,
                (a) => parseFloat(a),
            ],
            [
                "feature_profits_excess_${FILE_ID}.bin",
                IstanbulEinDataset.FeatureFileType.InvestorBinNode,
                (a) => parseFloat(a),
            ],
            [
                "feature_volume_${FILE_ID}.bin",
                IstanbulEinDataset.FeatureFileType.InvestorBinNode,
                (a) => parseFloat(a),
            ],
        ]
    );
    await istanbulDataset.loadDataset();
    const x = 0;
    for (let i = 0; i < istanbulDataset.nodes.features.length; i++) {
        console.log(istanbulDataset.nodes.features[i].subarray(0 + x, 100 + x));
    }
    console.log("I am done");
};

checkFeaturesBin();
