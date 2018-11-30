import * as azure from "@pulumi/azure";
import * as config from "./config";

export const vnet = new azure.network.VirtualNetwork("vnet", {
    resourceGroupName: config.resourceGroup.name,
    location: config.location,
    addressSpaces: ["10.0.0.0/8"],
    subnets: [{
        name: "default",
        addressPrefix: "10.240.0.0/16",
    }],
});

export const vnetID = vnet.id