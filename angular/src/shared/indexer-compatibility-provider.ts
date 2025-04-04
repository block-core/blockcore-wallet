
interface INetworkService {
    getPrimaryIndexer(): any;
    checkAndHandleError(response: any): void;
}

export class MempoolNetworkService implements INetworkService {
    #indexerUrl = '';

    constructor(indexerUrl: string) {
        this.#indexerUrl = indexerUrl
    }

    getPrimaryIndexer(): any {
        return { url: this.#indexerUrl };
    }
    checkAndHandleError(response: unknown): void {
        //   throw new Error("Method not implemented.");
    }

}


export class MempoolSpaceIndexerApi implements IIndexerService {
    private readonly networkService: INetworkService;

    private readonly AngorApiRoute = '/api/v1/query/Angor';
    private readonly MempoolApiRoute = '/api/v1';

    private logger = console;

    constructor(
        networkService: INetworkService
    ) {
        this.networkService = networkService;
    }

    public async getProjectsAsync(offset: number | null, limit: number): Promise<ProjectIndexerData[]> {
        const indexer = this.networkService.getPrimaryIndexer();
        const url = offset === null ?
            `${indexer.url}${this.AngorApiRoute}/projects?limit=${limit}` :
            `${indexer.url}${this.AngorApiRoute}/projects?offset=${offset}&limit=${limit}`;

        const response = await fetch(url);
        this.networkService.checkAndHandleError(response);

        if (!response.ok) {
            return [];
        }

        return await response.json();
    }

    public async getProjectByIdAsync(projectId: string): Promise<ProjectIndexerData | null> {
        if (!projectId) {
            return null;
        }

        if (projectId.length <= 1) {
            return null;
        }

        const indexer = this.networkService.getPrimaryIndexer();
        try {
            const response = await fetch(`${indexer.url}${this.AngorApiRoute}/projects/${projectId}`);
            this.networkService.checkAndHandleError(response);

            if (response.status === 404) {
                return null;
            }

            if (!response.ok) {
                throw new Error(response.statusText);
            }

            return await response.json();
        } catch (error: any) {
            if (error.status === 404) {
                return null;
            }
            throw error;
        }
    }

    public async getProjectStatsAsync(projectId: string): Promise<ProjectStats | null> {
        if (!projectId) {
            return null;
        }

        const indexer = this.networkService.getPrimaryIndexer();
        try {
            const response = await fetch(`${indexer.url}${this.AngorApiRoute}/projects/${projectId}/stats`);
            this.networkService.checkAndHandleError(response);

            if (response.status === 404) {
                return null;
            }

            if (!response.ok) {
                throw new Error(response.statusText);
            }

            return await response.json();
        } catch (error: any) {
            if (error.status === 404) {
                return null;
            }
            throw error;
        }
    }

    public async getInvestmentsAsync(projectId: string): Promise<ProjectInvestment[]> {
        const indexer = this.networkService.getPrimaryIndexer();
        const response = await fetch(`${indexer.url}${this.AngorApiRoute}/projects/${projectId}/investments`);
        this.networkService.checkAndHandleError(response);

        if (!response.ok) {
            throw new Error(response.statusText);
        }

        return await response.json();
    }

    public async getInvestmentAsync(projectId: string, investorPubKey: string): Promise<ProjectInvestment | null> {
        const indexer = this.networkService.getPrimaryIndexer();
        const response = await fetch(`${indexer.url}${this.AngorApiRoute}/projects/${projectId}/investments/${investorPubKey}`);
        this.networkService.checkAndHandleError(response);

        if (!response.ok) {
            throw new Error(response.statusText);
        }

        return await response.json();
    }

    public async publishTransactionAsync(trxHex: string): Promise<string> {
        const indexer = this.networkService.getPrimaryIndexer();
        try {
            const response = await fetch(`${indexer.url}${this.MempoolApiRoute}/tx`, {
                method: 'POST',
                body: trxHex,
                headers: {
                    'Content-Type': 'text/plain'
                }
            });

            this.networkService.checkAndHandleError(response);

            if (!response.ok) {
                return response.statusText;
            }

            const txId = await response.text();
            this.logger.info(`trx ${txId} posted`);
            return '';
        } catch (error: any) {
            return error.statusText + (error.message || '');
        }
    }

