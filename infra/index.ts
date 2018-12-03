
import * as azure from "@pulumi/azure";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config("aks");
const sshPublicKey = config.require("sshPublicKey");
const clientId = config.require("clientId");
const clientSecret = config.require("clientSecret");

const resourceGroup = new azure.core.ResourceGroup("ben-aks", {
    location: "West US",
});

//Create Kubernetes Cluster
const kubernetesService = new azure.containerservice.KubernetesCluster("ben-kubernetes", {
    resourceGroupName: resourceGroup.name,
    kubernetesVersion: "1.11.4",
    location: resourceGroup.location,
    agentPoolProfile: {
        name: "agentpool",
        count: 2,
        vmSize: "Standard_B2ms",
    },
    dnsPrefix: `${pulumi.getStack()}-kubernetes`,
    linuxProfile: {
        adminUsername: "azureuser",
        sshKeys: [{
            keyData: sshPublicKey,
        }],
    },
    servicePrincipal: {
        clientId: clientId,
        clientSecret: clientSecret,
    },
}); 

// Azure ACR
const acr = new azure.containerservice.Registry("benacr", {
    resourceGroupName: resourceGroup.name,
    location: "West US",
    adminEnabled: true,
    sku: "Basic"
});

export const kubeConfigRaw = kubernetesService.kubeConfigRaw;