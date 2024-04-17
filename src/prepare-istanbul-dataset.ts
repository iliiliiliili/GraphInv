import { IstanbulEinDataset } from "./data-readers";
import greedy_modularity_communities from "./clustering/clauset-newman-moore";
import * as fs from "fs";
import fire from "js-fire"

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

const createCommunities = async () => {
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

    const subsetGraphNodeCount = 20000; //istanbulDataset.nodeCount;
    const subsetGraphConnectionsCount = 100000000; //istanbulDataset.nodeCount;
    const subsetGraphNodesStart = 0;
    const subsetGraphNodesEnd = subsetGraphNodesStart + subsetGraphNodeCount;

    console.log("Creating subset graph");

    istanbulDataset.nodes.xCoordinates =
        istanbulDataset.nodes.xCoordinates.subarray(
            subsetGraphNodesStart,
            subsetGraphNodesEnd
        );
    istanbulDataset.nodes.yCoordinates =
        istanbulDataset.nodes.yCoordinates.subarray(
            subsetGraphNodesStart,
            subsetGraphNodesEnd
        );
    istanbulDataset.nodes.zIndex = istanbulDataset.nodes.zIndex.subarray(
        subsetGraphNodesStart,
        subsetGraphNodesEnd
    );

    istanbulDataset.nodes.features.forEach((a, i) => {
        istanbulDataset.nodes.features[i] = a.subarray(
            subsetGraphNodesStart,
            subsetGraphNodesEnd
        );
    });

    let i = 0;
    let subsetGraphConnectionsStart = istanbulDataset.connectionCount;
    let subsetGraphConnectionsEnd = 0;
    while (istanbulDataset.connections.from[i] < subsetGraphNodesEnd) {
        if (
            istanbulDataset.connections.to[i] >= subsetGraphNodesStart &&
            istanbulDataset.connections.to[i] < subsetGraphNodesEnd &&
            istanbulDataset.connections.from[i] !=
                istanbulDataset.connections.to[i]
        ) {
            subsetGraphConnectionsStart = Math.min(
                subsetGraphConnectionsStart,
                i
            );
            subsetGraphConnectionsEnd = Math.max(subsetGraphConnectionsEnd, i);
        }

        i++;
    }

    // subsetGraphConnectionsEnd = Math.min(
    //     subsetGraphConnectionsEnd,
    //     subsetGraphConnectionsStart + subsetGraphConnectionsCount
    // );

    istanbulDataset.connections.to = istanbulDataset.connections.to.subarray(
        subsetGraphConnectionsStart,
        subsetGraphConnectionsEnd
    );
    istanbulDataset.connections.from =
        istanbulDataset.connections.from.subarray(
            subsetGraphConnectionsStart,
            subsetGraphConnectionsEnd
        );
    istanbulDataset.connections.value =
        istanbulDataset.connections.value.subarray(
            subsetGraphConnectionsStart,
            subsetGraphConnectionsEnd
        );
    istanbulDataset.connections.zIndex =
        istanbulDataset.connections.zIndex.subarray(
            subsetGraphConnectionsStart,
            subsetGraphConnectionsEnd
        );
    
    console.log("Creating communities");

    const communities = greedy_modularity_communities(istanbulDataset, (c) => new Int32Array(c), {verbose: true});

    console.log(communities);
    console.log();

    fs.writeFileSync("./communities.txt", JSON.stringify(communities));
};

fire({
    prepareBins,
    preparePajek,
    prepareFeatures,
    checkFeaturesBin,
    createCommunities,
});