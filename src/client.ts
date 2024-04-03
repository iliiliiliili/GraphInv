import { OSigma, OGraph } from "osigma";
import { IstanbulEinDataset } from "./data-readers";
import { ValueChoices } from "osigma/value-choices";

const container = document.getElementById("sigma-container") as HTMLElement;
declare global {
    interface Window {
        istanbulDataset: IstanbulEinDataset,
        visualGraph: any,
        debug: any,
    }
}

const istanbulDataset = new IstanbulEinDataset("./data/istanbul", "", IstanbulEinDataset.EinFileType.ConnectionBinsWeb);
window.istanbulDataset = istanbulDataset;

(async () => {

    console.log ("Reading the dataset");
    await istanbulDataset.loadDataset();
    console.log ("Dataset loaded");
    
    // const subsetGraphNodeCount = 10000;
    // const subsetGraphNodesStart = 200000;
    // const subsetGraphNodesEnd = subsetGraphNodesStart + subsetGraphNodeCount;
    const subsetGraphNodeCount = istanbulDataset.nodeCount;
    const subsetGraphNodesStart = 0;
    const subsetGraphNodesEnd = subsetGraphNodesStart + subsetGraphNodeCount;

    console.log ("Creating subset graph");

    istanbulDataset.nodes.xCoordinates = istanbulDataset.nodes.xCoordinates.subarray(subsetGraphNodesStart, subsetGraphNodesEnd);
    istanbulDataset.nodes.yCoordinates = istanbulDataset.nodes.yCoordinates.subarray(subsetGraphNodesStart, subsetGraphNodesEnd);
    istanbulDataset.nodes.zIndex = istanbulDataset.nodes.zIndex.subarray(subsetGraphNodesStart, subsetGraphNodesEnd);
    
    // istanbulDataset.nodes.features.forEach((a, i) => {

    //     istanbulDataset.nodes.features[i] = a.subarray(subsetGraphNodesStart, subsetGraphNodesEnd);
    // });

    let i = 0;
    let subsetGraphConnectionsStart = istanbulDataset.connectionCount;
    let subsetGraphConnectionsEnd = 0;
    while (
        istanbulDataset.connections.from[i] < subsetGraphNodesEnd
    ) {

        if (
            istanbulDataset.connections.to[i] >= subsetGraphNodesStart &&
            istanbulDataset.connections.to[i] < subsetGraphNodesEnd &&
            istanbulDataset.connections.from[i] != istanbulDataset.connections.to[i]
        ) {
            subsetGraphConnectionsStart = Math.min(subsetGraphConnectionsStart, i);
            subsetGraphConnectionsEnd = Math.max(subsetGraphConnectionsEnd, i);
        }

        i ++;
    }

    subsetGraphConnectionsEnd = Math.min(subsetGraphConnectionsEnd, subsetGraphConnectionsStart + 10000000);

    istanbulDataset.connections.to = istanbulDataset.connections.to.subarray(subsetGraphConnectionsStart, subsetGraphConnectionsEnd);
    istanbulDataset.connections.from = istanbulDataset.connections.from.subarray(subsetGraphConnectionsStart, subsetGraphConnectionsEnd);
    istanbulDataset.connections.value = istanbulDataset.connections.value.subarray(subsetGraphConnectionsStart, subsetGraphConnectionsEnd);
    istanbulDataset.connections.zIndex = istanbulDataset.connections.zIndex.subarray(subsetGraphConnectionsStart, subsetGraphConnectionsEnd);

    // istanbulDataset.connections.features.forEach((a, i) => {

    //     istanbulDataset.connections.features[i] = a.subarray(subsetGraphConnectionsStart, subsetGraphConnectionsEnd);
    // });

    console.log("Creating visual graph");
    const visualGraph = OSigma.makeVisualGraph(istanbulDataset);
    window.visualGraph = visualGraph;

    console.log("Assigning random layout");
    visualGraph.applyRandomLayout(0, 10000);
    
    // console.log("Assigning forceAtlas2 layout");
    // visualGraph.applyForceAtlas2Layout();

    const osigma = new OSigma(visualGraph, container, {}, true, new ValueChoices());

    // console.log("Preparing visual graph");

    // visualGraph.nodes.features[osigma.nodeFlagsFeatureId].fill(OSigma.encodeNodeFlags(true, false, false, 0));
    // visualGraph.connections.features[osigma.connectionFlagsFeatureId].fill(OSigma.encodeEdgeFlags(true, false, 0));

    // visualGraph.nodes.features[osigma.nodeFlagsFeatureId].fill(OSigma.encodeNodeFlags(false, false, false, 0), subsetGraphNodesStart, subsetGraphNodesEnd);

    // const visibleConnectionFlags = OSigma.encodeEdgeFlags(true, false, 0);


    // console.log("Assigning node size");
    // graph.forEachNode((node, atts) => {
    //     atts.size = Math.sqrt(graph.degree(node)) / 2;
    //     atts.label = "N" + node;
    // });
})();
