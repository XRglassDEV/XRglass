export type XrplNetwork = "mainnet" | "testnet" | "devnet";

export type XrplNode = {
  url: string;
  name: string;
  operator?: string;
  location?: string;
  network: XrplNetwork;
  notes?: string;
};

export const XRPL_MAINNET_NODES: XrplNode[] = [
  {
    url: "wss://xrplcluster.com",
    name: "XRPL Cluster",
    operator: "XRPL Cluster",
    location: "Anycast",
    network: "mainnet",
    notes: "Highly available anycast cluster",
  },
  {
    url: "wss://s1.ripple.com",
    name: "Ripple S1",
    operator: "Ripple",
    location: "North America",
    network: "mainnet",
    notes: "Public rippled node",
  },
  {
    url: "wss://s2.ripple.com",
    name: "Ripple S2",
    operator: "Ripple",
    location: "North America",
    network: "mainnet",
  },
  {
    url: "wss://xrpl.link",
    name: "XRPL Link",
    operator: "XRPL Labs",
    location: "Europe",
    network: "mainnet",
  },
  {
    url: "wss://xrpl.ws",
    name: "XRPL.ws",
    operator: "Alloy Networks",
    location: "Europe",
    network: "mainnet",
  },
];

export const XRPL_TESTNET_NODES: XrplNode[] = [
  {
    url: "wss://s.altnet.rippletest.net:51233",
    name: "Ripple Testnet",
    operator: "Ripple",
    location: "United States",
    network: "testnet",
  },
  {
    url: "wss://s.devnet.rippletest.net:51233",
    name: "Ripple Devnet",
    operator: "Ripple",
    location: "United States",
    network: "devnet",
  },
];

export const XRPL_ALL_NODES: XrplNode[] = [
  ...XRPL_MAINNET_NODES,
  ...XRPL_TESTNET_NODES,
];
