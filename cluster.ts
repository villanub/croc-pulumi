// Copyright 2016-2018, Pulumi Corporation.  All rights reserved.

import * as azure from "@pulumi/azure";
import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";
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

// Now allocate an AKS cluster.
export const k8sCluster = new azure.containerservice.KubernetesCluster("aksCluster", {
    resourceGroupName: config.resourceGroup.name,
    location: config.location,
    agentPoolProfile: {
        name: "aksagentpool",
        count: config.nodeCount,
        vmSize: config.nodeSize,
    },
    dnsPrefix: `${pulumi.getStack()}-kube`,
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
const location = "westus";
const resourceGroupName = new azure.core.ResourceGroup("acrrg", { location }).name;
const storageAccountId = new azure.storage.Account("acrstorage", {
    resourceGroupName,
    location,
    accountTier: "Standard",
    accountReplicationType: "LRS",
}).id;
const acr = new azure.containerservice.Registry("acr", {
    resourceGroupName,
    location,
    storageAccountId,
    adminEnabled: true,
});
const image3 = new docker.Image("mynginx3", {
    imageName: acr.loginServer.apply(server => `${server}/mynginx`),
    build: "./mynginx",
    registry: {
        server: acr.loginServer,
        username: acr.adminUsername,
        password: acr.adminPassword,
    },
});
export const acrImage = image3.imageName;
// Expose a K8s provider instance using our custom cluster instance.
export const k8sProvider = new k8s.Provider("aksK8s", {
    kubeconfig: k8sCluster.kubeConfigRaw,
});
