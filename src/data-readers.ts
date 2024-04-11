import { TypedArray } from "osigma/core/ograph";
import * as core from "./core";

import { OSigma, OGraph } from "osigma";

const defaultFeatureCreator = <TNodeFeatures>(count: number) =>
    [
        new Int32Array(count),
        new Float32Array(count),
        new Int32Array(count),
        new Float32Array(count),
        new Float32Array(count),
        new Float32Array(count),
    ] as TNodeFeatures;

export class IstanbulEinDataset<
    TNodeFeatures extends TypedArray[] = [
        Int32Array,
        Float32Array,
        Int32Array,
        Float32Array,
        Float32Array,
        Float32Array
    ]
> extends OGraph<
    Int32Array,
    Uint8Array,
    Float32Array,
    Uint8Array,
    TNodeFeatures,
    []
> {
    public root: string;
    public einFile: string;
    public einType: IstanbulEinDataset.EinFileType;
    public featureFiles: [
        string,
        IstanbulEinDataset.FeatureFileType,
        (a: string) => number
    ][];
    public featureCreators: (count: number) => TNodeFeatures;
    public globalParamsFile: string;
    public globalParams: { nodes: number; links: number } = null;

    public constructor(
        root: string,
        // einFile: string = "Mini_15min.mat",
        einFile: string = "OneYearNoHead_15min.mat",
        einType: IstanbulEinDataset.EinFileType = IstanbulEinDataset.EinFileType
            .ConnectionMatNode,
        featureFiles?: [
            string,
            IstanbulEinDataset.FeatureFileType,
            (a: string) => number
        ][],
        featureCreators: (
            count: number
        ) => TNodeFeatures = defaultFeatureCreator,
        globalParamsFile: string = "global_params.json"
    ) {
        featureFiles ??= [
            [
                "feature_degree_${FILE_ID}.bin",
                IstanbulEinDataset.FeatureFileType.InvestorBinWeb,
                (a) => Math.floor(parseFloat(a)),
            ],
            [
                "feature_centrality_${FILE_ID}.bin",
                IstanbulEinDataset.FeatureFileType.InvestorBinWeb,
                (a) => parseFloat(a),
            ],
            [
                "feature_number_of_trades_${FILE_ID}.bin",
                IstanbulEinDataset.FeatureFileType.InvestorBinWeb,
                (a) => Math.floor(parseFloat(a)),
            ],
            [
                "feature_profits_${FILE_ID}.bin",
                IstanbulEinDataset.FeatureFileType.InvestorBinWeb,
                (a) => parseFloat(a),
            ],
            [
                "feature_profits_excess_${FILE_ID}.bin",
                IstanbulEinDataset.FeatureFileType.InvestorBinWeb,
                (a) => parseFloat(a),
            ],
            [
                "feature_volume_${FILE_ID}.bin",
                IstanbulEinDataset.FeatureFileType.InvestorBinWeb,
                (a) => parseFloat(a),
            ],
        ];

        super(
            {
                features: featureCreators(0),
                xCoordinates: new Float32Array(),
                yCoordinates: new Float32Array(),
                zIndex: new Uint8Array(),
            },
            {
                features: [],
                from: new Int32Array(),
                to: new Int32Array(),
                value: new Uint8Array(),
                zIndex: new Uint8Array(),
            }
        );

        this.root = root;
        this.einFile = einFile;
        this.einType = einType;
        this.featureFiles = featureFiles;
        this.globalParamsFile = globalParamsFile;
        this.featureCreators = featureCreators;
    }

    get nodeCount(): number {
        if (this.nodes.features.length > 0) {
            return super.nodeCount;
        }

        return this.globalParams.nodes;
    }

    public async loadDataset() {
        switch (this.einType) {
            case IstanbulEinDataset.EinFileType.ConnectionMatNode:
                await this.loadGlobalParams(
                    this.root + "/" + this.globalParamsFile,
                    IstanbulEinDataset.Background.Node
                );
                await this.loadEinMat(this.root + "/" + this.einFile);
                break;

            case IstanbulEinDataset.EinFileType.ConnectionBinsNode:
                await this.loadGlobalParams(
                    this.root + "/" + this.globalParamsFile,
                    IstanbulEinDataset.Background.Node
                );
                await this.loadEinBins(
                    this.root,
                    IstanbulEinDataset.Background.Node
                );
                break;

            case IstanbulEinDataset.EinFileType.ConnectionBinsWeb:
                await this.loadGlobalParams(
                    this.root + "/" + this.globalParamsFile,
                    IstanbulEinDataset.Background.Web
                );
                await this.loadEinBins(
                    this.root,
                    IstanbulEinDataset.Background.Web
                );
                break;

            case IstanbulEinDataset.EinFileType.ConnectionJson:
                throw Error();
                break;

            default:
                throw Error(`Unknown EIN type '${this.einType}'`);
        }

        await this.loadFeatures();
    }

    private async loadFeatures() {
        this.nodes.features = this.featureCreators(this.globalParams.nodes);

        let featureIndex = 0;

        for (const featureFile of this.featureFiles) {
            const [name, type, parse] = featureFile;

            switch (type) {
                case IstanbulEinDataset.FeatureFileType.InvestorLineTxtNode:
                    console.log(`Loading node feature ${name}.`);
                    await this.loadNodeFeatureTxt(
                        this.root + "/" + name,
                        featureIndex,
                        parse
                    );

                    break;
                case IstanbulEinDataset.FeatureFileType.InvestorBinNode:
                    console.log(`Loading node feature bin ${name}.`);
                    await this.loadNodeFeatureBin(
                        this.root,
                        name,
                        featureIndex,
                        IstanbulEinDataset.Background.Node
                    );
                    break;
                case IstanbulEinDataset.FeatureFileType.InvestorBinWeb:
                    console.log(`Loading node feature bin ${name}.`);
                    await this.loadNodeFeatureBin(
                        this.root,
                        name,
                        featureIndex,
                        IstanbulEinDataset.Background.Web
                    );

                    break;

                default:
                    throw Error(`Unknown FeatureFileType'${type}'`);
            }

            featureIndex++;
        }
    }

    private async loadNodeFeatureTxt(
        file: string,
        featureIndex: number,
        parse: (a: string) => number
    ) {
        const fs = await import("fs");
        const readline = await import("readline");

        const stream = fs.createReadStream(file);
        const linestream = readline.createInterface({
            input: stream,
            crlfDelay: Infinity,
        });

        let i = 0;

        this.nodes.features[featureIndex];

        for await (const line of linestream) {
            const value = parse(line.replace("\n", "").replace("\r", ""));

            this.nodes.features[featureIndex][i] = value;

            i++;

            if (i % 100000 == 0) {
                console.log(
                    `Read ${i}::${((100 * i) / this.globalParams.nodes).toFixed(
                        2
                    )}%`
                );
            }
        }
    }

    private async loadNodeFeatureBin(
        folder: string,
        fileName: string,
        featureIndex: number,
        background: IstanbulEinDataset.Background,
        fileCount = 1
    ) {
        const fs =
            background == IstanbulEinDataset.Background.Node
                ? await import("fs")
                : null;

        let offset: number = 0;

        for (let fileId = 0; fileId < fileCount; fileId++) {
            let localFileName = fileName.replace(
                "${FILE_ID}",
                fileId.toString()
            );
            let data: Buffer = undefined;
            let typedData: TypedArray = undefined;

            switch (background) {
                case IstanbulEinDataset.Background.Node:
                    data = fs.readFileSync(folder + "/" + localFileName);
                    typedData = core.bufferToTypedArrayNode(
                        data,
                        this.nodes.features[featureIndex]
                    );
                    break;
                case IstanbulEinDataset.Background.Web:
                    data = (await core.readFileFromServer(
                        folder + "/" + localFileName,
                        core.ServerFileType.Binary
                    )) as Buffer;
                    typedData = core.bufferToTypedArrayWeb(
                        data,
                        this.nodes.features[featureIndex]
                    );
                    break;
                default:
                    throw Error();
            }

            this.nodes.features[featureIndex].set(typedData, offset);
            offset += typedData.length;

            console.log(`Loaded ${localFileName}`);
        }
    }

    private async loadGlobalParams(
        globalParamsFile: string,
        background: IstanbulEinDataset.Background
    ) {
        switch (background) {
            case IstanbulEinDataset.Background.Node:
                const fs = await import("fs");
                const rawFile = fs.readFileSync(globalParamsFile, "utf8");
                this.globalParams = JSON.parse(rawFile);
                break;
            case IstanbulEinDataset.Background.Web:
                this.globalParams = (await core.readFileFromServer(
                    globalParamsFile,
                    core.ServerFileType.Json
                )) as { nodes: number; links: number };
                break;

            default:
                throw Error();
        }
    }

    private async loadEinMat(einFile: string) {
        const fs = await import("fs");
        const readline = await import("readline");

        const einStream = fs.createReadStream(einFile);
        const lineEinStream = readline.createInterface({
            input: einStream,
            crlfDelay: Infinity,
        });

        let i = 0;

        this.nodes.xCoordinates = new Float32Array(this.globalParams.nodes);
        this.nodes.yCoordinates = new Float32Array(this.globalParams.nodes);
        this.nodes.zIndex = new Uint8Array(this.globalParams.nodes);

        this.connections = {
            from: new Int32Array(this.globalParams.links),
            to: new Int32Array(this.globalParams.links),
            value: new Uint8Array(this.globalParams.links),
            zIndex: new Uint8Array(this.globalParams.links),
            features: [],
        };

        for await (const line of lineEinStream) {
            const [fromStr, toStr, valueStr] = line.split(/\s+/);

            this.connections.from[i] = parseInt(fromStr);
            this.connections.to[i] = parseInt(toStr);
            this.connections.value[i] = parseInt(valueStr);

            i += 1;

            if (i % 100000 == 0) {
                console.log(
                    `Read ${i}::${((100 * i) / this.globalParams.links).toFixed(
                        2
                    )}%`
                );
                // console.log(this.connections.from.length * this.connections.from.BYTES_PER_ELEMENT / 1024 / 1024);
            }
        }
    }

    private async loadEinBins(
        einFolder: string,
        background: IstanbulEinDataset.Background,
        fromName: string = "ein_from_${FILE_ID}.bin",
        toName: string = "ein_to_${FILE_ID}.bin",
        valueName: string = "ein_value_${FILE_ID}.bin",
        fileCounts: number[] = [2, 2, 1]
    ) {
        const fs =
            background == IstanbulEinDataset.Background.Node
                ? await import("fs")
                : null;

        this.nodes.xCoordinates = new Float32Array(this.globalParams.nodes);
        this.nodes.yCoordinates = new Float32Array(this.globalParams.nodes);
        this.nodes.zIndex = new Uint8Array(this.globalParams.nodes);

        this.connections = {
            from: new Int32Array(this.globalParams.links),
            to: new Int32Array(this.globalParams.links),
            value: new Uint8Array(this.globalParams.links),
            zIndex: new Uint8Array(this.globalParams.links),
            features: [],
        };

        // const toRead: [string, string, (buffer: Buffer) => Int32Array | Uint8Array][] = [
        //     [fromName, "from", (buffer: Buffer) => new Int32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4)],
        //     [toName, "to", (buffer: Buffer) => new Int32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4)],
        //     [valueName, "value", (buffer: Buffer) => new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.length)],
        // ]
        const toRead: [
            string,
            "from" | "to" | "value",
            (buffer: Buffer) => Int32Array | Uint8Array,
            (buffer: Buffer) => Int32Array | Uint8Array
        ][] = [
            [
                fromName,
                "from",
                (buffer: Buffer) =>
                    new Int32Array(
                        buffer.buffer,
                        buffer.byteOffset,
                        buffer.length / 4
                    ),
                (buffer: Buffer) => new Int32Array(buffer),
            ],
            [
                toName,
                "to",
                (buffer: Buffer) =>
                    new Int32Array(
                        buffer.buffer,
                        buffer.byteOffset,
                        buffer.length / 4
                    ),
                (buffer: Buffer) => new Int32Array(buffer),
            ],
            [
                valueName,
                "value",
                (buffer: Buffer) =>
                    new Uint8Array(
                        buffer.buffer,
                        buffer.byteOffset,
                        buffer.length
                    ),
                (buffer: Buffer) => new Uint8Array(buffer),
            ],
        ];

        let elementId = 0;

        for (const element of toRead) {
            const [fileName, propertyName, constructorNode, constructorWeb] =
                element;

            let offset: number = 0;

            for (let fileId = 0; fileId < fileCounts[elementId]; fileId++) {
                let localFileName = fileName.replace(
                    "${FILE_ID}",
                    fileId.toString()
                );
                let data: Buffer = undefined;
                let typedData: Int32Array | Uint8Array = undefined;

                switch (background) {
                    case IstanbulEinDataset.Background.Node:
                        data = fs.readFileSync(einFolder + "/" + localFileName);
                        typedData = constructorNode(data);
                        break;
                    case IstanbulEinDataset.Background.Web:
                        data = (await core.readFileFromServer(
                            einFolder + "/" + localFileName,
                            core.ServerFileType.Binary
                        )) as Buffer;
                        typedData = constructorWeb(data);
                        break;
                    default:
                        throw Error();
                }

                this.connections[propertyName].set(typedData, offset);
                offset += typedData.length;

                console.log(`Loaded ${localFileName}`);
            }

            elementId++;
        }

        console.log("Finished loading");
    }

    public async saveAsJson(savePath: string) {
        const fs = await import("fs");

        const writeStream = fs.createWriteStream(savePath, {
            flags: "w",
        });

        writeStream.write("[\n");

        for (let i = 0; i < this.connections.from.length; i++) {
            const written = writeStream.write(
                `[${this.connections.from[i]},${this.connections.to[i]},${
                    this.connections.value[i]
                }]${i < this.connections.from.length - 1 ? "," : ""}\n`
            );

            if (i % 100000 == 0) {
                console.log(
                    `Save ${i}::${(
                        (100 * i) /
                        this.connections.from.length
                    ).toFixed(2)}%`
                );
                // console.log(this.connections.from.length * this.connections.from.BYTES_PER_ELEMENT / 1024 / 1024);
            }

            if (!written) {
                // console.log("Will drain");
                // console.time("drain");

                await new Promise((resolve) => {
                    writeStream.once("drain", resolve);
                });

                // console.timeEnd("drain");
            }
        }

        writeStream.write("]\n");
    }

    public async saveAsPajekNet(savePath: string) {
        const fs = await import("fs");

        const writeStream = fs.createWriteStream(savePath, {
            flags: "w",
        });

        writeStream.write(`*Vertices ${this.globalParams.nodes}\n`);
        writeStream.write("*arcs\n");

        for (let i = 0; i < this.connections.from.length; i++) {
            const written = writeStream.write(
                `${this.connections.from[i] + 1} ${
                    this.connections.to[i] + 1
                } ${this.connections.value[i]}\n`
            );

            if (i % 100000 == 0) {
                console.log(
                    `Save ${i}::${(
                        (100 * i) /
                        this.connections.from.length
                    ).toFixed(2)}%`
                );
                // console.log(this.connections.from.length * this.connections.from.BYTES_PER_ELEMENT / 1024 / 1024);
            }

            if (!written) {
                // console.log("Will drain");
                // console.time("drain");

                await new Promise((resolve) => {
                    writeStream.once("drain", resolve);
                });

                // console.timeEnd("drain");
            }
        }

        writeStream.write("\n");
    }

    public async saveAsBins(
        saveFolder: string,
        fromName: string = "ein_from_${FILE_ID}.bin",
        toName: string = "ein_to_${FILE_ID}.bin",
        valueName: string = "ein_value_${FILE_ID}.bin",
        nodeFeatureNames: string[] = [
            "feature_degree_${FILE_ID}.bin",
            "feature_centrality_${FILE_ID}.bin",
            "feature_number_of_trades_${FILE_ID}.bin",
            "feature_profits_${FILE_ID}.bin",
            "feature_profits_excess_${FILE_ID}.bin",
            "feature_volume_${FILE_ID}.bin",
        ]
    ) {
        const toWrite: [string, TypedArray][] = [
            [fromName, this.connections.from],
            [toName, this.connections.to],
            [valueName, this.connections.value],
        ];

        for (let i = 0; i < nodeFeatureNames.length; i++) {
            toWrite.push([nodeFeatureNames[i], this.nodes.features[i]]);
        }

        for (const element of toWrite) {
            const [name, value] = element;
            await core.writeLargeArrayBuffferToFile(
                saveFolder + "/" + name,
                value,
                core.WriteType.WriteIntoSeparateFiles
            );
            console.log(`Saved ${name} to ${saveFolder}`);
        }

        console.log("Saving is done");
    }
}

export namespace IstanbulEinDataset {
    export enum FeatureFileType {
        InvestorLineTxtNode,
        InvestorBinNode,
        InvestorBinWeb,
    }

    export enum Background {
        Node,
        Web,
    }

    export enum EinFileType {
        ConnectionMatNode,
        ConnectionJson,
        ConnectionBinsNode,
        ConnectionBinsWeb,
    }
}
