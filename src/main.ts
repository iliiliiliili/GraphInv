import Graph from "graphology";
import { SerializedGraph } from "graphology-types";
import Sigma from "sigma";
import data from "./data/network.json";
import iwanthue from "iwanthue";
import { Coordinates } from "sigma/types";
import circular from 'graphology-layout/circular';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { IstanbulEinDataset } from "./data-readers";

const container = document.getElementById("sigma-container") as HTMLElement;

const istanbulDataset = new IstanbulEinDataset("./data/istanbul");

istanbulDataset.loadDataset().then(() => {

    console.log ("I am done");
})


const graph = Graph.from(data as SerializedGraph);

circular.assign(graph);
forceAtlas2.assign(graph, {
    iterations: 50,
    settings: {
        barnesHutOptimize: true,
    }
});

graph.forEachNode((node, atts) => {
    atts.size = Math.sqrt(graph.degree(node)) / 2;
});

let highlightEdges = [];
let hoverNode = null;
const renderer = new Sigma(graph, container, {
    // enableEdgeClickEvents: true,
    // enableEdgeWheelEvents: true,
    // enableEdgeHoverEvents: "debounce",
    edgeReducer(edge, data) {
        const res = { ...data };
        if (highlightEdges.includes(edge)) res.color = "#cc0000";
        return res;
    },
    nodeReducer(node, data) {
        const res = { ...data };
        if (hoverNode == node) {
            res.color = "#000000";
        }
        return res;
    },
});

// renderer.on("enterEdge", ({ edge }) => {
//     hoveredEdge = edge;
//     renderer.refresh();
// });
// renderer.on("leaveEdge", ({ edge }) => {
//     hoveredEdge = null;
//     renderer.refresh();
// });

renderer.on("clickNode", ({ node }) => {

});

renderer.on("enterNode", ({ node }) => {
    hoverNode = node;
    highlightEdges = graph.edges(node);

    renderer.refresh();
});

renderer.on("leaveNode", ({ node }) => {
    hoverNode = null;
    highlightEdges = []
    renderer.refresh();
});