// Copyright 2016-2018, Pulumi Corporation.  All rights reserved.

import * as azure from "@pulumi/azure";
import * as pulumi from "@pulumi/pulumi";

// Parse and export configuration variables for this stack.
const config = new pulumi.Config();
export const password = config.require("password");
export const location = config.get("location") || "West US";
export const failoverLocation = config.get("failoverLocation") || "East US 2";
export const nodeCount = config.getNumber("nodeCount") || 2;
export const nodeSize = config.get("nodeSize") || "Standard_B2ms";
export const sshPublicKey = config.require("sshPublicKey");
export const resourceGroup = new azure.core.ResourceGroup("ben-aks-pulumi", { location });