    public async getAdressBalancesAsync(data: AddressInfo[], includeUnconfirmed = false): Promise<AddressBalance[]> {
        const urlBalance = `${this.MempoolApiRoute}/address/`;
        const indexer = this.networkService.getPrimaryIndexer();

        debugger;

        const promises = data.map(x => {
            const url = indexer.url + urlBalance + x.address;
            console.log('URL:', url);
            debugger;
            return fetch(url);
        }
        );

        const results = await Promise.all(promises);
        const response: AddressBalance[] = [];

        for (const apiResponse of results) {
            this.networkService.checkAndHandleError(apiResponse);

            if (!apiResponse.ok) {
                throw new Error(apiResponse.statusText);
            }

            const addressResponse: AddressResponse = await apiResponse.json();

            if (addressResponse && (addressResponse.chainStats.txCount > 0 || addressResponse.mempoolStats.txCount > 0)) {
                response.push({
                    address: addressResponse.address,
                    balance: addressResponse.chainStats.fundedTxoSum - addressResponse.chainStats.spentTxoSum,
                    pendingReceived: addressResponse.mempoolStats.fundedTxoSum - addressResponse.mempoolStats.spentTxoSum
                });
            }
        }

        return response;
    }

    public async fetchUtxoAsync(address: string, limit: number, offset: number): Promise<UtxoData[] | null> {
        const indexer = this.networkService.getPrimaryIndexer();
        const txsUrl = `${this.MempoolApiRoute}/address/${address}/txs`;

        const response = await fetch(indexer.url + txsUrl);
        this.networkService.checkAndHandleError(response);

        if (!response.ok) {
            throw new Error(response.statusText);
        }

        const trx: MempoolTransaction[] = await response.json();
        const utxoDataList: UtxoData[] = [];

        for (const mempoolTransaction of trx) {
            if (mempoolTransaction.vout.every(v => v.scriptpubkeyAddress !== address)) {
                // this trx has no outputs with the requested address.
                continue;
            }

            const outspendsUrl = `${this.MempoolApiRoute}/tx/${mempoolTransaction.txid}/outspends`;
            const resultsOutputs = await fetch(indexer.url + outspendsUrl);

            if (!resultsOutputs.ok) {
                throw new Error(resultsOutputs.statusText);
            }

            const spentOutputsStatus: Outspent[] = await resultsOutputs.json();

            for (let index = 0; index < mempoolTransaction.vout.length; index++) {
                const vout = mempoolTransaction.vout[index];

                if (vout.scriptpubkeyAddress === address) {
                    if (mempoolTransaction.status.confirmed && spentOutputsStatus[index].spent) {
                        continue;
                    }

                    const data: UtxoData = {
                        address: vout.scriptpubkeyAddress,
                        scriptHex: vout.scriptpubkey,
                        outpoint: new Outpoint(mempoolTransaction.txid, index),
                        value: vout.value,
                    };

                    if (mempoolTransaction.status.confirmed) {
                        data.blockIndex = mempoolTransaction.status.blockHeight;
                    }

                    if (spentOutputsStatus[index].spent) {
                        data.pendingSpent = true;
                    }

                    utxoDataList.push(data);
                }
            }
        }

        return utxoDataList;
    }

    public async getFeeEstimationAsync(confirmations: number[]): Promise<FeeEstimations | null> {
        const indexer = this.networkService.getPrimaryIndexer();
        const url = `${this.MempoolApiRoute}/fees/recommended`;

        try {
            const response = await fetch(indexer.url + url);
            this.networkService.checkAndHandleError(response);

            if (!response.ok) {
                this.logger.error(`Error: ${response.statusText}`);
                return null;
            }

            const feeEstimations: RecommendedFees = await response.json();

            return {
                fees: [
                    { feeRate: feeEstimations.fastestFee * 1100, confirmations: 1 }, // TODO this is an estimation
                    { feeRate: feeEstimations.halfHourFee * 1100, confirmations: 3 },
                    { feeRate: feeEstimations.hourFee * 1100, confirmations: 6 },
                    { feeRate: feeEstimations.economyFee * 1100, confirmations: 18 }, // TODO this is an estimation
                ]
            };
        } catch (error) {
            this.logger.error(`Error: ${error}`);
            return null;
        }
    }

    public async getTransactionHexByIdAsync(transactionId: string): Promise<string> {
        const indexer = this.networkService.getPrimaryIndexer();
        const url = `${this.MempoolApiRoute}/tx/${transactionId}/hex`;

        const response = await fetch(indexer.url + url);
        this.networkService.checkAndHandleError(response);

        if (!response.ok) {
            throw new Error(response.statusText);
        }

        return await response.text();
    }

