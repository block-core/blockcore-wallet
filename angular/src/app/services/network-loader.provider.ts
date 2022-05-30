import { NetworkStatusStore } from "src/shared";
import { NetworkLoader } from ".";

const networkLoaderServiceFactory = (store: NetworkStatusStore) =>
    new NetworkLoader(store);

export const networkLoaderServiceProvider =
{
    provide: NetworkLoader,
    useFactory: networkLoaderServiceFactory,
    deps: [NetworkStatusStore]
};