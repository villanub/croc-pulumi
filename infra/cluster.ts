// Copyright 2016-2018, Pulumi Corporation.  All rights reserved.

import * as azure from "@pulumi/azure";
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as config from "./config";

// Create the AD service principal for the K8s cluster.
let adApp = new azure.ad.Application("aks");
let adSp = new azure.ad.ServicePrincipal("aksSp", { applicationId: adApp.applicationId });
let adSpPassword = new azure.ad.ServicePrincipalPassword("aksSpPassword", {
    servicePrincipalId: adSp.id,
    value: config.password,
    endDate: "2099-01-01T00:00:00Z",
});

//Create VNET
export const vnet = new azure.network.VirtualNetwork("vnet", {
    resourceGroupName: config.resourceGroup.name,
    location: config.location,
    addressSpaces: ["10.0.0.0/8"],
    subnets: [{
        name: "default",
        addressPrefix: "10.240.0.0/16",
    }],
});

// Now allocate an AKS cluster.
export const k8sCluster = new azure.containerservice.KubernetesCluster("aksCluster", {
    resourceGroupName: config.resourceGroup.name,
    kubernetesVersion: "1.11.4",
    location: config.location,
    agentPoolProfile: {
        name: "aksagentpool",
        count: config.nodeCount,
        vmSize: config.nodeSize,
        vnetSubnetId: vnet.id
    },
    networkProfile: {
        networkPlugin: "azure",
        dnsServiceIp: "10.0.0.10",
        dockerBridgeCidr: "172.17.0.1/16",
        podCidr: "10.240.0.0/16",
        serviceCidr: "10.0.0.0/16"
    },
    dnsPrefix: "ben-aks-pulumi",
    linuxProfile: {
        adminUsername: "aksuser",
        sshKeys: [{
            keyData: config.sshPublicKey,
        }],
    },
    servicePrincipal: {
        clientId: adApp.applicationId,
        clientSecret: adSpPassword.value,
    },
}); 

// Azure ACR
const acr = new azure.containerservice.Registry("benacr", {
    resourceGroupName: config.resourceGroup.name,
    location: config.location,
    adminEnabled: true,
    sku: "Basic"
});

// Expose a K8s provider instance using our custom cluster instance.
export const k8sProvider = new k8s.Provider("aksK8s", {
    kubeconfig: k8sCluster.kubeConfigRaw,
});
