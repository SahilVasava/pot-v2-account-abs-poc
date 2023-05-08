import Head from 'next/head'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import { BigNumber, Contract, utils } from 'ethers'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useSigner, useProvider } from 'wagmi'
import kleoHubABI from '@/abi/kleoHub.json'
import simpleAccountABI from '@/abi/simpleAccount.json'
import { ZeroDevSigner } from 'zerodevappsdk'
import { useEffect, useState } from 'react'
import axios from 'axios'

const inter = Inter({ subsets: ['latin'] })

// const kleoHubAddress = '0x3960e80919434FB55feE9Ff3e0B8F784b6Fe666E'; // goerli
// const signatureVerifier = '0x933D2D7192C63DdAEFfe1793301A5d667C5d41b7'; // goerli

const kleoHubAddress = '0xb6E912A24B32A2D0Db6331ebAa9B1CC068Dfc4E4'; // mumbai
const signatureVerifier = '0x1041eB121cD1b7200f7B352026b21A2D69f2f333'; // mumbai


export default function Home() {
  const { address, isConnected } = useAccount();
  const provider = useProvider()
  const { data: signer } = useSigner<ZeroDevSigner>()
  const [genHash, setGenHash] = useState('')
  const [delHash, setDelHash] = useState('')

  const deleteSignals = async () => {
    try {
      setDelHash('')
      if (!signer) return
      const contract = new Contract(kleoHubAddress, kleoHubABI, signer)
      if (!contract || !address) return
      const gasEstimated = await contract.estimateGas.deleteSignals([1], address)
      const gas = calcGas(gasEstimated);
      const tx = await contract.deleteSignals([1], address, {...gas})
      console.log('tx', tx)
      setDelHash(tx.hash)

    } catch (error) {
      console.log(error)
    }
  }
  
  const generateSignals = async () => {
    try {
      setGenHash('')
      const response = await fetch('/api/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ destination: address, tokenId: 1 })
      })
      const { request, proofData } = await response.json()
      console.log('data', request, proofData)
      if (!signer) return
      const contract = new Contract(kleoHubAddress, kleoHubABI, signer)
      if (!contract || !request || !proofData || !address) return
      // const resp =  await contract.estimateGas.generateSignals(request, signatureVerifier, proofData)
      // console.log('resp', resp)
      // const code = await provider.getCode(address)
      // console.log('code', code)
      const gasEstimated = await contract.estimateGas.generateSignals(request, signatureVerifier, proofData)
      const gas = await calcGas(gasEstimated);
      const tx = await contract.generateSignals(request, signatureVerifier, proofData, {...gas})
      console.log('tx', tx)
      setGenHash(tx.hash)

    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (!address) return
    (async () => {
      const contract = new Contract(address, simpleAccountABI, provider)
      console.log('nonce', await contract.getNonce())
    })()
  }, [address, provider])
  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main} ${inter.className}`}>
        <ConnectButton />
        <button onClick={generateSignals}>Generate Signals</button>
        {genHash && <a href={`https://app.jiffyscan.xyz/userOpHash/${genHash}?network=mumbai`} target='_blank'>Jiffyscan Generate Transaction link</a>}
        {genHash && <a href={`https://mumbai.polygonscan.com/tx/${genHash}`} target='_blank'>Generate Transaction link</a>}
        <button onClick={deleteSignals}>Delete Signals</button>
        {delHash && <a href={`https://app.jiffyscan.xyz/userOpHash/${delHash}?network=mumbai`} target='_blank'>Jiffyscan Delete Transaction link</a>}
        {delHash && <a href={`https://mumbai.polygonscan.com/tx/${delHash}`} target='_blank'>Delete Transaction link</a>}
      </main >
    </>
  )
}

function parse(data: number) {
  return utils.parseUnits(Math.ceil(data) + "", "gwei");
}
type Gas = {
  gasLimit: BigNumber;
  maxFeePerGas: BigNumber;
  maxPriorityFeePerGas: BigNumber;
};
async function calcGas(gasEstimated: BigNumber): Promise<Gas> {
  const gas = {
    gasLimit: gasEstimated.mul(110).div(100),
    maxFeePerGas: BigNumber.from(40000000000),
    maxPriorityFeePerGas: BigNumber.from(40000000000),
  };
  try {
    const { data } = await axios({
      method: "get",
      url: "https://gasstation-mumbai.matic.today/v2",
    });
    gas.maxFeePerGas = parse(data.fast.maxFee);
    gas.maxPriorityFeePerGas = parse(data.fast.maxPriorityFee);
  } catch (error) { }
  return gas;
}