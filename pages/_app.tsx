import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import '@rainbow-me/rainbowkit/styles.css';
import {
  googleWallet,
  facebookWallet,
  githubWallet,
  discordWallet,
  twitchWallet,
  twitterWallet,
  enhanceWalletWithAAConnector,
} from '@zerodevapp/wagmi/rainbowkit';
import {
  RainbowKitProvider,
  connectorsForWallets,
} from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { configureChains, createClient, WagmiConfig } from 'wagmi';
import { polygonMumbai, goerli } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { infuraProvider } from 'wagmi/providers/infura';
import accounts from '../lib/accountsWrapper';



const infuraId = process.env.NEXT_PUBLIC_INFURA_ID;
if (infuraId == null) {
  throw Error(`[WAGMI]: Failed to initialize infuraId`);
}

const { chains, provider } = configureChains(
  [polygonMumbai, goerli],
  [
    infuraProvider({apiKey: infuraId}),
    publicProvider(),
  ]
);

// YOUR ZERODEV PROJECT ID
const projectId = '8db3f9f0-f8d0-4c69-9bc6-5c522ee25844'; // mumbai
// const projectId = '54891df3-fb74-44c5-8e7b-7d604b430b70'; // goerli
const factoryAddress = '0xA1993c220119a71f981508A993189E51Ff6A85a9'; //mumbai
// const factoryAddress = '0x448681A8CF38A7Fb28EA4139C445ac77b1489d47'; //goerli
// const factoryAddress = '0xA1993c220119a71f981508A993189E51Ff6A85a9'; //goerli
// const factoryAddress = '0x09c58cf6be8E25560d479bd52B4417d15bCA2845'; //eth-infinitsm mumbai

// const rpcProviderUrl = 'https://rpc.ankr.com/polygon_mumbai';
const rpcProviderUrl = `https://goerli.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`;
const accountAPIClass = accounts?.simpleAccount_v1_audited.accountAPIClass;
const implementation = accounts ? { factoryAddress, accountAPIClass } : undefined;
// const implementation = gnosisSafeAccount_v1_unaudited;


const connectors = connectorsForWallets([
  {
    groupName: 'Social',
    wallets: [
      googleWallet({ options: { projectId, implementation }, chains }),
      facebookWallet({
        options: { projectId, implementation }, chains
      }),
      githubWallet({ options: { projectId, implementation }, chains}),
      discordWallet({ options: { projectId, implementation }, chains }),
      twitchWallet({ options: { projectId, implementation }, chains }),
      twitterWallet({ options: { projectId, implementation }, chains }),
    ],
  },
  {
    groupName: 'AA Wallets',
    wallets: [
      enhanceWalletWithAAConnector(metaMaskWallet({ chains }), {
        projectId,
        implementation
      }),
      enhanceWalletWithAAConnector(walletConnectWallet({ chains }), {
        projectId,
        implementation
      }),
    ],
  },
  // { groupName: 'Non-AA Wallets', wallets: [
  //   metaMaskWallet({ chains }),
  // ]}
]);

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

export default function App({ Component, pageProps }: AppProps) {
  return (<WagmiConfig client={wagmiClient}>
    <RainbowKitProvider chains={chains}>
      <Component {...pageProps} />
    </RainbowKitProvider>
  </WagmiConfig>)
}
