import * as k8s from "@pulumi/kubernetes";
import * as azure from "@pulumi/azure";
import * as config from "./config";

// Create an AKS cluster.
import { k8sCluster, k8sProvider } from "./cluster";

// Export kubeconfig file, cluster name, and public IP address for Kubernetes application. These can
// be accessed from the CLI, like: `pulumi stack output kubeconfig > kubeconfig.yaml`.
export const kubeconfig = k8sCluster.kubeConfig;
export const cluster = k8sCluster.name;

