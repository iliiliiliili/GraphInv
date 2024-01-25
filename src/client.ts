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
declare global {
    interface Window {
        istanbulDataset: IstanbulEinDataset,
        graph: Graph,
        debug: any,
    }
}

const istanbulDataset = new IstanbulEinDataset("./data/istanbul", "", IstanbulEinDataset.EinFileType.ConnectionBinsWeb);
window.istanbulDataset = istanbulDataset;

(async () => {

    console.log ("Reading the dataset");
    await istanbulDataset.loadDataset();
    console.log ("Dataset loaded");
    
    const subsetGraphNodesStart = 200000;
    const subsetGraphNodesEnd = 200000 + 10000;
    
    console.log("Creating the graph");
    const graph = new Graph();
    window.graph = graph;

    for (let i = subsetGraphNodesStart; i < subsetGraphNodesEnd; i++) {

        graph.addNode(i);
    }

    let i = 0;
    while (
        istanbulDataset.connections.from[i] < subsetGraphNodesEnd
    ) {

        if (
            istanbulDataset.connections.to[i] >= subsetGraphNodesStart &&
            istanbulDataset.connections.to[i] < subsetGraphNodesEnd &&
            istanbulDataset.connections.from[i] != istanbulDataset.connections.to[i]
        ) {
            console.log("Add edge")

            graph.addEdge(
                istanbulDataset.connections.from[i],
                istanbulDataset.connections.to[i],
                {
                    weight: istanbulDataset.connections.value[i]
                }
            )
        }

        i ++;
    }

    console.log("Graph created");
    
    console.log("Assigning circular");
    circular.assign(graph);
    console.log("Assigning forceAtlas2");
    forceAtlas2.assign(graph, {
        iterations: 10,
        settings: {
            barnesHutOptimize: true,
        }
    });
    
    console.log("Assigning node size");
    graph.forEachNode((node, atts) => {
        atts.size = Math.sqrt(graph.degree(node)) / 2;
        atts.label = "N" + node;
    });
    
    let highlightEdges: string[] = [];
    let hoverNode: string | null = null;
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
})();