    public async getTransactionInfoByIdAsync(transactionId: string): Promise<QueryTransaction | null> {
        const indexer = this.networkService.getPrimaryIndexer();
        const url = `${this.MempoolApiRoute}/tx/${transactionId}`;

        const response = await fetch(indexer.url + url);
        this.networkService.checkAndHandleError(response);

        if (!response.ok) {
            throw new Error(response.statusText);
        }

        const trx: MempoolTransaction = await response.json();

        const urlSpent = `${this.MempoolApiRoute}/tx/${transactionId}/outspends`;
        const spendsResponse = await fetch(indexer.url + urlSpent);
        this.networkService.checkAndHandleError(spendsResponse);

        if (!spendsResponse.ok) {
            throw new Error(spendsResponse.statusText);
        }

        const spends: Outspent[] = await spendsResponse.json();

        await this.populateSpentMissingData(spends, trx);

        return {
            transactionId: trx.txid,
            timestamp: trx.status.blockTime,
            inputs: trx.vin.map((x, i) => ({
                inputIndex: x.vout,
                inputTransactionId: x.txid,
                witScript: new WitScript(x.witness.map(s => this.hexToBytes(s))).toScript().toHex(),
            })),
            outputs: trx.vout.map((x, i) => ({
                address: x.scriptpubkeyAddress, // TODO check that this is correct
                balance: x.value,
                index: i,
                scriptPubKey: x.scriptpubkey,
                outputType: x.scriptpubkeyType,
                scriptPubKeyAsm: x.scriptpubkeyAsm,
                spentInTransaction: spends[i]?.txid
            }))
        };
    }

    private async populateSpentMissingData(outspents: Outspent[], mempoolTransaction: MempoolTransaction): Promise<void> {
        const indexer = this.networkService.getPrimaryIndexer();

        for (let index = 0; index < outspents.length; index++) {
            const outspent = outspents[index];

            if (outspent.spent && outspent.txid == null) {
                const output = mempoolTransaction.vout[index];
                if (output != null && output.scriptpubkeyAddress) {
                    const txsUrl = `${this.MempoolApiRoute}/address/${output.scriptpubkeyAddress}/txs`;

                    const response = await fetch(indexer.url + txsUrl);
                    this.networkService.checkAndHandleError(response);

                    if (!response.ok) {
                        throw new Error(response.statusText);
                    }

                    const trx: MempoolTransaction[] = await response.json();

                    let found = false;
                    for (const transaction of trx) {
                        let vinIndex = 0;
                        for (const vin of transaction.vin) {
                            if (vin.txid === mempoolTransaction.txid && vin.vout === index) {
                                outspent.txid = transaction.txid;
                                outspent.vin = vinIndex;

                                found = true;
                                break;
                            }

                            vinIndex++;
                        }

                        if (found) break;
                    }
                }
            }
        }
    }

    public async checkIndexerNetwork(indexerUrl: string): Promise<[boolean, string | null]> {
        try {
            // fetch block 0 (Genesis Block)
            const blockUrl = `${indexerUrl}${this.MempoolApiRoute}/block-height/0`;

            const response = await fetch(blockUrl);

            if (!response.ok) {
                this.logger.warn(`Failed to fetch genesis block from: ${blockUrl}`);
                return [false, null];
            }

            const blockHash = await response.text();

            if (typeof blockHash !== 'string') {
                this.logger.warn(`Invalid response from genesis block: ${blockUrl}`);
                return [false, null];
            }

            return [true, blockHash]; // Indexer is online with valid block hash
        }
        catch (ex) {
            this.logger.error(`Error during indexer network check: ${ex}`, ex);
            return [false, null];
        }
    }

    public validateGenesisBlockHash(fetchedHash: string, expectedHash: string): boolean {
        return fetchedHash.toLowerCase().startsWith(expectedHash.toLowerCase()) || !fetchedHash;
    }

    // Helper method for hex to bytes conversion
    private hexToBytes(hex: string): Uint8Array {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
        }
        return bytes;
    }
}

