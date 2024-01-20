import Graph from "graphology";

// import * as fss from "fs";
// import readline from "readline"

export class IstanbulEinDataset {

    public root: string;
    public einFile: string;
    public einType: IstanbulEinDataset.EinFileType;
    public featureFiles: [string, IstanbulEinDataset.FeatureFileType][];
    public globalParamsFile: string;
    public nodes: IstanbulEinDataset.Node[] = [];
    public connections: IstanbulEinDataset.Int32Connections = null;
    public globalParams: { nodes: number, links: number } = null;

    public constructor(
        root: string,
        // einFile: string = "Mini_15min.mat",
        einFile: string = "OneYearNoHead_15min.mat",
        einType: IstanbulEinDataset.EinFileType = IstanbulEinDataset.EinFileType.ConnectionMat,
        featureFiles?: [string, IstanbulEinDataset.FeatureFileType][],
        globalParamsFile: string = "global_params.json",
    ) {

        featureFiles ??= [
            ["Centrality.txt", IstanbulEinDataset.FeatureFileType.InvestorLineTxt],
            ["Degree.txt", IstanbulEinDataset.FeatureFileType.InvestorLineTxt],
            ["NumberTrades.txt", IstanbulEinDataset.FeatureFileType.InvestorLineTxt],
            ["Centrality.txt", IstanbulEinDataset.FeatureFileType.InvestorLineTxt],
            ["Profits.txt", IstanbulEinDataset.FeatureFileType.InvestorLineTxt],
            ["ProfitsExcess.txt", IstanbulEinDataset.FeatureFileType.InvestorLineTxt],
            ["Volume.txt", IstanbulEinDataset.FeatureFileType.InvestorLineTxt],
        ]

        this.root = root;
        this.einFile = einFile;
        this.einType = einType;
        this.featureFiles = featureFiles;
        this.globalParamsFile = globalParamsFile
    }

    public async loadDataset() {

        switch (this.einType) {
            case IstanbulEinDataset.EinFileType.ConnectionMat:

                await this.loadGlobalParams(this.root + "/" + this.globalParamsFile);
                await this.loadEinMat(this.root + "/" + this.einFile);
                break;

            case IstanbulEinDataset.EinFileType.ConnectionBins:

                await this.loadGlobalParams(this.root + "/" + this.globalParamsFile);
                await this.loadEinBins(this.root);
                break;

            case IstanbulEinDataset.EinFileType.ConnectionJson:
                throw Error();
                break;

            default:
                throw Error(`Unknown EIN type '${this.einType}'`);
        }
    }

    private async loadGlobalParams(globalParamsFile: string) {

        const fs = await import("fs");

        const rawFile = fs.readFileSync(globalParamsFile, "utf8");
        this.globalParams = JSON.parse(rawFile);
    }

    private async loadEinMat(einFile: string) {
        
        const fs = await import("fs");
        const readline = await import("readline");

        const einStream = fs.createReadStream(einFile);
        const lineEinStream = readline.createInterface({
            input: einStream,
            crlfDelay: Infinity
        });

        let i = 0;

        this.connections = {
            from: new Int32Array(this.globalParams.links),
            to: new Int32Array(this.globalParams.links),
            value: new Uint8Array(this.globalParams.links),
        };


        for await (const line of lineEinStream) {

            const [fromStr, toStr, valueStr] = line.split(/\s+/);

            this.connections.from[i] = parseInt(fromStr);
            this.connections.to[i] = parseInt(toStr);
            this.connections.value[i] = parseInt(valueStr);


            i += 1;

            if (i % 100000 == 0) {
                console.log(`Read ${i}::${(100 * i / this.globalParams.links).toFixed(2)}%`);
                // console.log(this.connections.from.length * this.connections.from.BYTES_PER_ELEMENT / 1024 / 1024);
            }
        }
    }
    
    private async loadEinBins(
        einFolder: string,
        fromName: string = "ein_from.bin",
        toName: string = "ein_to.bin",
        valueName: string = "ein_value.bin",
    ) {

        const fs = await import("fs");


        this.connections = {
            from: null,
            to: null,
            value: null,
        };

        // const toRead: [string, string, (buffer: Buffer) => Int32Array | Uint8Array][] = [
        //     [fromName, "from", (buffer: Buffer) => new Int32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4)],
        //     [toName, "to", (buffer: Buffer) => new Int32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4)],
        //     [valueName, "value", (buffer: Buffer) => new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.length)],
        // ]
        const toRead: [string, string, (buffer: Buffer) => Int32Array | Uint8Array][] = [
            [fromName, "from", (buffer: Buffer) => Int32Array.from(buffer)],
            [toName, "to", (buffer: Buffer) => Int32Array.from(buffer)],
            [valueName, "value", (buffer: Buffer) => Uint8Array.from(buffer)],
        ]
        
        for (const element of toRead) {

            const [fileName, propertyName, constructor] = element;

            const data = fs.readFileSync(einFolder + "/" + fileName);
            this.connections[propertyName] = constructor(data);

            console.log(`Loaded ${fileName}`);
        }

        console.log("Finished loading");

    }

    private loadFeatureInvestorLineTxt() {

    }

    public async saveAsJson(savePath: string) {

        const fs = await import("fs");

        const writeStream = fs.createWriteStream(savePath, {
            flags: "w",
        });

        writeStream.write("[\n");

        for (let i = 0; i < this.connections.from.length; i++) {

            const written = writeStream.write(`[${this.connections.from[i]},${this.connections.to[i]},${this.connections.value[i]}]${i < this.connections.from.length - 1 ? ',' : ''}\n`);

            if (i % 100000 == 0) {
                console.log(`Save ${i}::${(100 * i / this.connections.from.length).toFixed(2)}%`);
                // console.log(this.connections.from.length * this.connections.from.BYTES_PER_ELEMENT / 1024 / 1024);
            }

            if (!written) {

                // console.log("Will drain");
                // console.time("drain");

                await new Promise(resolve => {
                    
                    writeStream.once("drain", resolve);
                });
                
                // console.timeEnd("drain");
                
            }
        }

        writeStream.write("]\n");
    }

    public async saveAsBins(
        saveFolder: string,
        fromName: string = "ein_from.bin",
        toName: string = "ein_to.bin",
        valueName: string = "ein_value.bin",
    ) {

        const fs = await import("fs");

        const toWrite: [string, Int32Array | Uint8Array][] = [
            [fromName, this.connections.from],
            [toName, this.connections.to],
            [valueName, this.connections.value],
        ]

        for (const element of toWrite) {

            const [name, value] = element;
            fs.writeFileSync(saveFolder + "/" + name, Buffer.from(value));
            console.log(`Saved ${name} to ${saveFolder}`);
        }

        console.log("Saving is done");
    }
}

export namespace IstanbulEinDataset {

    export enum FeatureFileType {
        InvestorLineTxt
    }

    export enum EinFileType {
        ConnectionMat,
        ConnectionJson,
        ConnectionBins,
    }

    export class Node {

        id: number;
        features: [];
    }

    export interface Int32Connections {

        from: Int32Array;
        to: Int32Array;
        value: Uint8Array;
    }
}