// Interface declarations required for the implementation
interface IIndexerService {
    getProjectsAsync(offset: number | null, limit: number): Promise<ProjectIndexerData[]>;
    getProjectByIdAsync(projectId: string): Promise<ProjectIndexerData | null>;
    getProjectStatsAsync(projectId: string): Promise<ProjectStats | null>;
    getInvestmentsAsync(projectId: string): Promise<ProjectInvestment[]>;
    getInvestmentAsync(projectId: string, investorPubKey: string): Promise<ProjectInvestment | null>;
    publishTransactionAsync(trxHex: string): Promise<string>;
    getAdressBalancesAsync(data: AddressInfo[], includeUnconfirmed?: boolean): Promise<AddressBalance[]>;
    fetchUtxoAsync(address: string, limit: number, offset: number): Promise<UtxoData[] | null>;
    getFeeEstimationAsync(confirmations: number[]): Promise<FeeEstimations | null>;
    getTransactionHexByIdAsync(transactionId: string): Promise<string>;
    getTransactionInfoByIdAsync(transactionId: string): Promise<QueryTransaction | null>;
    checkIndexerNetwork(indexerUrl: string): Promise<[boolean, string | null]>;
    validateGenesisBlockHash(fetchedHash: string, expectedHash: string): boolean;
}

interface INetworkConfiguration {
    // Add required properties
}

interface INetworkService {
    getPrimaryIndexer(): any;
    checkAndHandleError(response: any): void;
}

interface AddressInfo {
    address: string;
}

interface AddressBalance {
    address: string;
    balance: number;
    pendingReceived: number;
}

interface ProjectIndexerData {
    // Add required properties
}

interface ProjectStats {
    // Add required properties  
}

interface ProjectInvestment {
    // Add required properties
}

interface UtxoData {
    address: string;
    scriptHex: string;
    outpoint: Outpoint;
    value: number;
    blockIndex?: number;
    pendingSpent?: boolean;
}

interface QueryTransaction {
    transactionId: string;
    timestamp: number;
    inputs: QueryTransactionInput[];
    outputs: QueryTransactionOutput[];
}

interface QueryTransactionInput {
    inputIndex: number;
    inputTransactionId: string;
    witScript: string;
}

interface QueryTransactionOutput {
    address: string;
    balance: number;
    index: number;
    scriptPubKey: string;
    outputType: string;
    scriptPubKeyAsm: string;
    spentInTransaction?: string;
}

interface FeeEstimations {
    fees: FeeEstimation[];
}

interface FeeEstimation {
    feeRate: number;
    confirmations: number;
}

interface AddressStats {
    fundedTxCount: number;
    fundedTxoSum: number;
    spentTxocount: number;
    spentTxoSum: number;
    txCount: number;
}

interface AddressResponse {
    address: string;
    chainStats: AddressStats;
    mempoolStats: AddressStats;
}

interface AddressUtxo {
    txid: string;
    vout: number;
    status: UtxoStatus;
    value: number;
}

interface UtxoStatus {
    confirmed: boolean;
    blockHeight: number;
    blockHash: string;
    blockTime: number;
}

interface RecommendedFees {
    fastestFee: number;
    halfHourFee: number;
    hourFee: number;
    economyFee: number;
    minimumFee: number;
}

interface Vin {
    isCoinbase: boolean;
    prevout: PrevOut;
    scriptsig: string;
    asm: string;
    sequence: number;
    txid: string;
    vout: number;
    witness: string[];
    innserRedeemscriptAsm: string;
    innerWitnessscriptAsm: string;
}

interface PrevOut {
    value: number;
    scriptpubkey: string;
    scriptpubkeyAddress: string;
    scriptpubkeyAsm: string;
    scriptpubkeyType: string;
}

interface MempoolTransaction {
    txid: string;
    version: number;
    locktime: number;
    size: number;
    weight: number;
    fee: number;
    vin: Vin[];
    vout: PrevOut[];
    status: UtxoStatus;
}

interface Outspent {
    spent: boolean;
    txid: string;
    vin: number;
    status: UtxoStatus;
}

// These classes would need to be implemented or imported
class Outpoint {
    constructor(public txid: string, public n: number) { }
}

class WitScript {
    constructor(private data: Uint8Array[]) { }

    toScript(): { toHex: () => string } {
        // This would need real implementation
        return {
            toHex: () => {
                return this.data.map(arr => this.bytesToHex(arr)).join('');
            }
        };
    }

    private bytesToHex(bytes: Uint8Array): string {
        return Array.from(bytes)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }
}